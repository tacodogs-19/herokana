// Rasterises the cat mascot SVGs (art/cats/*.svg) to compact WebP for the app.
// The cats render at <=150px, so a 512px WebP is crisp on 3x screens while
// decoding far faster than the 40-80KB source vectors.
// Run with: node scripts/make-cats.mjs
import sharp from "sharp";
import { readdirSync } from "fs";

const srcDir = "art/cats";
const outDir = "public/assets";
const SIZE = 448;

for (const file of readdirSync(srcDir)) {
  if (!file.endsWith(".svg")) continue;
  const name = file.replace(/\.svg$/, "");
  await sharp(`${srcDir}/${file}`, { density: 144 })
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80, effort: 6 })
    .toFile(`${outDir}/${name}.webp`);
  console.log(`${name}.webp written`);
}
