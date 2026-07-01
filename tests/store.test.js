import { describe, it, expect, beforeEach, vi } from "vitest";
import { CHAPTERS } from "../src/data.js";
import {
  seed, fitLen, load,
  applyCompleteLesson,
  applyRecordReading,
  applyRecordDialogue,
  applyResetFromChapter,
  deriveReviewDue,
  STEP, XP_PER_LEVEL,
} from "../src/store.logic.js";

// Minimal in-memory localStorage stub so load() is testable without a DOM.
function makeStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };
}

const TODAY = "2025-01-15";
const todayFn = () => TODAY;

// ── seed ──────────────────────────────────────────────────────────────────────

describe("seed", () => {
  it("done array length matches CHAPTERS", () => {
    expect(seed().done).toHaveLength(CHAPTERS.length);
  });

  it("all done values start at 0", () => {
    expect(seed().done.every((n) => n === 0)).toBe(true);
  });

  it("xp starts at 0", () => {
    expect(seed().xp).toBe(0);
  });

  it("srs starts empty", () => {
    expect(seed().srs).toEqual({});
  });
});

// ── fitLen ────────────────────────────────────────────────────────────────────

describe("fitLen", () => {
  it("pads a short array with zeros", () => {
    const result = fitLen([1, 2]);
    expect(result).toHaveLength(CHAPTERS.length);
    expect(result[0]).toBe(1);
    expect(result[2]).toBe(0);
  });

  it("trims a long array", () => {
    const long = CHAPTERS.map(() => 1).concat([99, 99]);
    expect(fitLen(long)).toHaveLength(CHAPTERS.length);
  });

  it("handles non-array input gracefully", () => {
    expect(fitLen(null).every((n) => n === 0)).toBe(true);
  });
});

// ── load ──────────────────────────────────────────────────────────────────────

describe("load", () => {
  it("returns seed when storage is empty", () => {
    const s = load(makeStorage());
    expect(s.done).toHaveLength(CHAPTERS.length);
    expect(s.xp).toBe(0);
  });

  it("returns seed when stored value is invalid JSON", () => {
    const s = load(makeStorage({ "hk-progress-v2": "not-json" }));
    expect(s.done).toHaveLength(CHAPTERS.length);
  });

  it("returns seed when stored value has no done array", () => {
    const s = load(makeStorage({ "hk-progress-v2": JSON.stringify({ xp: 100 }) }));
    expect(s.xp).toBe(0);
  });

  it("loads a valid saved state and pads done array", () => {
    const saved = { ...seed(), done: [3], xp: 42 };
    const s = load(makeStorage({ "hk-progress-v2": JSON.stringify(saved) }));
    expect(s.xp).toBe(42);
    expect(s.done).toHaveLength(CHAPTERS.length);
    expect(s.done[0]).toBe(3);
    expect(s.done[1]).toBe(0);
  });

  it("backfills missing reading/dialogues/srs fields", () => {
    const saved = { ...seed() };
    delete saved.reading;
    delete saved.dialogues;
    delete saved.srs;
    const s = load(makeStorage({ "hk-progress-v2": JSON.stringify(saved) }));
    expect(s.reading).toEqual({});
    expect(s.dialogues).toEqual({});
    expect(s.srs).toEqual({});
  });

  it("coerces invalid hard value to false", () => {
    const saved = { ...seed(), hard: "yes" };
    const s = load(makeStorage({ "hk-progress-v2": JSON.stringify(saved) }));
    expect(s.hard).toBe(false);
  });
});

// ── applyCompleteLesson ───────────────────────────────────────────────────────

