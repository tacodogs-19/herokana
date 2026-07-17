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
// note on finishing a unit. Durations are kept low but ABOVE the ~10ms floor
// most Android vibration motors can actually render — sub-10ms often produces
// nothing perceptible on real hardware.
export const tapRight = () => buzz(20);
export const tapWrong = () => buzz([15, 50, 15]);
export const tapDone = () => buzz(35);
// Fired when the learner switches Haptics on — an immediate confirmation the
// feature works on their device (and a self-diagnostic if it doesn't).
export const tapToggle = () => buzz(25);
