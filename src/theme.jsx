import React from "react";

// Palettes lifted verbatim from the design handoff (core.jsx).
export const LIGHT = {
  bg: "#F3F5FA", surface: "#FFFFFF", sunk: "#E8EBF4", raise: "#FFFFFF",
  ink: "#1E2540", sub: "#71789A", faint: "#AAB0C6",
  line: "#E6E9F2", primary: "#1D4FD7", primaryDark: "#1740B0",
  primarySoft: "#E9EEFC", done: "#27A567", doneSoft: "#E4F5EC",
  gold: "#F5B225", goldSoft: "#FCF1D8", wrong: "#E5484D", wrongSoft: "#FBE7E8",
  lock: "#C3C8D8", shadow: "rgba(30,37,64,0.10)", doneMid: "#C5EBD5",
};
export const DARK = {
  bg: "#0E1322", surface: "#1A2138", sunk: "#141A2C", raise: "#222B45",
  ink: "#F0F2F8", sub: "#9098B8", faint: "#5A6286",
  line: "#27304C", primary: "#5A85FF", primaryDark: "#3D63D8",
  primarySoft: "#1E2A4A", done: "#34C07C", doneSoft: "#16301F",
  gold: "#FFCB57", goldSoft: "#2A2410", wrong: "#FF6166", wrongSoft: "#34191B",
  lock: "#4A5378", shadow: "rgba(0,0,0,0.4)", doneMid: "#234C35",
};

export const DISPLAY = "'Outfit', system-ui, sans-serif";
const glow = (c) => `0 3px 8px -3px ${c}73`;
export const JP = "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', serif";

const ThemeCtx = React.createContext({ t: LIGHT, mode: "light", setMode: () => {} });
export const useTheme = () => React.useContext(ThemeCtx);

function initialMode() {
  try {
    const saved = localStorage.getItem("hk-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch (e) {}
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

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
  const [mode, setMode] = React.useState(initialMode);
  const [cover, setCover] = React.useState(null); // bg color to flash on switch
  const switchMode = React.useCallback((next) => {
    const bg = next === "dark" ? DARK.bg : LIGHT.bg;
    setCover(bg);
    setMode(next);
  }, []);

  React.useEffect(() => {
    try { localStorage.setItem("hk-theme", mode); } catch (e) {}
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
    const old = document.querySelector('meta[name="theme-color"]');
    if (old) old.remove();
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", bg);
    document.head.appendChild(meta);
  }, [mode]);

  const t = mode === "dark" ? { ...DARK, glow } : { ...LIGHT, glow };
  const value = React.useMemo(() => ({ t, mode, setMode: switchMode }), [mode, switchMode]);
  return (
    <ThemeCtx.Provider value={value}>
      {children}
      {cover && <ThemeCover key={cover + mode} bg={cover} />}
    </ThemeCtx.Provider>
  );
}
