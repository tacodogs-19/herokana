import { CHAPTERS, HIRA, KATA, BANKS, bankFor, NUMBER_GROUPS, FOUNDATIONS } from "./data";

export function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const mapFor = (chapter, unit) =>
  chapter.id === "kata" || /Katakana/.test(unit.label) ? KATA : HIRA;

const kanaItem = (map, ans, mates = []) => ({ type: "kana", prompt: map[ans] || "—", answer: ans, pool: map, mates });

// Distractors that can't be solved by spotting initials: at least three of the
// four options share the answer's starting letter when the syllabary allows it
// (e.g. "ta" -> ta/te/to + one), falling back to row-mates for irregular
// romanisations like chi/tsu (whole T row) and the vowel row.
const withKanaOptions = (item) => {
  const keys = Object.keys(item.pool).filter((r) => r !== item.answer);
  const sameStart = keys.filter((r) => r[0] === item.answer[0]);
  const others = keys.filter((r) => r[0] !== item.answer[0]);
  const mates = item.mates.filter((r) => r !== item.answer);
  const pick = [];
  const add = (arr, max) => {
    for (const r of shuffle(arr)) {
      if (pick.length >= max) break;
      if (!pick.includes(r)) pick.push(r);
    }
  };
  add(sameStart, 2);
  add(mates, 3);
  add(others, 3);
  return { ...item, options: shuffle([item.answer, ...pick]) };
};

// Flat per-bank pools so phrase questions get phrase distractors and
// sentence questions get sentence distractors. Built per call because the
// sentence bank varies with the learner profile.
const poolFor = (chapterId) => bankFor(chapterId).flat();

// Banked questions ask for the romaji or the English depending on the
// "Answer in" setting, with the hint/reveal showing the opposite language.
// On hard (typed), either answer is accepted regardless.
export const answerDir = () => {
  try { const v = localStorage.getItem("hk-prac-dir"); if (v === "en" || v === "romaji") return v; } catch (e) {}
  return "romaji";
};

function bankQuestion(p, difficulty, pool, dirOverride) {
  const dir = dirOverride || answerDir();
  const other = dir === "romaji" ? "en" : "romaji";
  const q = {
    type: "phrase", prompt: p.jp, answer: p[dir],
    hint: difficulty === "easy" ? p[other] : null,
    meaning: p[other], // revealed after answering on medium/hard
    input: difficulty === "hard",
  };
  if (q.input) q.answers = [p.romaji, p.en];
  else q.options = shuffle([p[dir], ...shuffle(pool.filter((x) => x[dir] !== p[dir])).slice(0, 3).map((x) => x[dir])]);
  return q;
}

// A single Learn lesson is capped at 15 items; larger themes draw 15 at random.
const UNIT_MAX = 15;

// A unit lesson started from Home (Continue / unit chip). `dir` forces the
// answer language (used by hard mode); otherwise the practice setting applies.
export function unitQuestions(chapterIdx, unitIdx, difficulty = "easy", dir) {
  const chapter = CHAPTERS[chapterIdx];
  const unit = chapter.units[unitIdx];
  const bank = bankFor(chapter.id);
  if (bank)
    return shuffle(bank[unitIdx]).slice(0, UNIT_MAX).map((p) => bankQuestion(p, difficulty, poolFor(chapter.id), dir));
  const map = mapFor(chapter, unit);
  let items;
  // question order is shuffled so repeat runs (and parallel rows across
  // hiragana/katakana) never share an answer sequence
  if (unit.romaji.length) items = shuffle(unit.romaji).map((a) => kanaItem(map, a, unit.romaji));
  else // Review unit — sample across the whole chapter
    items = shuffle(chapter.units.flatMap((u) => u.romaji.map((a) => kanaItem(map, a, u.romaji))));
  return items.slice(0, UNIT_MAX).map(withKanaOptions);
}

