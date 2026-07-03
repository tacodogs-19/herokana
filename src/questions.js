import { CHAPTERS, HIRA, KATA, BANKS, bankFor, NUMBER_GROUPS, FOUNDATIONS, KANA_MNEMONICS } from "./data.js";

// One real word per kana row — keyed by unit.jp. Shown as an unscored reveal
// card at the end of the lesson so the learner reads something meaningful
// the moment they finish drilling each row. Review units (jp:"総") have no
// entry and get no card.
const KANA_ROW_WORDS = {
  // Hiragana — only uses kana from current row and earlier
  "あ": { word: "あお",     reading: "a · o",            meaning: "blue" },
  "か": { word: "あか",     reading: "a · ka",           meaning: "red" },
  "さ": { word: "すき",     reading: "su · ki",          meaning: "like / love" },
  "た": { word: "たこ",     reading: "ta · ko",          meaning: "octopus" },
  "な": { word: "ねこ",     reading: "ne · ko",          meaning: "cat" },
  "は": { word: "はな",     reading: "ha · na",          meaning: "flower" },
  "ま": { word: "まち",     reading: "ma · chi",         meaning: "town" },
  "や": { word: "やま",     reading: "ya · ma",          meaning: "mountain" },
  "わ": { word: "わたし",   reading: "wa · ta · shi",    meaning: "I / me" },
  // Katakana — loanwords using katakana from current row and earlier
  "ア": { word: "エア",     reading: "e · a",            meaning: "air" },
  "カ": { word: "カカオ",   reading: "ka · ka · o",      meaning: "cacao" },
  "サ": { word: "アイス",   reading: "a · i · su",       meaning: "ice cream" },
  "タ": { word: "ステーキ", reading: "su · te · ki",     meaning: "steak" },
  "ナ": { word: "テニス",   reading: "te · ni · su",     meaning: "tennis" },
  "ハ": { word: "コーヒー", reading: "ko · hii",         meaning: "coffee" },
  "マ": { word: "スマホ",   reading: "su · ma · ho",     meaning: "smartphone" },
  "ヤ": { word: "カラオケ", reading: "ka · ra · o · ke", meaning: "karaoke" },
  "ワ": { word: "ワイン",   reading: "wa · i · n",       meaning: "wine" },
  // Voiced — hiragana
  "が": { word: "ごはん",   reading: "go · han",         meaning: "meal / rice" },
  "ざ": { word: "じかん",   reading: "ji · kan",         meaning: "time" },
  "だ": { word: "どうぞ",   reading: "do · u · zo",      meaning: "please / go ahead" },
  "ば": { word: "ばら",     reading: "ba · ra",          meaning: "rose" },
  "ぱ": { word: "てんぷら", reading: "ten · pu · ra",    meaning: "tempura" },
  // Voiced — katakana
  "ガ": { word: "ガラス",   reading: "ga · ra · su",     meaning: "glass" },
  "ザ": { word: "ズーム",   reading: "zu · mu",          meaning: "zoom" },
  "ダ": { word: "ダンス",   reading: "dan · su",         meaning: "dance" },
  "バ": { word: "バス",     reading: "ba · su",          meaning: "bus" },
  "パ": { word: "パン",     reading: "pan",              meaning: "bread" },
  // Combination — hiragana
  "きゃ": { word: "きゃく",   reading: "kya · ku",       meaning: "guest" },
  "しゃ": { word: "しゃしん", reading: "sha · shin",     meaning: "photo" },
  "ちゃ": { word: "おちゃ",   reading: "o · cha",        meaning: "tea" },
  "にゃ": { word: "にゃん",   reading: "nyan",           meaning: "meow!" },
  "ひゃ": { word: "ひゃく",   reading: "hya · ku",       meaning: "one hundred" },
  "みゃ": { word: "みゃく",   reading: "mya · ku",       meaning: "pulse / beat" },
  "りゃ": { word: "りゅう",   reading: "ryuu",           meaning: "dragon" },
  "ぎゃ": { word: "ぎゃく",   reading: "gya · ku",       meaning: "opposite" },
  "じゃ": { word: "じゃあ",   reading: "jaa",            meaning: "well then / see you" },
  // Combination — katakana
  "キャ": { word: "キャラ",   reading: "kya · ra",       meaning: "character" },
  "シャ": { word: "シャツ",   reading: "sha · tsu",      meaning: "shirt" },
  "チャ": { word: "チャンス", reading: "chan · su",       meaning: "chance" },
  "ギャ": { word: "ギャップ", reading: "gya · pu",       meaning: "gap" },
  "ジャ": { word: "ジャム",   reading: "ja · mu",        meaning: "jam" },
};

export function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const mapFor = (chapter, unit) =>
  chapter.id === "kata" || /Kata/.test(unit.label) ? KATA : HIRA;

