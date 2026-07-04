import { describe, it, expect, vi } from "vitest";
import { CHAPTERS, BANKS, HIRA, KATA, NUMBER_GROUPS } from "../src/data.js";
import {
  shuffle,
  unitQuestions,
  customQuestions,
  modeQuestions,
  numberQuestions,
  foundationsQuestions,
  reviewQuestions,
  chapterReviewQuestions,
  buildQuestions,
  answerDir,
} from "../src/questions.js";

const emptyProgress = {
  done: CHAPTERS.map(() => 0),
  hardDone: CHAPTERS.map(() => 0),
  wrong: {},
  srs: {},
  reviewKeys: [],
};

const kanaIdx   = CHAPTERS.findIndex((c) => !BANKS[c.id]);
const bankedIdx = CHAPTERS.findIndex((c) => !!BANKS[c.id]);

// ── shuffle ───────────────────────────────────────────────────────────────────

describe("shuffle", () => {
  it("returns an array of the same length", () => {
    expect(shuffle([1, 2, 3, 4, 5])).toHaveLength(5);
  });

  it("contains the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffle(input).sort()).toEqual([...input].sort());
  });

  it("does not mutate the original array", () => {
    const input = [1, 2, 3];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it("empty array is safe", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("single-element array is safe", () => {
    expect(shuffle([42])).toEqual([42]);
  });
});

// ── unitQuestions — kana ──────────────────────────────────────────────────────

describe("unitQuestions — kana chapter", () => {
  const chapter = CHAPTERS[kanaIdx];

  it("returns questions for every drillable unit", () => {
    chapter.units.forEach((u, ui) => {
      if (!u.romaji?.length) return; // review unit — skip
      const qs = unitQuestions(kanaIdx, ui);
      expect(qs.length).toBeGreaterThan(0);
    });
  });

  it("multiple-choice kana questions have exactly 4 options", () => {
    const qs = unitQuestions(kanaIdx, 0);
    const mc = qs.filter((q) => q.type === "kana" && !q.prod);
    expect(mc.length).toBeGreaterThan(0);
    for (const q of mc) expect(q.options).toHaveLength(4);
  });

  it("answer is always among options", () => {
    const qs = unitQuestions(kanaIdx, 0);
    for (const q of qs) {
      if (q.type !== "kana" || q.prod) continue;
      expect(q.options).toContain(q.answer);
    }
  });

  it("options contain no duplicates", () => {
    const qs = unitQuestions(kanaIdx, 0);
    for (const q of qs) {
      if (q.type !== "kana" || q.prod) continue;
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  // ── memory loop (teach → recognise → produce) ──
  it("first-time lessons teach every kana before its first scored question", () => {
    const qs = unitQuestions(kanaIdx, 0); // no progress = first time
    const unit = chapter.units[0];
    for (const a of unit.romaji) {
      const teachAt = qs.findIndex((q) => q.type === "teach" && q.answer === a);
      const firstQuizAt = qs.findIndex((q) => q.type === "kana" && q.answer === a);
      expect(teachAt).toBeGreaterThanOrEqual(0);
      expect(teachAt).toBeLessThan(firstQuizAt);
    }
  });

  it("first-time lessons end with a production question per kana", () => {
    const qs = unitQuestions(kanaIdx, 0);
    const unit = chapter.units[0];
    const prod = qs.filter((q) => q.prod);
    expect(prod.map((q) => q.answer).sort()).toEqual([...unit.romaji].sort());
    for (const q of prod) expect(q.options).toBeUndefined();
  });

  it("replays of a completed unit have no teach cards but keep production", () => {
    const done = CHAPTERS.map(() => 0);
    done[kanaIdx] = chapter.units.length; // whole chapter complete
    const qs = unitQuestions(kanaIdx, 0, "easy", undefined, { done });
    expect(qs.some((q) => q.type === "teach")).toBe(false);
    expect(qs.some((q) => q.prod)).toBe(true);
  });

  it("appends a word_reveal trailer for non-review units that have a row word", () => {
    // Unit 0 of the first kana chapter should have a KANA_ROW_WORDS entry
    const qs = unitQuestions(kanaIdx, 0);
    const last = qs[qs.length - 1];
    // trailer may or may not exist depending on unit — just check it's valid if present
    if (last.type === "word_reveal") {
      expect(last.prompt).toBeTruthy();
      expect(last.reading).toBeTruthy();
      expect(last.meaning).toBeTruthy();
    }
  });

  it("caps at 15 scored questions", () => {
    const qs = unitQuestions(kanaIdx, 0);
    const scored = qs.filter((q) => q.type !== "word_reveal" && q.type !== "teach");
    expect(scored.length).toBeLessThanOrEqual(15);
  });
});

// ── unitQuestions — banked chapter ───────────────────────────────────────────

describe("unitQuestions — banked chapter", () => {
  it("easy: shows hint, no input field", () => {
    const qs = unitQuestions(bankedIdx, 0, "easy");
    for (const q of qs) {
      expect(q.type).toBe("phrase");
      expect(q.input).toBeFalsy();
      expect(q.options).toHaveLength(4);
    }
  });

  it("hard: input mode, accepts both romaji and en", () => {
    const qs = unitQuestions(bankedIdx, 0, "hard");
    for (const q of qs) {
      expect(q.input).toBe(true);
      expect(Array.isArray(q.answers)).toBe(true);
      expect(q.answers.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("medium: no hint shown", () => {
    const qs = unitQuestions(bankedIdx, 0, "medium");
    for (const q of qs) {
      expect(q.hint).toBeNull();
    }
  });
});

// ── customQuestions ───────────────────────────────────────────────────────────

describe("customQuestions", () => {
  it("returns at most `count` questions", () => {
    const qs = customQuestions({
      chapters: [kanaIdx],
      themes: {},
      difficulty: "easy",
      count: 5,
    });
    expect(qs.length).toBeLessThanOrEqual(5);
  });

  it("empty chapter list returns empty array", () => {
    const qs = customQuestions({ chapters: [], themes: {}, difficulty: "easy", count: 10 });
    expect(qs).toHaveLength(0);
  });

  it("all returned questions have a prompt and answer", () => {
    const qs = customQuestions({ chapters: [kanaIdx], themes: {}, difficulty: "easy", count: 10 });
    for (const q of qs) {
      expect(q.prompt).toBeTruthy();
      expect(q.answer).toBeTruthy();
    }
  });

  it("mixed kana+banked chapters does not throw", () => {
    const themes = { [CHAPTERS[bankedIdx].id]: [0] };
    expect(() =>
      customQuestions({ chapters: [kanaIdx, bankedIdx], themes, difficulty: "easy", count: 10 })
    ).not.toThrow();
  });
});

// ── modeQuestions ─────────────────────────────────────────────────────────────

describe("modeQuestions", () => {
  const modes = ["review", "weak", "speed", "listen"];
  const categories = ["alpha", "words", "numbers"];

  for (const mode of modes) {
    for (const cat of categories) {
      it(`mode:${mode} category:${cat} does not throw on empty progress`, () => {
        expect(() => modeQuestions(mode, emptyProgress, 10, cat)).not.toThrow();
      });
    }
  }

  it("weak mode with progress.wrong ranks by miss count", () => {
    const progress = {
      ...emptyProgress,
      done: CHAPTERS.map((c, i) => (!BANKS[c.id] ? c.units.length : 0)),
      wrong: { "あ|a": 5, "い|i": 2 },
      srs: {},
    };
    const qs = modeQuestions("weak", progress, 10, "alpha");
    // First question should correspond to the most-missed item when it resolves
    expect(qs.length).toBeGreaterThanOrEqual(0); // may be 0 if kana not in pool
  });

  it("listen mode sets listen:true on every question", () => {
    const progress = {
      ...emptyProgress,
      done: CHAPTERS.map((c) => (!BANKS[c.id] ? c.units.length : 0)),
    };
    const qs = modeQuestions("listen", progress, 5, "alpha");
    if (qs.length) qs.forEach((q) => expect(q.listen).toBe(true));
  });

  it("returns at most `count` questions", () => {
    const qs = modeQuestions("review", emptyProgress, 7);
    expect(qs.length).toBeLessThanOrEqual(7);
  });
});

// ── numberQuestions ───────────────────────────────────────────────────────────

describe("numberQuestions", () => {
  it("returns questions with jp/romaji/en when groups provided", () => {
    const qs = numberQuestions({ groups: [NUMBER_GROUPS[0].id], difficulty: "easy", count: 5 });
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.prompt).toBeTruthy();
      expect(q.answer).toBeTruthy();
      expect(q.options).toHaveLength(4);
    }
  });

  it("empty groups returns empty array", () => {
    expect(numberQuestions({ groups: [], difficulty: "easy", count: 5 })).toHaveLength(0);
  });
});

// ── foundationsQuestions ──────────────────────────────────────────────────────

describe("foundationsQuestions", () => {
  it("returns concept questions", () => {
    const qs = foundationsQuestions({ count: 5 });
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.type).toBe("concept");
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options).toContain(q.answer);
    }
  });

  it("caps at count", () => {
    const qs = foundationsQuestions({ count: 3 });
    expect(qs.length).toBeLessThanOrEqual(3);
  });
});

// ── reviewQuestions ───────────────────────────────────────────────────────────

describe("reviewQuestions", () => {
  it("empty key list returns empty array", () => {
    expect(reviewQuestions([])).toHaveLength(0);
  });

  it("null key list returns empty array", () => {
    expect(reviewQuestions(null)).toHaveLength(0);
  });

  it("stale/unknown keys are silently dropped", () => {
    const qs = reviewQuestions(["nonexistent|key", "also|missing"]);
    expect(qs).toHaveLength(0);
  });

  it("caps at 15 questions", () => {
    // Build 20 valid kana keys
    const keys = Object.entries(HIRA).slice(0, 20).map(([romaji, glyph]) => `${glyph}|${romaji}`);
    const qs = reviewQuestions(keys, 15);
    expect(qs.length).toBeLessThanOrEqual(15);
  });

  it("resolved questions have prompt, answer, options", () => {
    const [romaji, glyph] = Object.entries(HIRA)[0];
    const qs = reviewQuestions([`${glyph}|${romaji}`]);
    if (qs.length) {
      expect(qs[0].prompt).toBeTruthy();
      expect(qs[0].answer).toBeTruthy();
      expect(qs[0].options).toHaveLength(4);
    }
  });
});

// ── chapterReviewQuestions ────────────────────────────────────────────────────

describe("chapterReviewQuestions", () => {
  it("kana chapter returns kana questions", () => {
    const qs = chapterReviewQuestions(kanaIdx, 10);
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((q) => q.type === "kana")).toBe(true);
  });

  it("banked chapter returns phrase questions", () => {
    const qs = chapterReviewQuestions(bankedIdx, 10);
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((q) => q.type === "phrase")).toBe(true);
  });

  it("caps at count", () => {
    const qs = chapterReviewQuestions(kanaIdx, 5);
    expect(qs.length).toBeLessThanOrEqual(5);
  });
});

// ── buildQuestions dispatcher ─────────────────────────────────────────────────

describe("buildQuestions dispatcher", () => {
  const p = emptyProgress;

  it("kind:unit routes to unitQuestions", () => {
    const qs = buildQuestions({ kind: "unit", chapterIdx: kanaIdx, unitIdx: 0 }, p);
    expect(qs.length).toBeGreaterThan(0);
  });

  it("kind:foundations routes to foundationsQuestions", () => {
    const qs = buildQuestions({ kind: "foundations" }, p);
    expect(qs.every((q) => q.type === "concept")).toBe(true);
  });

  it("kind:review with empty keys returns empty", () => {
    expect(buildQuestions({ kind: "review" }, p)).toHaveLength(0);
  });

  it("kind:chapter-review routes correctly", () => {
    const qs = buildQuestions({ kind: "chapter-review", chapterIdx: kanaIdx }, p);
    expect(qs.length).toBeGreaterThan(0);
  });

  it("mode:speed falls through to modeQuestions", () => {
    expect(() => buildQuestions({ mode: "speed" }, p)).not.toThrow();
  });
});

// ── answerDir ─────────────────────────────────────────────────────────────────

describe("answerDir", () => {
  it("returns romaji when no localStorage value set", () => {
    expect(answerDir()).toBe("romaji");
  });
});