describe("applyCompleteLesson", () => {
  const base = seed();

  it("advances done when score ≥ 80%", () => {
    const next = applyCompleteLesson(base, {
      chapterIdx: 0, unitIdx: 0, correct: 8, total: 10, missed: [], solved: [],
    }, todayFn);
    expect(next.done[0]).toBe(1);
  });

  it("does not advance done when score < 80%", () => {
    const next = applyCompleteLesson(base, {
      chapterIdx: 0, unitIdx: 0, correct: 7, total: 10, missed: [], solved: [],
    }, todayFn);
    expect(next.done[0]).toBe(0);
  });

  it("never decrements done below its current value", () => {
    const prev = { ...base, done: base.done.map((n, i) => (i === 0 ? 3 : n)) };
    const next = applyCompleteLesson(prev, {
      chapterIdx: 0, unitIdx: 1, correct: 10, total: 10, missed: [], solved: [],
    }, todayFn);
    expect(next.done[0]).toBe(3); // already at 3, unitIdx+1=2 < 3, no change
  });

  it("adds XP for correct answers", () => {
    const next = applyCompleteLesson(base, {
      chapterIdx: 0, unitIdx: 0, correct: 10, total: 10, missed: [], solved: [],
    }, todayFn);
    // 10 * 6 + 8 (pass bonus) = 68
    expect(next.xp).toBe(68);
  });

  it("applies 1.5× XP bonus in hard mode", () => {
    const next = applyCompleteLesson(base, {
      chapterIdx: 0, unitIdx: 0, correct: 10, total: 10, missed: [], solved: [], hard: true,
    }, todayFn);
    expect(next.xp).toBe(Math.round(68 * 1.5));
  });

  it("increments answered and correctAns", () => {
    const next = applyCompleteLesson(base, {
      chapterIdx: 0, unitIdx: 0, correct: 7, total: 10, missed: [], solved: [],
    }, todayFn);
    expect(next.answered).toBe(10);
    expect(next.correctAns).toBe(7);
  });

  it("records a miss in wrong and schedules box-0 review", () => {
    const next = applyCompleteLesson(base, {
      chapterIdx: 0, unitIdx: 0, correct: 0, total: 1,
      missed: [{ prompt: "あ", answer: "a" }], solved: [],
    }, todayFn);
    expect(next.wrong["あ|a"]).toBe(1);
    expect(next.srs["あ|a"]).toBeDefined();
    expect(next.srs["あ|a"].box).toBe(0);
    expect(next.srs["あ|a"].due).toMatch(/^\d{4}-\d{2}-\d{2}$/); // schedule() uses real clock
  });

  it("increments wrong count on repeated miss", () => {
    const prev = { ...base, wrong: { "あ|a": 2 } };
    const next = applyCompleteLesson(prev, {
      chapterIdx: 0, unitIdx: 0, correct: 0, total: 1,
      missed: [{ prompt: "あ", answer: "a" }], solved: [],
    }, todayFn);
    expect(next.wrong["あ|a"]).toBe(3);
  });

  it("schedules a solved item at box 1 when not yet in pool", () => {
    const next = applyCompleteLesson(base, {
      chapterIdx: 0, unitIdx: 0, correct: 1, total: 1, missed: [],
      solved: [{ prompt: "あ", answer: "a" }],
    }, todayFn);
    expect(next.srs["あ|a"].box).toBe(1);
  });

  it("promotes an existing SRS item to the next box", () => {
    const prev = { ...base, srs: { "あ|a": { box: 1, due: TODAY } } };
    const next = applyCompleteLesson(prev, {
      chapterIdx: 0, unitIdx: 0, correct: 1, total: 1, missed: [],
      solved: [{ prompt: "あ", answer: "a" }],
    }, todayFn);
    expect(next.srs["あ|a"].box).toBe(2);
  });

  it("removes an SRS item once it graduates past the last box", () => {
    const lastBox = STEP.length - 1;
    const prev = { ...base, srs: { "あ|a": { box: lastBox, due: TODAY } } };
    const next = applyCompleteLesson(prev, {
      chapterIdx: 0, unitIdx: 0, correct: 1, total: 1, missed: [],
      solved: [{ prompt: "あ", answer: "a" }],
    }, todayFn);
    expect(next.srs["あ|a"]).toBeUndefined();
  });

  it("skips SRS scheduling for concept-type items", () => {
    const next = applyCompleteLesson(base, {
      chapterIdx: 0, unitIdx: 0, correct: 1, total: 1, missed: [],
      solved: [{ type: "concept", prompt: "は", answer: "topic marker" }],
    }, todayFn);
    expect(Object.keys(next.srs)).toHaveLength(0);
  });

  it("increments week tally for today", () => {
    const next = applyCompleteLesson(base, {
      chapterIdx: 0, unitIdx: 0, correct: 5, total: 10, missed: [], solved: [],
    }, todayFn);
    expect(next.week[TODAY]).toBe(1);
  });

  it("accumulates week tally across multiple lessons same day", () => {
    const prev = { ...base, week: { [TODAY]: 2 } };
    const next = applyCompleteLesson(prev, {
      chapterIdx: 0, unitIdx: 0, correct: 5, total: 10, missed: [], solved: [],
    }, todayFn);
    expect(next.week[TODAY]).toBe(3);
  });
});

