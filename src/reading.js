// "Read the Real World" — reading-fluency mode.
//
// Drills reading SPEED on real Japan-trip vocabulary, grouped by where you'd
// meet it (station / konbini / restaurant / …). Content is real and curated.
// Konbini is the reference-depth pack — 14 words, so a round (SESSION = 8) draws
// a varying subset rather than always the whole list; the other packs sit at 8
// (whole-list rounds) until they're brought up to the same depth. Each pack is a
// list of { jp, romaji, en, where } words; keep that shape and the rest of the
// app keeps working.

import { CHAPTERS } from "./data";
import { shuffle } from "./questions.js";

// Speed bands, in milliseconds. Tuned for beginners — tune here, nothing else
// reads literals. A read at or under INSTANT_MS feels effortless; over READ_MS
// is the "slow" band shown after answering.
export const READING = {
  INSTANT_MS: 1500, // instant: ≤ 1.5s
  READ_MS: 5000,    // read: 1.5–5s · slow: 5s+
  SESSION: 8, // words per reading round
};

// The Reading tab unlocks as a whole once the learner finishes the Words &
// phrases chapter (see READING_UNLOCK below) — reading is positioned as a
// capstone, so individual packs don't gate separately. Each pack is a place
// you'd read these words in Japan.
export const READING_PACKS = [
  {
    id: "station",
    place: "Station",
    label: "At the station",
    jp: "駅",
    blurb: "Signs you'll read on the way through the gates.",
    words: [
      { jp: "きっぷ", romaji: "kippu", en: "ticket", where: "ticket machine" },
      { jp: "えき", romaji: "eki", en: "station", where: "on the sign" },
      { jp: "でぐち", romaji: "deguchi", en: "exit", where: "above the gate" },
      { jp: "いりぐち", romaji: "iriguchi", en: "entrance", where: "by the doors" },
      { jp: "ホーム", romaji: "hoomu", en: "platform", where: "on the board" },
      { jp: "でんしゃ", romaji: "densha", en: "train", where: "the timetable" },
      { jp: "かいさつ", romaji: "kaisatsu", en: "ticket gate", where: "as you tap in" },
      { jp: "のりかえ", romaji: "norikae", en: "transfer", where: "the route map" },
      { jp: "きんえん", romaji: "kin'en", en: "no smoking", where: "on the signs" },
      { jp: "じゆうせき", romaji: "jiyuuseki", en: "unreserved seat", where: "on the car" },
      { jp: "していせき", romaji: "shiteiseki", en: "reserved seat", where: "on the car" },
      { jp: "おとな", romaji: "otona", en: "adult", where: "ticket machine" },
      { jp: "こども", romaji: "kodomo", en: "child", where: "ticket machine" },
      { jp: "ばんせん", romaji: "bansen", en: "track number", where: "on the platform" },
    ],
  },
  {
    id: "konbini",
    place: "Konbini",
    label: "At the konbini",
    jp: "店",
    blurb: "Shelf tags and counter signs in the convenience store.",
    words: [
      { jp: "レジ", romaji: "reji", en: "checkout", where: "by the counter" },
      { jp: "おにぎり", romaji: "onigiri", en: "rice ball", where: "on the shelf" },
      { jp: "べんとう", romaji: "bentou", en: "lunch box", where: "the chilled case" },
      { jp: "レシート", romaji: "reshiito", en: "receipt", where: "handed to you" },
      { jp: "ふくろ", romaji: "fukuro", en: "bag", where: "at the till" },
      { jp: "コーヒー", romaji: "koohii", en: "coffee", where: "hot drinks" },
      { jp: "アイス", romaji: "aisu", en: "ice cream", where: "the freezer" },
      { jp: "おちゃ", romaji: "ocha", en: "tea", where: "drinks fridge" },
      { jp: "からあげ", romaji: "karaage", en: "fried chicken", where: "hot snacks counter" },
      { jp: "パン", romaji: "pan", en: "bread", where: "the bread shelf" },
      { jp: "おでん", romaji: "oden", en: "oden", where: "the hot counter" },
      { jp: "ぎゅうにゅう", romaji: "gyuunyuu", en: "milk", where: "drinks fridge" },
      { jp: "かさ", romaji: "kasa", en: "umbrella", where: "by the door" },
      { jp: "でんち", romaji: "denchi", en: "batteries", where: "near the till" },
    ],
  },
  {
    id: "restaurant",
    place: "Restaurant",
    label: "At the restaurant",
    jp: "飯",
    blurb: "Words on the menu and the table tent.",
    words: [
      { jp: "メニュー", romaji: "menyuu", en: "menu", where: "on the table" },
      { jp: "みず", romaji: "mizu", en: "water", where: "ask the staff" },
      { jp: "かいけい", romaji: "kaikei", en: "the bill", where: "at the register" },
      { jp: "ちゅうもん", romaji: "chuumon", en: "order", where: "to the waiter" },
      { jp: "おすすめ", romaji: "osusume", en: "recommendation", where: "on the board" },
      { jp: "せき", romaji: "seki", en: "seat", where: "at the entrance" },
      { jp: "のみもの", romaji: "nomimono", en: "drink", where: "the drinks menu" },
      { jp: "ランチ", romaji: "ranchi", en: "lunch set", where: "the lunch sign" },
      { jp: "ていしょく", romaji: "teishoku", en: "set meal", where: "on the menu" },
      { jp: "ごはん", romaji: "gohan", en: "rice", where: "on the menu" },
      { jp: "うどん", romaji: "udon", en: "udon noodles", where: "on the board" },
      { jp: "ラーメン", romaji: "raamen", en: "ramen", where: "on the board" },
      { jp: "てんぷら", romaji: "tenpura", en: "tempura", where: "on the menu" },
      { jp: "まんせき", romaji: "manseki", en: "fully booked", where: "at the entrance" },
    ],
  },
  {
    id: "signs",
    place: "Signs",
    label: "Finding your way",
    jp: "矢",
    blurb: "The wayfinding signs that point you around.",
    words: [
      { jp: "でぐち", romaji: "deguchi", en: "exit", where: "follow the arrow" },
      { jp: "いりぐち", romaji: "iriguchi", en: "entrance", where: "at the doors" },
      { jp: "おてあらい", romaji: "otearai", en: "restroom", where: "down the hall" },
      { jp: "ひだり", romaji: "hidari", en: "left", where: "on the arrow" },
      { jp: "みぎ", romaji: "migi", en: "right", where: "on the arrow" },
      { jp: "まっすぐ", romaji: "massugu", en: "straight ahead", where: "on the sign" },
      { jp: "おす", romaji: "osu", en: "push", where: "on the door" },
      { jp: "ひく", romaji: "hiku", en: "pull", where: "on the door" },
      { jp: "きんし", romaji: "kinshi", en: "prohibited", where: "on warning signs" },
      { jp: "きけん", romaji: "kiken", en: "danger", where: "on warning signs" },
      { jp: "かいだん", romaji: "kaidan", en: "stairs", where: "in the building" },
      { jp: "エレベーター", romaji: "erebeetaa", en: "elevator", where: "in the building" },
      { jp: "エスカレーター", romaji: "esukareetaa", en: "escalator", where: "in the building" },
      { jp: "ちゅうしゃ", romaji: "chuusha", en: "parking", where: "on the lot sign" },
    ],
  },
  {
    id: "money",
    place: "Paying",
    label: "At the register",
    jp: "円",
    blurb: "Words at the till when it's time to pay.",
    words: [
      { jp: "おかね", romaji: "okane", en: "money", where: "at the till" },
      { jp: "おつり", romaji: "otsuri", en: "change", where: "in the tray" },
      { jp: "カード", romaji: "kaado", en: "card", where: "by the reader" },
      { jp: "げんきん", romaji: "genkin", en: "cash", where: "on the sign" },
      { jp: "レシート", romaji: "reshiito", en: "receipt", where: "handed back" },
      { jp: "セール", romaji: "seeru", en: "sale", where: "in the window" },
      { jp: "わりびき", romaji: "waribiki", en: "discount", where: "on the tag" },
      { jp: "ぜいこみ", romaji: "zeikomi", en: "tax included", where: "on the price" },
      { jp: "むりょう", romaji: "muryou", en: "free", where: "on the sign" },
      { jp: "りょうきん", romaji: "ryoukin", en: "fee", where: "on the sign" },
      { jp: "ポイント", romaji: "pointo", en: "loyalty points", where: "at the register" },
      { jp: "クーポン", romaji: "kuupon", en: "coupon", where: "at the counter" },
      { jp: "しはらい", romaji: "shiharai", en: "payment", where: "on the screen" },
      { jp: "ぜんがく", romaji: "zengaku", en: "total", where: "on the display" },
    ],
  },
  {
    id: "cafe",
    place: "Café",
    label: "At the café",
    jp: "茶",
    blurb: "Drinks and treats on the café board.",
    words: [
      { jp: "コーヒー", romaji: "koohii", en: "coffee", where: "on the board" },
      { jp: "こうちゃ", romaji: "koucha", en: "black tea", where: "on the menu" },
      { jp: "ミルク", romaji: "miruku", en: "milk", where: "by the sugar" },
      { jp: "さとう", romaji: "satou", en: "sugar", where: "on the counter" },
      { jp: "アイス", romaji: "aisu", en: "iced", where: "before the drink" },
      { jp: "ホット", romaji: "hotto", en: "hot", where: "before the drink" },
      { jp: "おみず", romaji: "omizu", en: "water", where: "ask the staff" },
      { jp: "ケーキ", romaji: "keeki", en: "cake", where: "in the case" },
      { jp: "テイクアウト", romaji: "teikuauto", en: "takeaway", where: "at the counter" },
      { jp: "イートイン", romaji: "iitoin", en: "eat in", where: "at the counter" },
      { jp: "マフィン", romaji: "mafin", en: "muffin", where: "in the case" },
      { jp: "クッキー", romaji: "kukkii", en: "cookie", where: "in the case" },
      { jp: "サイズ", romaji: "saizu", en: "size", where: "when ordering" },
      { jp: "シロップ", romaji: "shiroppu", en: "syrup", where: "on the counter" },
    ],
  },
  {
    id: "hotel",
    place: "Hotel",
    label: "At the hotel",
    jp: "宿",
    blurb: "Front-desk and room signs where you're staying.",
    words: [
      { jp: "フロント", romaji: "furonto", en: "front desk", where: "in the lobby" },
      { jp: "チェックイン", romaji: "chekkuin", en: "check-in", where: "on the sign" },
      { jp: "かぎ", romaji: "kagi", en: "key", where: "at the desk" },
      { jp: "へや", romaji: "heya", en: "room", where: "on the door" },
      { jp: "おふろ", romaji: "ofuro", en: "bath", where: "down the hall" },
      { jp: "あさごはん", romaji: "asagohan", en: "breakfast", where: "on the notice" },
      { jp: "エレベーター", romaji: "erebeetaa", en: "elevator", where: "by the lobby" },
      { jp: "かいだん", romaji: "kaidan", en: "stairs", where: "near the exit" },
      { jp: "チェックアウト", romaji: "chekkuauto", en: "check-out", where: "on the notice" },
      { jp: "ロビー", romaji: "robii", en: "lobby", where: "on the sign" },
      { jp: "タオル", romaji: "taoru", en: "towel", where: "in the bathroom" },
      { jp: "まんしつ", romaji: "manshitsu", en: "no vacancy", where: "on the board" },
      { jp: "くうしつ", romaji: "kuushitsu", en: "vacancy", where: "on the board" },
      { jp: "きんえん", romaji: "kin'en", en: "no smoking", where: "on the room sign" },
    ],
  },
  {
    id: "airport",
    place: "Airport",
    label: "At the airport",
    jp: "空",
    blurb: "The first signs you'll read off the plane.",
    words: [
      { jp: "くうこう", romaji: "kuukou", en: "airport", where: "on the sign" },
      { jp: "ひこうき", romaji: "hikouki", en: "airplane", where: "on the board" },
      { jp: "パスポート", romaji: "pasupooto", en: "passport", where: "at the desk" },
      { jp: "にもつ", romaji: "nimotsu", en: "luggage", where: "at the belt" },
      { jp: "とうちゃく", romaji: "touchaku", en: "arrival", where: "on the board" },
      { jp: "しゅっぱつ", romaji: "shuppatsu", en: "departure", where: "on the board" },
      { jp: "バス", romaji: "basu", en: "bus", where: "outside arrivals" },
      { jp: "タクシー", romaji: "takushii", en: "taxi", where: "outside arrivals" },
      { jp: "にゅうこく", romaji: "nyuukoku", en: "immigration", where: "in the terminal" },
      { jp: "ぜいかん", romaji: "zeikan", en: "customs", where: "at the checkpoint" },
      { jp: "とうじょう", romaji: "toujou", en: "boarding", where: "at the gate" },
      { jp: "ゲート", romaji: "geeto", en: "gate", where: "on the screen" },
      { jp: "ターミナル", romaji: "taaminaru", en: "terminal", where: "on the sign" },
      { jp: "こくさい", romaji: "kokusai", en: "international", where: "on the terminal sign" },
    ],
  },
];