const kanaItem = (map, ans, mates = []) => ({ type: "kana", prompt: map[ans] || "—", answer: ans, pool: map, mates, meaning: KANA_MNEMONICS[ans] || null });

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
  const useKanji = difficulty !== "easy" && p.kanji;
  const q = {
    type: "phrase", prompt: useKanji ? p.kanji : p.jp, answer: p[dir],
    hint: difficulty === "easy" ? p[other] : null,
    meaning: p[other], // revealed after answering on medium/hard
    parts: p.parts, // word-mapping chips on the reveal, if the item is annotated
    input: difficulty === "hard",
    furigana: useKanji ? p.jp : null, // reading shown under kanji prompt
  };
  if (q.input) q.answers = [p.romaji, p.en];
  else {
    // Like withKanaOptions: up to two distractors share the answer's first
    // letter so the round can't be solved by scanning initials, with the
    // plain pool as fallback when the bank has too few same-letter items.
    const rest = [...new Set(pool.filter((x) => x[dir] !== p[dir]).map((x) => x[dir]))];
    const first = p[dir][0].toLowerCase();
    const opts = [];
    const take = (arr, max) => {
      for (const v of shuffle(arr)) {
        if (opts.length >= max) break;
        if (!opts.includes(v)) opts.push(v);
      }
    };
    take(rest.filter((v) => v[0].toLowerCase() === first), 2);
    take(rest, 3);
    q.options = shuffle([p[dir], ...opts]);
  }
  return q;
}


