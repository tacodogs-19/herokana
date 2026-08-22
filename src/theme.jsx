import React from "react";

// Palettes lifted verbatim from the design handoff (core.jsx).
export const LIGHT = {
  bg: "#F3F5FA", chrome: "#0E1322", surface: "#FFFFFF", sunk: "#EEF1F8", raise: "#FFFFFF",
  ink: "#070F24", sub: "#71789A", faint: "#AAB0C6", onChrome: "#FFFFFF", // onChrome: header text/logo, sits on the dark `chrome` bar
  line: "#E6E9F2", primary: "#1D4FD7", primaryDark: "#1740B0",
  primarySoft: "#CDDBF8", primaryTint: "#CDE1FF", done: "#27A567", doneSoft: "#CBF4E2",
  gold: "#F5B225", goldSoft: "#FCF1D8", wrong: "#E5484D", wrongSoft: "#FBE7E8",
  lock: "#C3C8D8", shadow: "rgba(30,37,64,0.10)", doneMid: "#C5EBD5",
  seg: "rgba(29,79,215,0.05)", // segmented-control track — faint primary-tinted wash: just a hint of blue to sit with the plane, still a step darker on white; opaque `surface` active pill pops on top
  chipTint: "rgba(7,15,36,0.05)", // transparent ink — reveal chips let the bg/gradient show through instead of a flat opaque grey
  cardShadow: "rgba(34, 52, 118, 0.15) 0px 1px 4px -2px, rgba(34, 52, 118, 0.2) 0px 20px 64px -20px", // Felix-depth: soft float over the header plane + a tight contact shadow that reads as a subtle edge
  planeTop: "#EDF1FB", // deep end of the plane gradient — light, so the content pane stays light-on-white top to bottom
};
export const DARK = {
  bg: "#0E1322", chrome: "#0E1322", surface: "#1A2138", sunk: "#141A2C", raise: "#222B45",
  ink: "#F0F2F8", sub: "#9098B8", faint: "#5A6286", onChrome: "#F0F2F8",
  line: "#27304C", primary: "#5A85FF", primaryDark: "#3D63D8",
  primarySoft: "#273D6E", primaryTint: "#33579D", done: "#34C07C", doneSoft: "#16301F",
  gold: "#FFCB57", goldSoft: "#2A2410", wrong: "#FF6166", wrongSoft: "#34191B",
  lock: "#4A5378", shadow: "rgba(0,0,0,0.4)", doneMid: "#234C35",
  seg: "rgba(8,14,40,0.45)", // translucent navy-blue wash — recesses a step below ANY dark bg/surface while carrying the same blue cast as the plane; `surface` active pill lifts out of it
  chipTint: "rgba(255,255,255,0.05)", // dark-mode reveal chips: a subtle light lift on the dark bg
  cardShadow: "0 1px 2px -1px rgba(0,0,0,0.55), 0 20px 52px -18px rgba(0,0,0,0.62)", // Felix-depth: soft float over the header plane + a tight contact shadow that reads as a subtle edge
  planeTop: "#1B2340", // Felix-depth: plane tint; Shell gradients this DOWN to `bg` so it melts in seamlessly
};

export const DISPLAY = "'Figtree', system-ui, sans-serif";
const glow = (c) => `0 3px 8px -3px ${c}73`;
export const JP = "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', serif";

const ThemeCtx = React.createContext({ t: LIGHT, mode: "light", setMode: () => {}, followsSystem: true, followSystem: () => {} });
export const useTheme = () => React.useContext(ThemeCtx);

