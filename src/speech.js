import React from "react";
import CLIPS from "./audio-manifest.json";

// All of HeroKana's audio runs on the OS ja-JP voice via Web Speech, except
// dialogue lines, which prefer bundled neural-TTS clips (scripts/make-audio.mjs)
// and fall back to the OS voice. One place for the utterance + a hook to detect
// whether a Japanese voice exists, so audio-dependent surfaces can degrade
// gracefully instead of failing silently.

export function speak(text, { rate = 0.8, pitch = 1 } = {}) {
  stopSpeech();
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = rate; u.pitch = pitch;
    speechSynthesis.speak(u);
  } catch (e) {}
}

let clipEl = null;
export function stopSpeech() {
  try { speechSynthesis.cancel(); } catch (e) {}
  if (clipEl) { try { clipEl.pause(); } catch (e) {} clipEl = null; }
}

// Dialogue lines: play the bundled clip for this speaker+text if one exists,
// else fall back to device TTS with the per-speaker pitch trick. `rate` is the
// SUPPORT-level TTS rate (0.75–0.95); clips are natural-speed recordings, so it
// maps up to a playbackRate around 1 (browsers preserve pitch by default).
export function speakLine(text, { who = "staff", rate = 0.85 } = {}) {
  const file = (CLIPS[who] || {})[text];
  const fallback = () => speak(text, { rate, pitch: who === "you" ? 1.25 : 0.95 });
  if (!file) return fallback();
  stopSpeech();
  try {
    const a = new Audio(`/audio/${file}`);
    a.playbackRate = rate + 0.15;
    clipEl = a;
    a.play().catch(fallback);
  } catch (e) { fallback(); }
}

// --- Speaking practice (production) ---------------------------------------
// Two rungs, both native and offline-first; callers pick whichever the device
// supports and fall back gracefully (shadowing always works by ear).

// Rung 2: native speech recognition (ja-JP). Cloud-backed under the hood and
// absent on most of iOS, so it's a capability — never assume it's there. Used
// as a gentle mirror ("we heard …"), not a grader, since ja matching is noisy.
export function useSpeechRecognition() {
  const Rec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!Rec;
  const [listening, setListening] = React.useState(false);
  const [heard, setHeard] = React.useState(null);
  const ref = React.useRef(null);
  const start = React.useCallback(() => {
    if (!supported) return;
    try {
      const r = new Rec();
      r.lang = "ja-JP"; r.interimResults = false; r.maxAlternatives = 1;
      r.onresult = (e) => setHeard(e.results[0][0].transcript);
      r.onend = () => setListening(false);
      r.onerror = () => setListening(false);
      ref.current = r; setHeard(null); setListening(true); r.start();
    } catch (e) { setListening(false); }
  }, [supported]);
  const stop = React.useCallback(() => { try { ref.current && ref.current.stop(); } catch (e) {} }, []);
  const reset = React.useCallback(() => setHeard(null), []);
  return { supported, listening, heard, start, stop, reset };
}

// Rung 1: record + play back, so the learner shadows and self-checks against
// the model. Pure native MediaRecorder, fully offline.
export function useRecorder() {
  const supported = typeof navigator !== "undefined" && !!(navigator.mediaDevices && typeof window !== "undefined" && window.MediaRecorder);
  const [recording, setRecording] = React.useState(false);
  const [url, setUrl] = React.useState(null);
  const mr = React.useRef(null); const chunks = React.useRef([]); const stream = React.useRef(null);
  const clearUrl = (next) => setUrl((old) => { if (old) URL.revokeObjectURL(old); return next; });
  const start = React.useCallback(async () => {
    if (!supported) return;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s; chunks.current = []; clearUrl(null);
      const rec = new MediaRecorder(s);
      rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      rec.onstop = () => {
        clearUrl(URL.createObjectURL(new Blob(chunks.current, { type: rec.mimeType || "audio/webm" })));
        s.getTracks().forEach((tr) => tr.stop());
        setRecording(false);
      };
      mr.current = rec; rec.start(); setRecording(true);
    } catch (e) { setRecording(false); }
  }, [supported]);
  const stop = React.useCallback(() => { try { if (mr.current && mr.current.state !== "inactive") mr.current.stop(); } catch (e) {} }, []);
  React.useEffect(() => () => {
    try { stream.current && stream.current.getTracks().forEach((tr) => tr.stop()); } catch (e) {}
    setUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
  }, []);
  return { supported, recording, url, start, stop };
}

// The ja-JP recognizer returns kanji (say だいじょうぶ, it hears 大丈夫) and
// can't be forced to kana, so a kana target never matches. Rather than ship a
// morphological dictionary, map just the kanji words our authored YOU lines use
// back to kana. Longest keys first so compounds win (何番線 before any 何).
const KANJI_KANA = {
  "何番線": "なんばんせん", "東京駅": "とうきょうえき", "持ち帰り": "もちかえり",
  "一週間": "いっしゅうかん", "行きたい": "いきたい", "大丈夫": "だいじょうぶ",
  "新宿": "しんじゅく", "出口": "でぐち", "観光": "かんこう", "お願い": "おねがい",
  "二人": "ふたり", "一回": "いっかい", "田中": "たなか", "分かり": "わかり",
  "遠い": "とおい", "東京": "とうきょう", "駅": "えき", "水": "みず",
};
const KANJI_KEYS = Object.keys(KANJI_KANA).sort((a, b) => b.length - a.length);

// Normalise any recognised text to plain hiragana: swap known kanji words for
// their reading, fold katakana → hiragana, and drop spaces/punctuation.
export function toKana(s) {
  let r = s || "";
  for (const k of KANJI_KEYS) r = r.split(k).join(KANJI_KANA[k]);
  r = r.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)); // katakana → hiragana
  return r.replace(/[\s、。.!！?？・]/g, "");
}

// Lenient mirror match — compare on the kana skeleton. Returns true only on a
// clear hit; a miss stays neutral (never a red ✗).
export function looseMatch(heard, target) {
  const a = toKana(heard), b = toKana(target);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

// True until we positively know the device has no Japanese voice. Voices load
// asynchronously, so we assume present and only flip to false once a populated
// list lacks ja-JP — avoids a false "no audio" flash on first paint.
export function useJaVoice() {
  const [has, setHas] = React.useState(true);
  React.useEffect(() => {
    const check = () => {
      try {
        const vs = speechSynthesis.getVoices();
        if (vs.length) setHas(vs.some((v) => /ja(-|_)?jp/i.test(v.lang)));
      } catch (e) {}
    };
    check();
    try { speechSynthesis.addEventListener("voiceschanged", check); } catch (e) {}
    return () => { try { speechSynthesis.removeEventListener("voiceschanged", check); } catch (e) {} };
  }, []);
  return has;
}