// ── applyRecordReading ────────────────────────────────────────────────────────

describe("applyRecordReading", () => {
  const base = seed();

  it("records first play for a pack", () => {
    const next = applyRecordReading(base, "pack1", [
      { jp: "ねこ", ms: 1200, correct: true },
    ]);
    expect(next.reading["pack1"].plays).toBe(1);
    expect(next.reading["pack1"].words["ねこ"].last).toBe(1200);
    expect(next.reading["pack1"].words["ねこ"].best).toBe(1200);
    expect(next.reading["pack1"].words["ねこ"].reads).toBe(1);
  });

  it("best time only decreases", () => {
    const prev = applyRecordReading(base, "pack1", [{ jp: "ねこ", ms: 1000, correct: true }]);
    const next = applyRecordReading(prev, "pack1", [{ jp: "ねこ", ms: 1500, correct: true }]);
    expect(next.reading["pack1"].words["ねこ"].best).toBe(1000);
    expect(next.reading["pack1"].words["ねこ"].last).toBe(1500);
  });

  it("bestAvgMs only decreases across sessions", () => {
    const s1 = applyRecordReading(base, "pack1", [{ jp: "ねこ", ms: 2000, correct: true }]);
    const s2 = applyRecordReading(s1, "pack1", [{ jp: "ねこ", ms: 1000, correct: true }]);
    expect(s2.reading["pack1"].bestAvgMs).toBe(1000);
    const s3 = applyRecordReading(s2, "pack1", [{ jp: "ねこ", ms: 3000, correct: true }]);
    expect(s3.reading["pack1"].bestAvgMs).toBe(1000); // didn't improve
  });

  it("bestAvgMs is null when no correct answers in session", () => {
    const next = applyRecordReading(base, "pack1", [{ jp: "ねこ", ms: 1000, correct: false }]);
    expect(next.reading["pack1"].bestAvgMs).toBeNull();
  });

  it("reads counter increments across plays", () => {
    const s1 = applyRecordReading(base, "pack1", [{ jp: "ねこ", ms: 1000, correct: true }]);
    const s2 = applyRecordReading(s1, "pack1", [{ jp: "ねこ", ms: 900, correct: true }]);
    expect(s2.reading["pack1"].words["ねこ"].reads).toBe(2);
  });
});

// ── applyRecordDialogue ───────────────────────────────────────────────────────