// hk-theme holds an explicit user choice; absence means "follow the device".
function initialOverride() {
  try {
    const saved = localStorage.getItem("hk-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch (e) {}
  return null;
}
const systemMode = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

// Running inside the Android TWA? The activity launches with an android-app://
// referrer; remember it for the session since in-app reloads lose the referrer.
// In a TWA the system bars ignore the theme-color meta, and mid-session
// theme-signal churn makes Chrome paint a persistent status-bar strip — so we
// skip the meta swap and the transition cover there. Browser/PWA unaffected.
const isTwa = (() => {
  try {
    if (sessionStorage.getItem("hk-twa") === "1") return true;
    if (document.referrer.startsWith("android-app://")) {
      sessionStorage.setItem("hk-twa", "1");
      return true;
    }
  } catch (e) {}
  return false;
})();

// Full-screen cover shown during theme transitions so Chrome never sees the
// WebView surface while the status bar is repainting — same principle as Splash.
function ThemeCover({ bg }) {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const id = setTimeout(() => setVisible(false), 80);
    return () => clearTimeout(id);
  }, []);
  if (!visible) return null;
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, height: "100dvh",
      zIndex: 9999, background: bg, pointerEvents: "none" }} />
  );
}

export function ThemeProvider({ children }) {
  const [override, setOverride] = React.useState(initialOverride);
  const [system, setSystem] = React.useState(systemMode);
  const mode = override || system;
  const [cover, setCover] = React.useState(null); // bg color to flash on switch

  // Live-follow the device theme while no manual choice is pinned.
  React.useEffect(() => {
    const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (!mq || !mq.addEventListener) return;
    const onChange = (e) => setSystem(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const switchMode = React.useCallback((next) => {
    if (!isTwa) setCover(next === "dark" ? DARK.bg : LIGHT.bg);
    setOverride(next);
    try { localStorage.setItem("hk-theme", next); } catch (e) {}
  }, []);
  const followSystem = React.useCallback(() => {
    if (!isTwa) setCover(systemMode() === "dark" ? DARK.bg : LIGHT.bg);
    setSystem(systemMode());
    setOverride(null);
    try { localStorage.removeItem("hk-theme"); } catch (e) {}
  }, []);

  // The pre-paint script already set the status-bar colour before first paint,
  // so the FIRST run of this effect must not swap the meta — doing so repaints
  // the bar and leaves a strip on load. Only swap on an actual in-session change.
  const swapMeta = React.useRef(false);
  React.useEffect(() => {
    const bg = mode === "dark" ? DARK.bg : LIGHT.bg;
    const ink = mode === "dark" ? DARK.ink : LIGHT.ink;
    // Status bar matches the (slightly darker) header chrome, not the page bg.
    const chrome = mode === "dark" ? DARK.chrome : LIGHT.chrome;
    const r = document.documentElement;
    // Root backdrop (html/body/splash/App outer) is the navy chrome, so the
    // frame + load/splash all read navy. The light `bg` is only the Shell/modal
    // content sheet, applied inside Shell — never at the root.
    r.style.setProperty("--hk-bg", chrome);
    r.style.setProperty("--hk-ink", ink);
    r.style.background = chrome;
    document.body.style.background = chrome;
    r.style.colorScheme = mode;
    // Replace (never mutate) the meta node — mutating doesn't reliably trigger
    // a status-bar repaint in Chrome, which leaves a stale bar colour/seam
    // after an in-session theme switch. See design-system.md.
    // Skipped in the TWA: bars ignore the meta there, and swapping it triggers
    // Chrome's persistent protective status-bar strip.
    if (!isTwa && swapMeta.current) {
      const old = document.querySelector('meta[name="theme-color"]');
      if (old) old.remove();
      const meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", chrome);
      document.head.appendChild(meta);
    }
    swapMeta.current = true;
  }, [mode]);

  const t = mode === "dark" ? { ...DARK, glow } : { ...LIGHT, glow };
  const value = React.useMemo(
    () => ({ t, mode, setMode: switchMode, followsSystem: !override, followSystem }),
    [mode, override, switchMode, followSystem]
  );
  return (
    <ThemeCtx.Provider value={value}>
      {children}
      {cover && <ThemeCover key={cover + mode} bg={cover} />}
    </ThemeCtx.Provider>
  );
}
