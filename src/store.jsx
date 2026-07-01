import React from "react";
import { CHAPTERS, BANKS } from "./data";
import {
  KEY, XP_PER_LEVEL, iso, startOfWeek, todayISO,
  seed, load as loadState,
  applyCompleteLesson, applyRecordReading, applyRecordDialogue,
  applyResetFromChapter, deriveReviewDue,
} from "./store.logic.js";

const ProgressCtx = React.createContext(null);
export const useProgress = () => React.useContext(ProgressCtx);

export function ProgressProvider({ children }) {
  const [p, setP] = React.useState(() => loadState());
  React.useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
  }, [p]);
  // Ask the browser to make this origin's storage eviction-resistant, so weeks
  // of progress survive storage-pressure cleanups. ponytail: the whole
  // durability win — no IndexedDB migration needed for a few KB of progress;
  // revisit only if the data outgrows localStorage's ~5MB.
  React.useEffect(() => { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {} }, []);

  const completeLesson = React.useCallback((payload) => {
    setP((prev) => applyCompleteLesson(prev, payload));
  }, []);

  const setHard = React.useCallback((v) => setP((prev) => ({ ...prev, hard: !!v })), []);

  const recordReading = React.useCallback((packId, plays) => {
    setP((prev) => applyRecordReading(prev, packId, plays));
  }, []);

  const recordDialogue = React.useCallback((id, result) => {
    setP((prev) => applyRecordDialogue(prev, id, result));
  }, []);

  // Reset learning progress but keep the learner's earned XP.
  const resetProgress = React.useCallback(() => {
    setP((prev) => ({ ...seed(), xp: prev.xp }));
  }, []);

  const resetFromChapter = React.useCallback((chapterIdx) => {
    setP((prev) => applyResetFromChapter(prev, chapterIdx));
  }, []);

  const markReviewDone = React.useCallback(() => {
    setP((prev) => ({ ...prev, reviewDoneDate: todayISO() }));
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
    const bankedTotal = CHAPTERS.reduce((s, c) => s + (BANKS[c.id] ? c.units.length : 0), 0);
    const hardDoneTotal = CHAPTERS.reduce((s, c, i) => s + (BANKS[c.id] ? p.hardDone[i] : 0), 0);
    const { reviewKeys, reviewDue } = deriveReviewDue(p.srs, p.reviewDoneDate);
    return {
      ...p,
      totalUnits, totalDone,
      overallPct: Math.round((totalDone / totalUnits) * 100),
      trackComplete: totalDone >= totalUnits,
      bankedTotal, hardDoneTotal,
      reviewKeys, reviewDue,
      currentChapterIdx, chapterState,
      level, xpToNext: level * XP_PER_LEVEL,
      accuracy: p.answered ? Math.round((p.correctAns / p.answered) * 100) : 0,
      weekBars: week,
      todayIdx: (new Date().getDay() + 6) % 7,
      completeLesson, setHard, recordReading, recordDialogue,
      resetProgress, resetFromChapter, markReviewDone,
    };
  }, [p, completeLesson, setHard, recordReading, recordDialogue, resetProgress, resetFromChapter, markReviewDone]);

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}
