import React from "react";

// Palettes lifted verbatim from the design handoff (core.jsx).
export const LIGHT = {
  bg: "#F3F5FA", surface: "#FFFFFF", sunk: "#E8EBF4", raise: "#FFFFFF",
  ink: "#1E2540", sub: "#71789A", faint: "#AAB0C6",
  line: "#E6E9F2", primary: "#1D4FD7", primaryDark: "#1740B0",
  primarySoft: "#E9EEFC", done: "#27A567", doneSoft: "#E4F5EC",
  gold: "#F5B225", goldSoft: "#FCF1D8", wrong: "#E5484D", wrongSoft: "#FBE7E8",
  lock: "#C3C8D8", shadow: "rgba(30,37,64,0.10)", doneMid: "#C5EBD5",
  seg: "#EEF1F8", // segmented-control track — lighter than the white active pill sits fine on it
  cardShadow: "0 20px 45px -22px rgba(30,37,64,0.16)", // large soft card lift
};
export const DARK = {
  bg: "#0E1322", surface: "#1A2138", sunk: "#141A2C", raise: "#222B45",
  ink: "#F0F2F8", sub: "#9098B8", faint: "#5A6286",
  line: "#27304C", primary: "#5A85FF", primaryDark: "#3D63D8",
  primarySoft: "#1E2A4A", done: "#34C07C", doneSoft: "#16301F",
  gold: "#FFCB57", goldSoft: "#2A2410", wrong: "#FF6166", wrongSoft: "#34191B",
  lock: "#4A5378", shadow: "rgba(0,0,0,0.4)", doneMid: "#234C35",
  seg: "#10162A", // recessed track — darker than the surface active pill so the selection pops
  cardShadow: "0 22px 48px -20px rgba(0,0,0,0.55)", // large soft card lift
};

export const DISPLAY = "'Outfit', system-ui, sans-serif";
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

  React.useEffect(() => {
    const bg = mode === "dark" ? DARK.bg : LIGHT.bg;
    const ink = mode === "dark" ? DARK.ink : LIGHT.ink;
    const r = document.documentElement;
    r.style.setProperty("--hk-bg", bg);
    r.style.setProperty("--hk-ink", ink);
    r.style.background = bg;
    document.body.style.background = bg;
    r.style.colorScheme = mode;
    // Replace (never mutate) the meta node — mutating doesn't reliably trigger
    // a status-bar repaint in Chrome, which leaves a stale bar colour/seam
    // after an in-session theme switch. See design-system.md.
    // Skipped in the TWA: bars ignore the meta there, and swapping it triggers
    // Chrome's persistent protective status-bar strip.
    if (!isTwa) {
      const old = document.querySelector('meta[name="theme-color"]');
      if (old) old.remove();
      const meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", bg);
      document.head.appendChild(meta);
    }
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
