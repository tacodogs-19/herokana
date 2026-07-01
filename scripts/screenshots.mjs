import puppeteer from "puppeteer";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../screenshots");
await mkdir(OUT, { recursive: true });

const BASE = "http://localhost:5173";
// 360x640 @3x = 1080x1920, exactly 9:16 — Play Console rejects anything
// taller than 2:1, so don't revert to 390x844 (@2.77 = 1:2.16).
const W = 360, H = 640;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 3 });
page.on("pageerror", () => {});

const PROFILE = JSON.stringify({ name: "Alex", goal: "travel", level: "beginner" });

const mkProg = (done, extra = {}) => JSON.stringify({
  done, hardDone: done.map(() => 0),
  xp: 0, answered: 0, correctAns: 0, week: {}, wrong: {}, reading: {}, dialogues: {}, srs: {},
  ...extra,
});

// Load the page with all state pre-set, wait for splash to clear
async function load(state = {}) {
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate((s) => {
    localStorage.setItem("hk-theme", s.theme || "dark");
    localStorage.setItem("hk-profile-v1", s.profile);
    if (s.progress) localStorage.setItem("hk-progress-v2", s.progress);
    // The first goto renders a fresh app which persists sel=0 here; clear it
    // so the reload re-derives the focused chapter from the injected progress.
    localStorage.removeItem("hk-home-sel");
    localStorage.removeItem("hk-home-exp");
  }, { profile: PROFILE, ...state });
  await page.reload({ waitUntil: "load" });
  // Wait for splash (zIndex 3000) to disappear — it holds for 2.2 s
  await page.waitForFunction(
    () => !document.querySelector('[style*="z-index: 3000"]'),
    { timeout: 7000 }
  ).catch(() => {});
  await sleep(400);
}

// Find button by text and click it. el.click() fires a synthetic click that
// React's root listener handles — no coordinate math, so it can't miss or hit
// an overlay (the old boundingBox+mouse approach silently failed off-viewport).
async function clickBtn(p, ...texts) {
  return p.evaluate((wanted) => {
    const b = Array.from(document.querySelectorAll("button"))
      .find((el) => wanted.some((x) => el.textContent.includes(x)));
    if (b) b.click();
    return !!b;
  }, texts);
}

// Click the first answer option: an .hk-press button whose text isn't a nav/action label.
async function clickOption(p, excluded) {
  return p.evaluate((ex) => {
    const b = Array.from(document.querySelectorAll("button.hk-press"))
      .find((el) => el.textContent.trim() && !ex.some((x) => el.textContent.includes(x)));
    if (b) b.click();
    return !!b;
  }, excluded);
}

async function waitForLesson(p) {
  // "Check" only appears inside a lesson
  await p.waitForFunction(
    () => Array.from(document.querySelectorAll("button")).some((b) => b.textContent.includes("Check")),
    { timeout: 8000 }
  ).catch(() => {});
  await sleep(400);
}

async function shot(name) {
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: "jpeg", quality: 92 });
  console.log(`✓ ${name}`);
}

// ── 1. Fresh home — START YOUR JOURNEY, Hiragana, dark ───────────────────────
await load({ progress: mkProg([0,0,0,0,0,0,0]), hard: false });
await shot("01-home");

// ── 2. Kana lesson mid-question — answer revealed, mnemonic ──────────────────
await load({ progress: mkProg([0,0,0,0,0,0,0]), hard: false });
const clicked2 = await clickBtn(page, "Get Started");
console.log("  Get Started clicked:", clicked2);
await sleep(500);
await waitForLesson(page);
// Answer questions until one lands correct — a red "Not quite" is the wrong
// look for a store listing.
for (let i = 0; i < 8; i++) {
  await clickOption(page, ["Continue", "Check", "Exit", "Finish", "Get Started"]);
  await sleep(200);
  await clickBtn(page, "Check");
  await sleep(500);
  const wrong = await page.evaluate(() => document.body.textContent.includes("Not quite"));
  if (!wrong) break;
  await clickBtn(page, "Continue");
  await sleep(400);
}
await shot("02-kana-lesson");