// "Build a custom set" on the Practice page. `themes` maps a banked chapter
// id to the selected theme/unit indices, e.g. { phrase: [0, 2], sentence: [1] }.
export function customQuestions({ chapters, themes, difficulty, count = 10 }) {
  const kana = [];
  const banked = [];
  chapters.forEach((ci) => {
    const c = CHAPTERS[ci];
    const bank = bankFor(c.id);
    if (bank) {
      const sel = (themes && themes[c.id]) || [];
      const pool = poolFor(c.id);
      sel.forEach((ti) => (bank[ti] || []).forEach((p) => banked.push({ p, pool })));
    } else {
      c.units.forEach((u) => u.romaji.forEach((a) => kana.push(kanaItem(mapFor(c, u), a, u.romaji))));
    }
  });
  const bankedMix = shuffle(banked);
  const kanaMix = shuffle(kana);
  let bankTake = Math.min(bankedMix.length, kanaMix.length ? Math.ceil(count * 0.4) : count);
  const kanaTake = Math.min(kanaMix.length, count - bankTake);
  bankTake = Math.min(bankedMix.length, count - kanaTake); // backfill if kana ran short
  return shuffle([
    ...kanaMix.slice(0, kanaTake).map(withKanaOptions),
    ...bankedMix.slice(0, bankTake).map(({ p, pool }) => bankQuestion(p, difficulty, pool)),
  ]);
}

// Practice modes draw from everything the learner has completed so far.
export function modeQuestions(mode, progress, count = 10) {
  const learned = [];
  CHAPTERS.forEach((c, ci) => {
    if (BANKS[c.id]) return;
    c.units.forEach((u, ui) => {
      if (ui < progress.done[ci]) u.romaji.forEach((a) => learned.push(kanaItem(mapFor(c, u), a, u.romaji)));
    });
  });
  if (!learned.length)
    CHAPTERS[0].units[0].romaji.forEach((a) => learned.push(kanaItem(HIRA, a, CHAPTERS[0].units[0].romaji)));

  let base = shuffle(learned);
  if (mode === "weak") {
    const ranked = Object.entries(progress.wrong).sort((a, b) => b[1] - a[1]).map(([k]) => k.split("|"));
    const weak = ranked
      .map(([prompt, answer]) => base.find((it) => it.prompt === prompt && it.answer === answer))
      .filter(Boolean);
    base = [...weak, ...base.filter((b) => !weak.includes(b))];
  }
  const qs = base.slice(0, count).map(withKanaOptions);
  if (mode === "listen") qs.forEach((q) => { q.listen = true; });
  return qs;
}

// Numbers practice — draws from the selected number groups.
export function numberQuestions({ groups, difficulty, count = 10 }) {
  const selected = NUMBER_GROUPS.filter((g) => groups.includes(g.id));
  const items = selected.flatMap((g) => g.items);
  if (!items.length) return [];
  const pool = items; // distractors stay within the chosen ranges
  return shuffle(items).slice(0, count).map((p) => bankQuestion(p, difficulty, pool));
}

// Sentence foundations — grammar concept questions (multiple choice).
export function foundationsQuestions({ count = 10 } = {}) {
  return shuffle(FOUNDATIONS).slice(0, count).map((f) => ({
    type: "concept", prompt: f.prompt, ex: f.ex || null, answer: f.answer, meaning: f.meaning,
    options: shuffle(f.options.slice()),
  }));
}

export function buildQuestions(session, progress) {
  if (session.kind === "unit") return unitQuestions(session.chapterIdx, session.unitIdx, session.difficulty, session.dir);
  if (session.kind === "custom") return customQuestions(session);
  if (session.kind === "numbers") return numberQuestions(session);
  if (session.kind === "foundations") return foundationsQuestions(session);
  return modeQuestions(session.mode, progress, session.count);
}

export const MODE_TITLES = {
  review: "QUICK REVIEW", weak: "WEAK SPOTS", speed: "SPEED ROUND", listen: "LISTENING",
};
