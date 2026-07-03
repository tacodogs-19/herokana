// Pre-generate recorded audio for every dialogue line ("B-part-2").
// Synthesizes each unique line with Microsoft Edge neural voices (far better
// than most device ja-JP voices) into public/audio/, plus a manifest mapping
// speaker+text -> clip so speech.js can prefer clips and fall back to TTS.
//
//   node scripts/make-audio.mjs
//
// Needs network (Edge TTS endpoint). Idempotent: existing clips are skipped,
// stale clips (lines no longer in dialogue.js) are deleted. Commit the mp3s
// and src/audio-manifest.json — they're build inputs, not build outputs.
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DIALOGUES } from "../src/dialogue.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "public", "audio");
mkdirSync(OUT, { recursive: true });

const VOICES = { staff: "ja-JP-NanamiNeural", you: "ja-JP-KeitaNeural" };

// Collect unique speaker+line pairs across all dialogues/variants.
const lines = new Map(); // "who|jp" -> { who, jp }
for (const d of DIALOGUES)
  for (const v of d.variants)
    for (const ln of v) lines.set(`${ln.who}|${ln.jp}`, { who: ln.who, jp: ln.jp });

const fileFor = ({ who, jp }) =>
  createHash("md5").update(`${VOICES[who]}|${jp}`).digest("hex").slice(0, 10) + ".mp3";

const synth = async ({ who, jp }) => {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICES[who], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = await tts.toStream(jp);
  const chunks = [];
  await new Promise((res, rej) => {
    audioStream.on("data", (c) => chunks.push(c));
    audioStream.on("end", res);
    audioStream.on("error", rej);
  });
  tts.close();
  return Buffer.concat(chunks);
};

const manifest = { staff: {}, you: {} };
let made = 0, kept = 0;
for (const item of lines.values()) {
  const file = fileFor(item);
  manifest[item.who][item.jp] = file;
  const dest = path.join(OUT, file);
  if (existsSync(dest)) { kept++; continue; }
  const buf = await synth(item);
  if (buf.length < 1000) throw new Error(`suspiciously small clip for: ${item.jp}`);
  writeFileSync(dest, buf);
  made++;
  console.log(`  ${item.who.padEnd(5)} ${file}  ${item.jp}`);
}

// Prune clips for lines that no longer exist.
const live = new Set(Object.values(manifest).flatMap((m) => Object.values(m)));
let pruned = 0;
for (const f of readdirSync(OUT)) if (f.endsWith(".mp3") && !live.has(f)) { unlinkSync(path.join(OUT, f)); pruned++; }

writeFileSync(path.join(ROOT, "src", "audio-manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`\n${lines.size} lines: ${made} synthesized, ${kept} already present, ${pruned} pruned.`);