describe("applyRecordDialogue", () => {
  const base = seed();

  it("records first play", () => {
    const next = applyRecordDialogue(base, "d1", { pct: 90, levelIdx: 0 });
    expect(next.dialogues["d1"].plays).toBe(1);
    expect(next.dialogues["d1"].bestPct).toBe(90);
    expect(next.dialogues["d1"].clearedLevel).toBe(0);
  });

  it("bestPct only increases", () => {
    const s1 = applyRecordDialogue(base, "d1", { pct: 90, levelIdx: 0 });
    const s2 = applyRecordDialogue(s1, "d1", { pct: 60, levelIdx: 0 });
    expect(s2.dialogues["d1"].bestPct).toBe(90);
  });

  it("clearedLevel only increases", () => {
    const s1 = applyRecordDialogue(base, "d1", { pct: 90, levelIdx: 2 });
    const s2 = applyRecordDialogue(s1, "d1", { pct: 85, levelIdx: 1 });
    expect(s2.dialogues["d1"].clearedLevel).toBe(2);
  });

  it("does not set clearedLevel when pct < 80", () => {
    const next = applyRecordDialogue(base, "d1", { pct: 79, levelIdx: 3 });
    expect(next.dialogues["d1"].clearedLevel).toBe(-1);
  });

  it("increments plays each call", () => {
    const s1 = applyRecordDialogue(base, "d1", { pct: 80, levelIdx: 0 });
    const s2 = applyRecordDialogue(s1, "d1", { pct: 80, levelIdx: 0 });
    expect(s2.dialogues["d1"].plays).toBe(2);
  });
});

// ── applyResetFromChapter ─────────────────────────────────────────────────────

describe("applyResetFromChapter", () => {
  const populated = {
    ...seed(),
    done: CHAPTERS.map(() => 3),
    hardDone: CHAPTERS.map(() => 2),
    srs: { "あ|a": { box: 1, due: "2025-01-20" } },
  };

  it("zeroes done from the given index onward", () => {
    const next = applyResetFromChapter(populated, 2);
    expect(next.done[0]).toBe(3);
    expect(next.done[1]).toBe(3);
    expect(next.done[2]).toBe(0);
    expect(next.done[CHAPTERS.length - 1]).toBe(0);
  });

  it("zeroes hardDone from the given index onward", () => {
    const next = applyResetFromChapter(populated, 2);
    expect(next.hardDone[0]).toBe(2);
    expect(next.hardDone[2]).toBe(0);
  });

  it("clears the entire SRS pool", () => {
    const next = applyResetFromChapter(populated, 2);
    expect(next.srs).toEqual({});
  });

  it("reset from index 0 clears everything", () => {
    const next = applyResetFromChapter(populated, 0);
    expect(next.done.every((n) => n === 0)).toBe(true);
  });
});

// ── deriveReviewDue ───────────────────────────────────────────────────────────

describe("deriveReviewDue", () => {
  it("returns zero due when srs is empty", () => {
    const { reviewDue, reviewKeys } = deriveReviewDue({}, null, todayFn);
    expect(reviewDue).toBe(0);
    expect(reviewKeys).toHaveLength(0);
  });

  it("counts items due today or earlier", () => {
    const srs = {
      "あ|a": { box: 0, due: TODAY },          // due today
      "い|i": { box: 0, due: "2025-01-10" },   // overdue
      "う|u": { box: 1, due: "2025-01-20" },   // future
    };
    const { reviewKeys } = deriveReviewDue(srs, null, todayFn);
    expect(reviewKeys).toContain("あ|a");
    expect(reviewKeys).toContain("い|i");
    expect(reviewKeys).not.toContain("う|u");
  });

  it("caps reviewDue at 15", () => {
    const srs = {};
    for (let i = 0; i < 20; i++) srs[`item${i}|x`] = { box: 0, due: TODAY };
    const { reviewDue } = deriveReviewDue(srs, null, todayFn);
    expect(reviewDue).toBe(15);
  });

  it("returns 0 due when already done today", () => {
    const srs = { "あ|a": { box: 0, due: TODAY } };
    const { reviewDue } = deriveReviewDue(srs, TODAY, todayFn);
    expect(reviewDue).toBe(0);
  });
});
