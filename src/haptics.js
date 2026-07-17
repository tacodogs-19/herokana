// Whisper-haptics: a tiny vibration on the moments that matter (answer
// checked, unit complete) — never on ordinary taps. Android-only: iOS Safari
// has no navigator.vibrate and silently no-ops. Gated on a persisted setting
// (default on) and prefers-reduced-motion, so it degrades, never nags.
const KEY = "hk-haptics";

export const hapticsOn = () => {
  try { return localStorage.getItem(KEY) !== "0"; } catch (e) { return true; }
};
export const setHaptics = (on) => {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
};
const reduced = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
};

function buzz(pattern) {
  if (!hapticsOn() || reduced()) return;
  try { navigator.vibrate && navigator.vibrate(pattern); } catch (e) {}
}

// A soft tick on a right answer; a gentle double-blip on a wrong one (two short
// pulses read as "not quite" without feeling like an alarm); a slightly longer
// note on finishing a unit.
export const tapRight = () => buzz(8);
export const tapWrong = () => buzz([6, 40, 6]);
export const tapDone = () => buzz(14);
