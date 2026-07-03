// Fetch KanjiVG stroke-order paths for every single-glyph kana the app teaches
// (base + voiced; combination kana are two glyphs and get no entry) into
// src/strokes.json: { "あ": ["M...", "M...", ...] } in stroke order, 109x109
// viewBox (KanjiVG's). Data is CC BY-SA — the chart credits KanjiVG.
//
//   node scripts/make-strokes.mjs
//
// Needs network. Idempotent — skips chars already in the JSON.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { HIRA, KATA } from "../src/data.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "src", "strokes.json");

const chars = [...new Set([...Object.values(HIRA), ...Object.values(KATA)]
  .filter((s) => [...s].length === 1))];

const strokes = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

const urlFor = (ch) =>
  `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${ch.codePointAt(0).toString(16).padStart(5, "0")}.svg`;

let made = 0;
for (const ch of chars) {
  if (strokes[ch]) continue;
  const res = await fetch(urlFor(ch));
  if (!res.ok) throw new Error(`${ch}: HTTP ${res.status}`);
  const svg = await res.text();
  // KanjiVG lists <path d="..."/> in stroke order; grabbing them in document
  // order is all we need (ids carry the order too, but this is simpler).
  const ds = [...svg.matchAll(/<path [^>]*\bd="([^"]+)"/g)].map((m) => m[1]);
  if (!ds.length) throw new Error(`${ch}: no paths`);
  strokes[ch] = ds;
  made++;
  console.log(`  ${ch} ${ds.length} strokes`);
}

writeFileSync(OUT, JSON.stringify(strokes));
console.log(`\n${chars.length} kana: ${made} fetched, ${chars.length - made} already present.`);
