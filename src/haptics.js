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

// The Profile toggle is the single control. We deliberately do NOT also gate on
// prefers-reduced-motion: an explicit opt-in shouldn't be silently overridden
// by a device motion setting (that killed haptics for reduced-motion users).
function buzz(pattern) {
  if (!hapticsOn()) return;
  try { navigator.vibrate && navigator.vibrate(pattern); } catch (e) {}
}

// On-device diagnostic: fires an unmistakable test pulse (ungated) and reports
// what the platform actually did, so a "no buzz" report can be pinned to the
// real cause (API missing / call refused / OS vibration off). Called from a tap
// so user-activation is satisfied.
export function probe() {
  const r = { enabled: hapticsOn(), supported: false, called: null, reduceMotion: false };
  try { r.supported = typeof navigator !== "undefined" && typeof navigator.vibrate === "function"; } catch (e) {}
  try { r.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  try { if (r.supported) r.called = navigator.vibrate([120, 60, 120]); } catch (e) { r.called = "error"; }
  return r;
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
