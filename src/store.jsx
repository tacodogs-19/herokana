import React from "react";
import { CHAPTERS, BANKS } from "./data";

// Persistent learner progress. Starts from zero — a brand-new learner.

const KEY = "hk-progress-v2";
const XP_PER_LEVEL = 525;

const iso = (d) => d.toISOString().slice(0, 10);
const startOfWeek = (d) => {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); // back to Monday
  return r;
};
const todayISO = () => iso(new Date());

function seed() {
  return { done: CHAPTERS.map(() => 0), hardDone: CHAPTERS.map(() => 0), hard: false,
    xp: 0, answered: 0, correctAns: 0, week: {}, wrong: {} };
}

const fitLen = (arr) => {
  const a = Array.isArray(arr) ? arr.slice(0, CHAPTERS.length) : [];
  while (a.length < CHAPTERS.length) a.push(0);
  return a;
};

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && Array.isArray(v.done)) {
      // newly added chapters start at zero; trim if any were removed
      v.done = fitLen(v.done);
      v.hardDone = fitLen(v.hardDone);
      if (typeof v.hard !== "boolean") v.hard = false;
      return v;
    }
    // first run on v2 — drop the old demo-seeded progress and UI selections
    ["hk-progress-v1", "hk-home-sel", "hk-home-exp", "hk-prac-chapters", "hk-prac-themes-v2", "hk-prac-diff"]
      .forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
  return seed();
}

const ProgressCtx = React.createContext(null);
export const useProgress = () => React.useContext(ProgressCtx);

export function ProgressProvider({ children }) {
  const [p, setP] = React.useState(load);
  React.useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
  }, [p]);

  const completeLesson = React.useCallback(({ chapterIdx, unitIdx, correct, total, missed, hard }) => {
    setP((prev) => {
      const passed = correct >= Math.ceil(total * 0.8);
      // hard-mode banked lessons advance a separate hardDone track
      const useHard = hard && chapterIdx != null && BANKS[CHAPTERS[chapterIdx].id];
      const key = useHard ? "hardDone" : "done";
      const arr = prev[key].slice();
      if (passed && chapterIdx != null && unitIdx != null)
        arr[chapterIdx] = Math.min(CHAPTERS[chapterIdx].units.length, Math.max(arr[chapterIdx], unitIdx + 1));
      const week = { ...prev.week, [todayISO()]: (prev.week[todayISO()] || 0) + 1 };
      const wrong = { ...prev.wrong };
      (missed || []).forEach((m) => {
        const k = `${m.prompt}|${m.answer}`;
        wrong[k] = (wrong[k] || 0) + 1;
      });
      // hard mode earns a little extra XP
      const bonus = hard ? 1.5 : 1;
      return {
        ...prev, [key]: arr, week, wrong,
        xp: prev.xp + Math.round((correct * 6 + (passed ? 8 : 0)) * bonus),
        answered: prev.answered + total,
        correctAns: prev.correctAns + correct,
      };
    });
  }, []);

  const setHard = React.useCallback((v) => setP((prev) => ({ ...prev, hard: !!v })), []);

  // Reset learning progress but keep the learner's earned XP.
  const resetProgress = React.useCallback(() => {
    setP((prev) => ({ ...seed(), xp: prev.xp }));
  }, []);

  const value = React.useMemo(() => {
    const totalUnits = CHAPTERS.reduce((s, c) => s + c.units.length, 0);
    const totalDone = p.done.reduce((s, n) => s + n, 0);
    let currentChapterIdx = p.done.findIndex((n, i) => n < CHAPTERS[i].units.length);
    if (currentChapterIdx === -1) currentChapterIdx = CHAPTERS.length - 1;
    const chapterState = (i) => {
      if (p.done[i] === CHAPTERS[i].units.length) return "done";
      if (i === currentChapterIdx) return "current";
      if (i < currentChapterIdx) return "done";
      return "locked";
    };
    const level = Math.floor(p.xp / XP_PER_LEVEL) + 1;
    const week = (() => {
      const mon = startOfWeek(new Date());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        return p.week[iso(d)] || 0;
      });
    })();
    // banked chapters re-masterable in hard mode
    const bankedTotal = CHAPTERS.reduce((s, c) => s + (BANKS[c.id] ? c.units.length : 0), 0);
    const hardDoneTotal = CHAPTERS.reduce((s, c, i) => s + (BANKS[c.id] ? p.hardDone[i] : 0), 0);
    return {
      ...p,
      totalUnits, totalDone,
      overallPct: Math.round((totalDone / totalUnits) * 100),
      trackComplete: totalDone >= totalUnits,
      bankedTotal, hardDoneTotal,
      currentChapterIdx, chapterState,
      level, xpToNext: level * XP_PER_LEVEL,
      accuracy: p.answered ? Math.round((p.correctAns / p.answered) * 100) : 0,
      weekBars: week,
      todayIdx: (new Date().getDay() + 6) % 7,
      completeLesson, setHard,
      resetProgress,
    };
  }, [p, completeLesson, setHard, resetProgress]);

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}