// ── 3. Words chapter home — Travel unit, theme chips ─────────────────────────
// done: hira(10) kata(10) voiced(10) combo(22) phrase@1
await load({
  progress: mkProg([10,10,10,22,1,0,0], { xp:480, answered:120, correctAns:105 }),
  hard: false,
});
await page.evaluate(() => window.scrollBy(0, 120));
await sleep(200);
await shot("03-words-travel");

// ── 4. Sentences chapter home ─────────────────────────────────────────────────
// done: all kana + phrase(14) done, sentence@1
await load({
  progress: mkProg([10,10,10,22,14,1,0], { xp:900, answered:220, correctAns:195 }),
  hard: false,
});
await shot("04-sentences");

// ── 5. Hard mode — kanji prompt (Weather unit, phrase index 9) ───────────────
await load({
  progress: mkProg([10,10,10,22,9,0,0], {
    xp:550, answered:138, correctAns:120,
    hardDone:[0,0,0,0,9,0,0], hard: true,
  }),
});
await clickBtn(page, "Continue lesson", "Get Started"); await sleep(400);
await waitForLesson(page);
// Advance until a kanji (CJK) character appears as the prompt card content
for (let i = 0; i < 15; i++) {
  const hasKanji = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll("div[style]"));
    return divs.some((d) => {
      const t = d.textContent.trim();
      return t.length >= 1 && t.length <= 4 && /[一-鿿]/.test(t);
    });
  });
  if (hasKanji) break;
  await clickOption(page, ["Continue", "Check", "Exit", "Finish"]);
  await sleep(150);
  await clickBtn(page, "Check", "Continue →");
  await sleep(150);
}
await sleep(300);
await shot("05-kanji-hard");

// ── 6. Results screen — solve the vowels lesson correctly for a pass + cat ───
const VOWELS = { "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o" };

// Answer the current question correctly: find the big prompt glyph (JP font,
// 40px+), then either fill the typed input (via the native value setter so
// React's onChange fires) or click the matching option button.
async function solveStep(p, dict) {
  return p.evaluate((d) => {
    const rev = {}; Object.entries(d).forEach(([k, v]) => { rev[v] = k; });
    const prompt = Array.from(document.querySelectorAll("div,span"))
      .filter((el) => {
        const t = el.textContent.trim();
        return t && t.length <= 3 && (d[t] || rev[t]) &&
          parseFloat(getComputedStyle(el).fontSize) >= 40;
      })
      .map((el) => el.textContent.trim())[0];
    if (!prompt) return "no-prompt";
    const want = d[prompt] || rev[prompt];
    const input = document.querySelector("input");
    if (input) {
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      set.call(input, want);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return "typed " + want;
    }
    const btn = Array.from(document.querySelectorAll("button.hk-press"))
      .find((b) => b.textContent.trim() === want);
    if (btn) { btn.click(); return "picked " + want; }
    return "no-option";
  }, dict);
}

await load({ progress: mkProg([0,0,0,0,0,0,0]) });
await clickBtn(page, "Get Started"); await sleep(500);
await waitForLesson(page);
for (let i = 0; i < 40; i++) {
  const h = await page.evaluate(() => document.querySelector("h1,h2")?.textContent || "");
  if (h.includes("!") || /done|there|perfect/i.test(h)) break;
  await solveStep(page, VOWELS);
  await sleep(150);
  await clickBtn(page, "Check", "Continue →", "Got it", "Finish");
  await sleep(250);
}
await sleep(600);
await shot("06-results");

// ── 7. Practice tab ───────────────────────────────────────────────────────────
await load({
  progress: mkProg([10,10,10,22,5,0,0], {
    xp:600, answered:150, correctAns:130, wrong:{"か|ka":3,"さ|sa":2},
  }),
  hard: false,
});
await clickBtn(page, "Practice"); await sleep(500);
await shot("07-practice");

// ── 8. Home — mid-progress Words chapter ─────────────────────────────────────
await load({
  progress: mkProg([10,10,10,22,7,0,0], { xp:720, answered:180, correctAns:160 }),
  hard: false,
});
await shot("08-home-progress");

await browser.close();
console.log("\nDone — screenshots/");
