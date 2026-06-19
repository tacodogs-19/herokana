// Renders the app icon SVG to the PNG sizes Android/Chrome require.
// Run with: node scripts/make-icons.mjs
import sharp from "sharp";

const src = "public/assets/app-icon.svg";
const { width = 1024 } = await sharp(src).metadata();
for (const size of [192, 512]) {
  await sharp(src, { density: Math.ceil((72 * size) / width) })
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`);
  console.log(`icon-${size}.png written`);
}
