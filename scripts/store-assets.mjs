// Generates Play Store listing art into store/.
// Requires the dev server (http://localhost:5173) for the cat asset, and
// screenshots/ to exist (run scripts/screenshots.mjs first).
//   node scripts/store-assets.mjs
import puppeteer from "puppeteer";
import { mkdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../store");
const SHOTS_DIR = join(__dirname, "../screenshots");
await mkdir(join(OUT, "marketing"), { recursive: true });

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;800&family=Zen+Maru+Gothic:wght@700&display=swap" rel="stylesheet">`;

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();

async function render(width, height, html, outPath, type = "png") {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  // networkidle0 hangs on large data-URI images; wait for load + fonts + image
  // decode explicitly instead.
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => Promise.all([
    document.fonts.ready,
    ...Array.from(document.images).map((i) => i.decode().catch(() => {})),
  ]));
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: outPath, type, ...(type === "jpeg" ? { quality: 92 } : {}) });
}

// ── Feature graphic — exactly 1024x500 (Play Console requirement) ────────────
await render(1024, 500, `<!DOCTYPE html>
<html><head>${FONTS}
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1024px; height: 500px; overflow: hidden; position: relative;
    background: #0E1322; font-family: 'Outfit', sans-serif; }
  .glyph { position: absolute; font-family: 'Zen Maru Gothic', serif; color: #1A2138;
    font-weight: 700; user-select: none; }
  .wrap { position: absolute; inset: 0; display: flex; align-items: center;
    justify-content: space-between; padding: 0 88px 0 96px; }
  .title { font-size: 88px; font-weight: 800; color: #F0F2F8; letter-spacing: -0.02em; line-height: 1; }
  .tag { font-size: 30px; font-weight: 600; color: #9098B8; margin-top: 18px; }
  .pills { display: flex; gap: 12px; margin-top: 30px; }
  .pill { background: #1E2A4A; color: #5A85FF; font-weight: 800; font-size: 19px;
    padding: 10px 20px; border-radius: 999px; }
  .pill.green { background: #16301F; color: #34C07C; }
  .pill.gold { background: #2A2410; color: #FFCB57; }
  img.cat { height: 340px; }
</style></head>
<body>
  <div class="glyph" style="font-size:200px; right:340px; top:-60px;">あ</div>
  <div class="glyph" style="font-size:150px; right:60px; bottom:-40px;">ア</div>
  <div class="glyph" style="font-size:120px; left:420px; bottom:-30px;">ん</div>
  <div class="wrap">
    <div>
      <div class="title">HeroKana</div>
      <div class="tag">Learn Japanese kana — calmly.</div>
      <div class="pills">
        <span class="pill">No streaks</span>
        <span class="pill green">No ads</span>
        <span class="pill gold">Works offline</span>
      </div>
    </div>
    <img class="cat" src="http://localhost:5173/assets/cat-general.svg">
  </div>
</body></html>`, join(OUT, "feature-graphic.png"));
console.log("✓ store/feature-graphic.png (1024x500)");

// ── Marketing frames — each screenshot captioned on the brand bg, 1080x1920 ──
// Still exactly 9:16, so these upload to Play Console directly in place of the
// raw screenshots.
const FRAMES = [
  ["01-home", "Zero to reading Japanese", "One clear path: kana, words, sentences, real scenes"],
  ["02-kana-lesson", "Every kana, made memorable", "Friendly mnemonics do the heavy lifting"],
  ["03-words-travel", "Real words, real themes", "From greetings to getting around Japan"],
  ["04-sentences", "Build up to full sentences", "With grammar foundations along the way"],
  ["05-kanji-hard", "Ready for more? Hard mode", "Kanji prompts once you finish the course"],
  ["06-results", "Progress worth celebrating", "XP and accuracy — never a streak to lose"],
  ["07-practice", "Practice your way", "Quick review, weak spots, speed, listening"],
  ["08-home-progress", "No streaks. No ads. No account.", "Free, offline, and entirely yours"],
];

for (const [name, headline, sub] of FRAMES) {
  const jpg = await readFile(join(SHOTS_DIR, `${name}.jpg`));
  const dataUri = `data:image/jpeg;base64,${jpg.toString("base64")}`;
  await render(1080, 1920, `<!DOCTYPE html>
<html><head>${FONTS}
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1920px; overflow: hidden; position: relative;
    background: #0E1322; font-family: 'Outfit', sans-serif;
    display: flex; flex-direction: column; align-items: center; }
  .glyph { position: absolute; font-family: 'Zen Maru Gothic', serif; color: #1A2138;
    font-weight: 700; user-select: none; z-index: 0; }
  h1 { font-size: 58px; font-weight: 800; color: #F0F2F8; letter-spacing: -0.02em;
    text-align: center; margin-top: 72px; padding: 0 70px; z-index: 1; }
  p { font-size: 27px; font-weight: 600; color: #9098B8; text-align: center;
    margin-top: 16px; padding: 0 90px; z-index: 1; }
  img.shot { width: 812px; border-radius: 40px; border: 3px solid #27304C;
    margin-top: 44px; z-index: 1;
    box-shadow: 0 40px 90px -20px rgba(0,0,0,0.85); }
</style></head>
<body>
  <div class="glyph" style="font-size:260px; left:-70px; bottom:60px;">あ</div>
  <div class="glyph" style="font-size:200px; right:-50px; bottom:380px;">ア</div>
  <h1>${headline}</h1>
  <p>${sub}</p>
  <img class="shot" src="${dataUri}">
</body></html>`, join(OUT, "marketing", `${name}.jpg`), "jpeg");
  console.log(`✓ store/marketing/${name}.jpg (1080x1920)`);
}

await browser.close();