export const packById = (id) => READING_PACKS.find((p) => p.id === id);

// The whole Reading tab unlocks once this chapter is complete. Tunable: point it
// at an earlier chapter (e.g. "kata") to give beginners access sooner. Reuses
// the existing positional progress — no parallel unlock system.
export const READING_UNLOCK = "phrase"; // "Words and phrases"

export function readingUnlocked(progress) {
  // once the user has played any scene or dialogue, keep Scenes unlocked even
  // if a chapter reset drops the unlock chapter's done count back to zero
  if (Object.keys(progress.reading || {}).length > 0) return true;
  if (Object.keys(progress.dialogues || {}).length > 0) return true;
  const ci = CHAPTERS.findIndex((c) => c.id === READING_UNLOCK);
  if (ci < 0) return true;
  return (progress.done[ci] || 0) >= CHAPTERS[ci].units.length;
}

// Progress toward the unlock, for the locked-state hint ("8 / 14 themes").
export function readingGate() {
  const ci = CHAPTERS.findIndex((c) => c.id === READING_UNLOCK);
  const c = CHAPTERS[ci];
  return { chapterIdx: ci, name: c ? c.name : "", total: c ? c.units.length : 0 };
}

// Which speed band a reading time falls into.
export function band(ms) {
  if (ms <= READING.INSTANT_MS) return "instant";
  if (ms <= READING.READ_MS) return "read";
  return "slow";
}

export const BAND_COPY = {
  instant: "Read it instantly",
  read: "Nicely read",
  slow: "Take another look",
};

// Build a round of reading questions. Distractors are other meanings from the
// same pack, mirroring how banked questions draw plausible same-bank options.
export function buildReadingSession(pack) {
  const all = pack.words;
  const words = shuffle(all).slice(0, READING.SESSION);
  return words.map((w) => {
    const distractors = shuffle(all.filter((x) => x.en !== w.en)).slice(0, 3).map((x) => x.en);
    return { ...w, answer: w.en, options: shuffle([w.en, ...distractors]) };
  });
}
