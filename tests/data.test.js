import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  CHAPTERS, BANKS, HIRA, KATA, FOUNDATIONS, NUMBER_GROUPS,
  SENTENCES, PHRASES, COMPLEX,
  aboutMeSentences, likesSentences, bankFor,
} from "../src/data.js";

// ── localStorage stub ─────────────────────────────────────────────────────────
// data.js calls localStorage directly (no injection seam), so we stub global.
function makeStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };
}

let origLS;
beforeEach(() => { origLS = global.localStorage; });
afterEach(() => { global.localStorage = origLS; });

function setProfile(p) {
  global.localStorage = makeStorage({ "hk-profile-v1": JSON.stringify(p) });
}
function clearProfile() {
  global.localStorage = makeStorage();
}

// ── HIRA / KATA integrity ─────────────────────────────────────────────────────

describe("HIRA", () => {
  it("has entries", () => expect(Object.keys(HIRA).length).toBeGreaterThan(0));

  it("all values are non-empty strings (single glyphs or digraphs)", () => {
    for (const [k, v] of Object.entries(HIRA)) {
      expect(typeof v, `HIRA[${k}]`).toBe("string");
      expect(v.length, `HIRA[${k}]`).toBeGreaterThan(0);
    }
  });

  it("all keys are non-empty strings", () => {
    for (const k of Object.keys(HIRA)) expect(k.length).toBeGreaterThan(0);
  });

  it("keys are unique (Map round-trip)", () => {
    const keys = Object.keys(HIRA);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("KATA", () => {
  it("has entries", () => expect(Object.keys(KATA).length).toBeGreaterThan(0));

  it("all values are non-empty strings (single glyphs or digraphs)", () => {
    for (const [k, v] of Object.entries(KATA)) {
      expect(v.length, `KATA[${k}]`).toBeGreaterThan(0);
    }
  });

  it("covers the same romaji keys as HIRA", () => {
    const hiraKeys = new Set(Object.keys(HIRA));
    const kataKeys = new Set(Object.keys(KATA));
    for (const k of hiraKeys) expect(kataKeys.has(k), `KATA missing "${k}"`).toBe(true);
  });
});

// ── FOUNDATIONS integrity ─────────────────────────────────────────────────────

describe("FOUNDATIONS", () => {
  it("has at least 5 entries", () => expect(FOUNDATIONS.length).toBeGreaterThanOrEqual(5));

  it("every entry has a prompt and options array", () => {
    for (const f of FOUNDATIONS) {
      expect(f.prompt, "missing prompt").toBeTruthy();
      expect(Array.isArray(f.options), "options not array").toBe(true);
    }
  });

  it("answer is always among options", () => {
    for (const f of FOUNDATIONS) {
      expect(f.options, `"${f.prompt}" answer not in options`).toContain(f.answer);
    }
  });

  it("options has at least 2 entries on every item", () => {
    for (const f of FOUNDATIONS) {
      expect(f.options.length, `"${f.prompt}"`).toBeGreaterThanOrEqual(2);
    }
  });

  it("no duplicate options within a single entry", () => {
    for (const f of FOUNDATIONS) {
      expect(new Set(f.options).size, `"${f.prompt}" has duplicate options`).toBe(f.options.length);
    }
  });
});

// ── NUMBER_GROUPS shape ───────────────────────────────────────────────────────

describe("NUMBER_GROUPS", () => {
  it("has at least one group", () => expect(NUMBER_GROUPS.length).toBeGreaterThan(0));

  it("every group has id, label, jp, items", () => {
    for (const g of NUMBER_GROUPS) {
      expect(g.id).toBeTruthy();
      expect(g.label).toBeTruthy();
      expect(g.jp).toBeTruthy();
      expect(Array.isArray(g.items)).toBe(true);
    }
  });

  it("every item has jp, romaji, en", () => {
    for (const g of NUMBER_GROUPS) {
      for (const item of g.items) {
        expect(item.jp, `${g.id} item jp`).toBeTruthy();
        expect(item.romaji, `${g.id} item romaji`).toBeTruthy();
        expect(item.en, `${g.id} item en`).toBeTruthy();
      }
    }
  });

  it("group ids are unique", () => {
    const ids = NUMBER_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── ageWords (tested via aboutMeSentences) ────────────────────────────────────
// ageWords is not exported, so we drive it through a profile with a known dob
// that produces a predictable age. We pin the dob to a year that makes age
// deterministic relative to today (born in year currentYear - N).

function makeDob(yearsAgo) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  // Set month/day in the past to ensure birthday already passed this year.
  d.setMonth(0);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function ageSentenceFor(yearsAgo) {
  setProfile({ dob: makeDob(yearsAgo) });
  const sents = aboutMeSentences();
  return sents.find((s) => s.romaji.includes("sai"));
}

describe("ageWords via aboutMeSentences", () => {
  it("age 1 → いっさい (issai sound change)", () => {
    const s = ageSentenceFor(1);
    expect(s).toBeDefined();
    expect(s.romaji).toContain("issai");
    expect(s.jp).toContain("いっさい");
  });

  it("age 8 → はっさい (hassai sound change)", () => {
    const s = ageSentenceFor(8);
    expect(s.romaji).toContain("hassai");
    expect(s.jp).toContain("はっさい");
  });

  it("age 10 → じゅっさい (jussai sound change)", () => {
    const s = ageSentenceFor(10);
    expect(s.romaji).toContain("jussai");
    expect(s.jp).toContain("じゅっさい");
  });

  it("age 11 → じゅういっさい (compound + issai)", () => {
    const s = ageSentenceFor(11);
    expect(s.romaji).toContain("juuissai");
    expect(s.jp).toContain("じゅういっさい");
  });

  it("age 20 → にじゅっさい (tens + jussai)", () => {
    const s = ageSentenceFor(20);
    expect(s.romaji).toContain("nijussai");
    expect(s.jp).toContain("にじゅっさい");
  });

  it("age 99 → きゅうじゅうきゅうさい (plain two-digit)", () => {
    const s = ageSentenceFor(99);
    expect(s.romaji).toContain("kyuujuukyuusai");
    expect(s.jp).toContain("きゅうじゅうきゅうさい");
  });
});

// ── aboutMeSentences ──────────────────────────────────────────────────────────

describe("aboutMeSentences", () => {
  it("no profile → returns SENTENCES[0]", () => {
    clearProfile();
    expect(aboutMeSentences()).toBe(SENTENCES[0]);
  });

  it("skipped profile → returns SENTENCES[0]", () => {
    setProfile({ skipped: true });
    expect(aboutMeSentences()).toBe(SENTENCES[0]);
  });

  it("with name → includes a sentence referencing that name", () => {
    setProfile({ name: "Alex" });
    const sents = aboutMeSentences();
    const found = sents.some((s) => s.jp.includes("Alex"));
    expect(found).toBe(true);
  });

  it("with country australia → includes Australia sentence", () => {
    setProfile({ country: "australia" });
    const sents = aboutMeSentences();
    expect(sents.some((s) => s.jp.includes("オーストラリア"))).toBe(true);
  });

  it("with pets:cat → includes cat sentence", () => {
    setProfile({ pets: "cat" });
    const sents = aboutMeSentences();
    expect(sents.some((s) => s.jp.includes("ねこ") && s.jp.includes("かっています"))).toBe(true);
  });

  it("with pets:dog → includes dog sentence", () => {
    setProfile({ pets: "dog" });
    const sents = aboutMeSentences();
    expect(sents.some((s) => s.jp.includes("いぬ") && s.jp.includes("かっています"))).toBe(true);
  });

  it("with occupation:study → includes student sentence", () => {
    setProfile({ occupation: "study" });
    const sents = aboutMeSentences();
    expect(sents.some((s) => s.jp.includes("がくせい"))).toBe(true);
  });

  it("result is padded to at most 25 sentences", () => {
    setProfile({ name: "Sam", country: "uk", pets: "both", occupation: "work" });
    expect(aboutMeSentences().length).toBeLessThanOrEqual(25);
  });

  it("no duplicate romaji in output", () => {
    setProfile({ name: "Sam", country: "usa", pets: "cat" });
    const sents = aboutMeSentences();
    const romajis = sents.map((s) => s.romaji);
    expect(new Set(romajis).size).toBe(romajis.length);
  });
});

// ── likesSentences ────────────────────────────────────────────────────────────

describe("likesSentences", () => {
  it("no profile → returns base sentences unchanged", () => {
    clearProfile();
    const sents = likesSentences();
    expect(sents.length).toBeGreaterThan(0);
  });

  it("chosen hobbies appear first", () => {
    setProfile({ hobbies: ["music"] });
    const sents = likesSentences();
    expect(sents[0].jp).toContain("おんがく");
  });

  it("multiple hobbies → multiple hobby sentences at the front", () => {
    setProfile({ hobbies: ["music", "games"] });
    const sents = likesSentences();
    expect(sents[0].jp).toContain("おんがく");
    expect(sents[1].jp).toContain("ゲーム");
  });

  it("unknown hobby key is silently dropped", () => {
    setProfile({ hobbies: ["notahobby"] });
    expect(() => likesSentences()).not.toThrow();
  });

  it("no duplicate romaji in output", () => {
    setProfile({ hobbies: ["cooking", "travel"] });
    const sents = likesSentences();
    const romajis = sents.map((s) => s.romaji);
    expect(new Set(romajis).size).toBe(romajis.length);
  });
});

// ── bankFor ───────────────────────────────────────────────────────────────────

describe("bankFor", () => {
  it("phrase → PHRASES", () => {
    clearProfile();
    expect(bankFor("phrase")).toBe(PHRASES);
  });

  it("complex → COMPLEX", () => {
    clearProfile();
    expect(bankFor("complex")).toBe(COMPLEX);
  });

  it("sentence → array with aboutMeSentences at index 0", () => {
    clearProfile();
    const bank = bankFor("sentence");
    expect(Array.isArray(bank)).toBe(true);
    // First unit is always the personalized About Me result
    expect(bank[0]).toEqual(aboutMeSentences());
  });

  it("sentence bank length matches SENTENCES length", () => {
    clearProfile();
    expect(bankFor("sentence").length).toBe(SENTENCES.length);
  });

  it("sentence → does not mutate SENTENCES", () => {
    clearProfile();
    const before = SENTENCES[0];
    bankFor("sentence");
    expect(SENTENCES[0]).toBe(before);
  });

  it("unknown id → undefined", () => {
    expect(bankFor("nonexistent")).toBeUndefined();
  });
});