// A unit lesson started from Home (Continue / unit chip). `dir` forces the
// answer language (used by hard mode); otherwise the practice setting applies.
export function unitQuestions(chapterIdx, unitIdx, difficulty = "easy", dir) {
  const chapter = CHAPTERS[chapterIdx];
  const unit = chapter.units[unitIdx];
  const bank = bankFor(chapter.id);
  if (bank)
    return shuffle(bank[unitIdx]).slice(0, 15).map((p) => bankQuestion(p, difficulty, bankFor(chapter.id).flat(), dir || "romaji"));
  const map = mapFor(chapter, unit);
  let items;
  // question order is shuffled so repeat runs (and parallel rows across
  // hiragana/katakana) never share an answer sequence
  if (unit.romaji.length) items = shuffle(unit.romaji).map((a) => kanaItem(map, a, unit.romaji));
  else // Review unit — sample across the whole chapter
    items = shuffle(chapter.units.flatMap((u) => u.romaji.map((a) => kanaItem(map, a, u.romaji))));
  const questions = items.slice(0, 15).map(withKanaOptions);
  const rowWord = KANA_ROW_WORDS[unit.jp];
  if (rowWord) questions.push({ type: "word_reveal", prompt: rowWord.word, reading: rowWord.reading, meaning: rowWord.meaning });
  return questions;
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
      const pool = bankFor(c.id).flat();
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
export function modeQuestions(mode, progress, count = 10, category = "alpha") {
  if (category === "numbers") {
    const items = NUMBER_GROUPS.flatMap((g) => g.items);
    if (!items.length) return [];
    let source = items;
    if (mode === "weak") {
      const ranked = Object.entries(progress.wrong).sort((a, b) => b[1] - a[1]);
      const weakItems = ranked.map(([k]) => items.find((p) => `${p.jp}|${p.romaji}` === k)).filter(Boolean);
      const have = new Set(weakItems.map((p) => `${p.jp}|${p.romaji}`));
      source = [...weakItems, ...shuffle(items.filter((p) => !have.has(`${p.jp}|${p.romaji}`)))];
    }
    const qs = source.slice(0, count).map((p) => bankQuestion(p, "easy", items));
    if (mode === "listen") qs.forEach((q) => { q.listen = true; });
    return qs;
  }

  if (category === "words" || category === "sentences") {
    // words = the phrase bank; sentences = the sentence + complex banks
    const bankIds = category === "words" ? ["phrase"] : ["sentence", "complex"];
    const pool = [];
    CHAPTERS.forEach((c, ci) => {
      if (!bankIds.includes(c.id)) return;
      const bank = bankFor(c.id);
      const flat = bank.flat();
      const done = progress.done[ci] || 0;
      // use completed themes, or fall back to the whole chapter so the mode is always usable
      bank.slice(0, done || bank.length).flat().forEach((p) => pool.push({ p, flat }));
    });
    if (mode === "weak") {
      const idx = itemIndex();
      // only misses belonging to this category's banks
      const inPool = new Set(pool.flatMap(({ p }) => [`${p.jp}|${p.romaji}`, `${p.jp}|${p.en}`]));
      const ranked = Object.entries(progress.wrong).sort((a, b) => b[1] - a[1]).map(([k]) => k).filter((k) => inPool.has(k));
      const weak = ranked.map((k) => resolveKey(k, idx)).filter(Boolean);
      const have = new Set(weak.map((q) => `${q.prompt}|${q.answer}`));
      const fill = shuffle(pool).map(({ p, flat }) => bankQuestion(p, "easy", flat)).filter((q) => !have.has(`${q.prompt}|${q.answer}`));
      return [...weak, ...fill].slice(0, count);
    }
    if (!pool.length) return [];
    const qs = shuffle(pool).slice(0, count).map(({ p, flat }) => bankQuestion(p, "easy", flat));
    if (mode === "listen") qs.forEach((q) => { q.listen = true; });
    return qs;
  }

  // alpha (kana) — original behaviour
  const learned = [];
  CHAPTERS.forEach((c, ci) => {
    if (BANKS[c.id]) return;
    c.units.forEach((u, ui) => {
      if (ui < progress.done[ci]) u.romaji.forEach((a) => learned.push(kanaItem(mapFor(c, u), a, u.romaji)));
    });
  });
  if (!learned.length)
    CHAPTERS[0].units[0].romaji.forEach((a) => learned.push(kanaItem(HIRA, a, CHAPTERS[0].units[0].romaji)));

  // Weak spots draws from every miss — kana AND banked (words/sentences/numbers),
  // ranked by how often it tripped you up — then tops up with learned kana so a
  // short list still fills a round. The other modes stay kana-only by design.
  if (mode === "weak") {
    const idx = itemIndex();
    const ranked = Object.entries(progress.wrong).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const weak = ranked.map((k) => resolveKey(k, idx)).filter(Boolean);
    const have = new Set(weak.map((q) => `${q.prompt}|${q.answer}`));
    const fill = shuffle(learned).map(withKanaOptions).filter((q) => !have.has(`${q.prompt}|${q.answer}`));
    return [...weak, ...fill].slice(0, count);
  }
  const qs = shuffle(learned).slice(0, count).map(withKanaOptions);
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

// Index every reviewable item by its `prompt|answer` key so a stored miss (or a
// due review item) can be rebuilt into a question. Kana, banked and number items
// all resolve; concept (grammar) items have no such key and never enter a pool.
function itemIndex() {
  const kana = {};
  CHAPTERS.forEach((c) => {
    if (BANKS[c.id]) return;
    c.units.forEach((u) => u.romaji.forEach((a) => {
      const it = kanaItem(mapFor(c, u), a, u.romaji);
      kana[`${it.prompt}|${it.answer}`] = it;
    }));
  });
  const bank = {};
  const add = (p, pool) => { bank[`${p.jp}|${p.romaji}`] = { p, pool }; bank[`${p.jp}|${p.en}`] = { p, pool }; };
  Object.keys(BANKS).forEach((id) => { const pool = bankFor(id).flat(); pool.forEach((p) => add(p, pool)); });
  NUMBER_GROUPS.forEach((g) => g.items.forEach((p) => add(p, g.items)));
  return { kana, bank };
}

// Resolve one `prompt|answer` key to an easy multiple-choice question, or null
// if it no longer maps to live content (e.g. a personalised sentence whose
// profile later changed). The banked answer language is recovered from the key.
function resolveKey(key, idx) {
  if (idx.kana[key]) return withKanaOptions(idx.kana[key]);
  const b = idx.bank[key];
  if (!b) return null;
  const dir = key.slice(key.indexOf("|") + 1) === b.p.romaji ? "romaji" : "en";
  return bankQuestion(b.p, "easy", b.pool, dir);
}

// Spaced review — rebuild due items into a low-pressure (always easy MC) round.
// ponytail: if a stale key is the *only* due item, the review card leads to an
// empty round that bounces home — rare and self-healing; prune srs against
// resolveKey if it ever bites in practice.
export function reviewQuestions(keys, count = 15) {
  const idx = itemIndex();
  const qs = [];
  for (const k of shuffle(keys || [])) {
    if (qs.length >= count) break;
    const q = resolveKey(k, idx);
    if (q) qs.push(q);
  }
  return qs;
}

export function chapterReviewQuestions(chapterIdx, count = 20) {
  const chapter = CHAPTERS[chapterIdx];
  const bank = bankFor(chapter.id);
  if (bank) {
    const pool = bankFor(chapter.id).flat();
    return shuffle(bank.flat()).slice(0, count).map((p) => bankQuestion(p, "easy", pool));
  }
  const all = [];
  chapter.units.forEach((u) => {
    u.romaji.forEach((a) => all.push(kanaItem(mapFor(chapter, u), a, u.romaji)));
  });
  return shuffle(all).slice(0, count).map(withKanaOptions);
}

export function buildQuestions(session, progress) {
  if (session.kind === "unit") return unitQuestions(session.chapterIdx, session.unitIdx, session.difficulty, session.dir);
  if (session.kind === "custom") return customQuestions(session);
  if (session.kind === "numbers") return numberQuestions(session);
  if (session.kind === "foundations") return foundationsQuestions(session);
  if (session.kind === "review") return reviewQuestions(progress.reviewKeys);
  if (session.kind === "chapter-review") return chapterReviewQuestions(session.chapterIdx);
  return modeQuestions(session.mode, progress, session.count, session.category || "alpha");
}

export const MODE_TITLES = {
  review: "QUICK REVIEW", weak: "WEAK SPOTS", speed: "SPEED ROUND", listen: "LISTENING",
};
