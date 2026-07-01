// Generates Play Store listing art into store/.
// Requires the dev server (http://localhost:5173) for the asset URLs.
//   node scripts/store-assets.mjs
import puppeteer from "puppeteer";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../store");
await mkdir(OUT, { recursive: true });

// Feature graphic — exactly 1024x500 (Play Console requirement).
const html = `<!DOCTYPE html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;800&family=Zen+Maru+Gothic:wght@700&display=swap" rel="stylesheet">
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
</body></html>`;

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: join(OUT, "feature-graphic.png"), type: "png" });
console.log("✓ store/feature-graphic.png (1024x500)");
await browser.close();
