// Pure business logic extracted from store.jsx so it can be unit-tested
// without React or a DOM. store.jsx imports everything from here.

import { CHAPTERS, BANKS } from "./data";

export const KEY = "hk-progress-v2";
export const XP_PER_LEVEL = 525;
export const STEP = [0, 3, 7, 21]; // Leitner box → days until due

export const iso = (d) => d.toISOString().slice(0, 10);

export const startOfWeek = (d) => {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); // back to Monday
  return r;
};

export const todayISO = () => iso(new Date());

export const dayPlus = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const schedule = (box) =>
  box >= STEP.length ? null : { box, due: dayPlus(STEP[box]) };

export function seed() {
  return {
    done: CHAPTERS.map(() => 0),
    hardDone: CHAPTERS.map(() => 0),
    hard: false,
    xp: 0, answered: 0, correctAns: 0,
    week: {}, wrong: {}, reading: {}, dialogues: {}, srs: {},
    reviewDoneDate: null,
  };
}

export const fitLen = (arr) =>
  Array.from({ length: CHAPTERS.length }, (_, i) =>
    (Array.isArray(arr) ? arr[i] : undefined) ?? 0);

export function load(storage = localStorage) {
  try {
    const v = JSON.parse(storage.getItem(KEY));
    if (v && Array.isArray(v.done)) {
      v.done = fitLen(v.done);
      v.hardDone = fitLen(v.hardDone);
      if (typeof v.hard !== "boolean") v.hard = false;
      if (!v.reading || typeof v.reading !== "object") v.reading = {};
      if (!v.dialogues || typeof v.dialogues !== "object") v.dialogues = {};
      if (!v.srs || typeof v.srs !== "object") v.srs = {};
      return v;
    }
    [
      "hk-progress-v1", "hk-home-sel", "hk-home-exp",
      "hk-prac-chapters", "hk-prac-themes-v2", "hk-prac-diff",
    ].forEach((k) => storage.removeItem(k));
  } catch (e) {}
  return seed();
}

// Pure reducer — takes previous state, returns next state. No side effects.
export function applyCompleteLesson(prev, { chapterIdx, unitIdx, correct, total, missed, solved, hard }, todayFn = todayISO) {
  const passed = correct >= Math.ceil(total * 0.8);
  const useHard = hard && chapterIdx != null && BANKS[CHAPTERS[chapterIdx]?.id];
  const key = useHard ? "hardDone" : "done";
  const arr = prev[key].slice();
  if (passed && chapterIdx != null && unitIdx != null)
    arr[chapterIdx] = Math.min(
      CHAPTERS[chapterIdx].units.length,
      Math.max(arr[chapterIdx], unitIdx + 1),
    );
  const today = todayFn();
  const week = { ...prev.week, [today]: (prev.week[today] || 0) + 1 };
  const wrong = { ...prev.wrong };
  const srs = { ...prev.srs };
  (missed || []).forEach((m) => {
    const k = `${m.prompt}|${m.answer}`;
    wrong[k] = (wrong[k] || 0) + 1;
    srs[k] = schedule(0);
  });
  (solved || []).forEach((s) => {
    if (s.type === "concept") return;
    const k = `${s.prompt}|${s.answer}`;
    if (srs[k]) {
      const next = schedule(srs[k].box + 1);
      if (next) srs[k] = next; else delete srs[k];
    } else {
      srs[k] = schedule(1);
    }
  });
  const bonus = hard ? 1.5 : 1;
  return {
    ...prev, [key]: arr, week, wrong, srs,
    xp: prev.xp + Math.round((correct * 6 + (passed ? 8 : 0)) * bonus),
    answered: prev.answered + total,
    correctAns: prev.correctAns + correct,
  };
}

export function applyRecordReading(prev, packId, plays) {
  const reading = { ...(prev.reading || {}) };
  const cur = reading[packId] || {};
  const words = { ...(cur.words || {}) };
  let sum = 0, n = 0;
  (plays || []).forEach(({ jp, ms, correct }) => {
    const w = words[jp] || { best: null, last: null, reads: 0 };
    w.last = ms;
    w.best = w.best == null ? ms : Math.min(w.best, ms);
    w.reads += 1;
    words[jp] = w;
    if (correct) { sum += ms; n += 1; }
  });
  const avg = n ? sum / n : null;
  reading[packId] = {
    words,
    plays: (cur.plays || 0) + 1,
    bestAvgMs: avg == null
      ? (cur.bestAvgMs ?? null)
      : (cur.bestAvgMs == null ? avg : Math.min(cur.bestAvgMs, avg)),
  };
  return { ...prev, reading };
}

export function applyRecordDialogue(prev, id, { pct, levelIdx }) {
  const dialogues = { ...(prev.dialogues || {}) };
  const cur = dialogues[id] || { plays: 0, bestPct: 0, clearedLevel: -1 };
  dialogues[id] = {
    plays: cur.plays + 1,
    bestPct: Math.max(cur.bestPct, pct),
    clearedLevel: pct >= 80
      ? Math.max(cur.clearedLevel, levelIdx)
      : cur.clearedLevel,
  };
  return { ...prev, dialogues };
}

export function applyResetFromChapter(prev, chapterIdx) {
  const done = prev.done.slice();
  const hardDone = prev.hardDone.slice();
  for (let i = chapterIdx; i < done.length; i++) { done[i] = 0; hardDone[i] = 0; }
  return { ...prev, done, hardDone, srs: {} };
}

export function deriveReviewDue(srs, reviewDoneDate, todayFn = todayISO) {
  const REVIEW_CAP = 15;
  const today = todayFn();
  const reviewKeys = Object.keys(srs || {}).filter(
    (k) => ((srs[k] && srs[k].due) || today) <= today,
  );
  const reviewDue = reviewDoneDate === today ? 0 : Math.min(reviewKeys.length, REVIEW_CAP);
  return { reviewKeys, reviewDue };
}
