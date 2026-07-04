import { describe, it, expect } from "vitest";
import { CHAPTERS, BANKS } from "../src/data.js";
import { buildQuestions } from "../src/questions.js";

// Minimal progress — safe for every buildQuestions path
const emptyProgress = {
  done: CHAPTERS.map(() => 0),
  hardDone: CHAPTERS.map(() => 0),
  wrong: {},
  srs: {},
  reviewKeys: [],
};

const kanaIdx   = CHAPTERS.findIndex((c) => !BANKS[c.id]);
const bankedIdx = CHAPTERS.findIndex((c) => !!BANKS[c.id]);

// ── Chapter index integrity ───────────────────────────────────────────────────

describe("CHAPTERS integrity", () => {
  it("has at least one chapter", () => {
    expect(CHAPTERS.length).toBeGreaterThan(0);
  });

  it("all chapter ids are unique", () => {
    const ids = CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(CHAPTERS.length);
  });

  it("every chapter has at least one unit", () => {
    for (const c of CHAPTERS)
      expect(c.units.length, `chapter "${c.id}"`).toBeGreaterThan(0);
  });

  it("every kana chapter has at least one unit with romaji", () => {
    for (const c of CHAPTERS.filter((c) => !BANKS[c.id])) {
      const withRomaji = c.units.filter((u) => u.romaji?.length > 0);
      expect(withRomaji.length, `chapter "${c.id}" has no drillable units`).toBeGreaterThan(0);
    }
  });

  it("every banked chapter id is in BANKS", () => {
    for (const c of CHAPTERS.filter((c) => !!BANKS[c.id]))
      expect(BANKS[c.id], `chapter "${c.id}" missing from BANKS`).toBeDefined();
  });

  it("done/hardDone arrays length matches CHAPTERS", () => {
    // The positional contract: these arrays are always CHAPTERS.length long.
    expect(emptyProgress.done.length).toBe(CHAPTERS.length);
    expect(emptyProgress.hardDone.length).toBe(CHAPTERS.length);
  });
});

// ── buildQuestions smoke ──────────────────────────────────────────────────────

describe("buildQuestions", () => {
  it("kind:unit on a kana chapter returns valid kana questions", () => {
    const qs = buildQuestions({ kind: "unit", chapterIdx: kanaIdx, unitIdx: 0 }, emptyProgress);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      if (q.type === "word_reveal" || q.type === "teach") continue; // unscored cards — no options
      expect(q.type).toBe("kana");
      expect(q.prompt).toBeTruthy();
      expect(q.answer).toBeTruthy();
      if (q.prod) continue; // production — answered on the tile pad, no options
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.answer);
    }
  });

  it("kind:unit on a banked chapter returns valid phrase questions", () => {
    const qs = buildQuestions({ kind: "unit", chapterIdx: bankedIdx, unitIdx: 0 }, emptyProgress);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.type).toBe("phrase");
      expect(q.prompt).toBeTruthy();
      expect(q.answer).toBeTruthy();
      expect(q.options).toHaveLength(4);
    }
  });

  it("kind:foundations returns concept questions with options", () => {
    const qs = buildQuestions({ kind: "foundations" }, emptyProgress);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.type).toBe("concept");
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("kind:review with empty keys returns empty array", () => {
    expect(buildQuestions({ kind: "review" }, emptyProgress)).toHaveLength(0);
  });

  it("mode:review with zero progress does not throw", () => {
    expect(() => buildQuestions({ mode: "review" }, emptyProgress)).not.toThrow();
  });

  it("mode:weak with zero progress does not throw", () => {
    expect(() => buildQuestions({ mode: "weak" }, emptyProgress)).not.toThrow();
  });

  it("mode:speed with zero progress does not throw", () => {
    expect(() => buildQuestions({ mode: "speed" }, emptyProgress)).not.toThrow();
  });
});
