import React from "react";
import { useTheme, DISPLAY } from "../theme.jsx";

// The cat sticker set from the handoff — by the user's direction it appears
// only as the app icon and on the result (success / keep-practising) screen.
const CAT_SRC = {
  general: "/assets/cat-general.svg",
  celebrate: "/assets/cat-success.svg",
  sad: "/assets/cat-fail.svg",
  load: "/assets/cat-load.svg",
  run: "/assets/cat-run.svg",
  smash: "/assets/cat-smash.svg",
  point: "/assets/cat-point.svg",
  crossed: "/assets/cat-crossed.svg",
};

export function Cat({ mood = "general", size = 64, style, className }) {
  return (
    <img src={CAT_SRC[mood] || CAT_SRC.general} alt="" aria-hidden="true" width={size} height={size}
      className={className}
      style={{ display: "block", width: size, height: size, objectFit: "contain", flexShrink: 0, ...style }} />
  );
}

export function Ring({ size = 46, stroke = 4, pct, color, track, pct2, color2, children }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const r2 = r - stroke - 5, circ2 = 2 * Math.PI * r2;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 400ms ease" }} />
        {pct2 != null && color2 && r2 > 0 && (
          <>
            <circle cx={size / 2} cy={size / 2} r={r2} fill="none" stroke={track} strokeWidth={stroke - 2} />
            <circle cx={size / 2} cy={size / 2} r={r2} fill="none" stroke={color2} strokeWidth={stroke - 2} strokeLinecap="round"
              strokeDasharray={`${(pct2 / 100) * circ2} ${circ2}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dasharray 400ms ease" }} />
          </>
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

export function ThemeToggle() {
  const { t, mode, setMode } = useTheme();
  return (
    <button onClick={() => setMode(mode === "light" ? "dark" : "light")} className="hk-press" aria-label="Toggle theme"
      style={{ width: 42, height: 42, borderRadius: 13, cursor: "pointer", background: t.surface, border: `1.5px solid ${t.line}`,
        color: t.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {mode === "light"
        ? <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>
        : <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></svg>}
    </button>
  );
}

function NavIcon({ name, active, c }) {
  if (name === "Learn") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active ? 2.2 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5A2 2 0 0 1 6 4h4a2.5 2.5 0 0 1 2 1 2.5 2.5 0 0 1 2-1h4a2 2 0 0 1 2 1.5V18a1 1 0 0 1-1 1h-5a2 2 0 0 0-2 1 2 2 0 0 0-2-1H5a1 1 0 0 1-1-1z" /><path d="M12 5v14" />
    </svg>
  );
  if (name === "Practice") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? c : "none"} stroke={c} strokeWidth={active ? 1.6 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2.5 4.5 13.5h6L11 21.5 19.5 10.5h-6z" />
    </svg>
  );
  if (name === "Scenes") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active ? 2.2 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21.5s6.5-5.3 6.5-10.5a6.5 6.5 0 1 0-13 0c0 5.2 6.5 10.5 6.5 10.5Z" />
      <circle cx="12" cy="10.5" r="2.5" />
    </svg>
  );
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? c : "none"} stroke={c} strokeWidth={active ? 1.8 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20.5a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function BottomNav({ active = "Learn", onNav }) {
  const { t } = useTheme();
  return (
    <div style={{ flexShrink: 0, background: t.surface, borderTop: `1px solid ${t.line}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div style={{ display: "flex" }}>
        {["Learn", "Practice", "Scenes", "Profile"].map((label) => {
          const on = label === active;
          const c = on ? t.primary : t.faint;
          return (
            <button key={label} onClick={() => onNav && onNav(label)} className="hk-press" style={{ flex: 1, padding: "11px 0 9px",
              background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <NavIcon name={label} active={on} c={c} />
              <span style={{ fontSize: 11, fontWeight: on ? 700 : 500, color: c, fontFamily: DISPLAY }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Dimmed overlay for dialogs. `position` "bottom" docks the card to the bottom
// (e.g. the update toast); "center" centers it (e.g. confirmations).
export function Modal({ children, onDismiss, position = "center" }) {
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, height: "100dvh", zIndex: 1000, display: "flex", justifyContent: "center",
      alignItems: position === "bottom" ? "flex-end" : "center",
      padding: position === "bottom" ? "0 14px calc(16px + env(safe-area-inset-bottom))" : "0 18px",
      animation: "hkFade 160ms ease both" }}>
      <div onClick={onDismiss} aria-hidden style={{ position: "absolute", inset: 0, background: "rgba(8,12,24,0.25)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 402, transformOrigin: "center",
        animation: position === "bottom" ? "hkSheetIn 320ms var(--ease-drawer) both" : "hkPopIn 180ms var(--ease-out) both" }}>{children}</div>
    </div>
  );
}

// App shell — fills the viewport, phone-width on larger screens.
export function Shell({ children, active = "Learn", onNav, nav = true, scrollShadow = true }) {
  const { t, mode } = useTheme();
  const ref = React.useRef(null);
  const [scrolled, setScrolled] = React.useState(false);
  // Capture phase lets us observe each screen's own scroll container without
  // wiring it up per screen.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = (e) => {
      const top = e.target && e.target.scrollTop;
      if (typeof top === "number") setScrolled(top > 2);
    };
    el.addEventListener("scroll", onScroll, true);
    return () => el.removeEventListener("scroll", onScroll, true);
  }, []);
  const shadowColor = mode === "dark" ? "rgba(0,0,0,0.22)" : "rgba(30,37,64,0.13)";
  return (
    <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", height: "100dvh", background: t.bg,
      display: "flex", flexDirection: "column", fontFamily: DISPLAY, color: t.ink, overflow: "hidden" }}>
      <div ref={ref} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden",
        paddingTop: "env(safe-area-inset-top)", position: "relative" }}>
        {children}
        {/* subtle shadow under the status bar, only while scrolled */}
        <div aria-hidden style={{ position: "absolute", top: "env(safe-area-inset-top)", left: 0, right: 0, height: 12,
          pointerEvents: "none", zIndex: 5, transition: "opacity 220ms ease", opacity: scrollShadow && scrolled ? 1 : 0,
          background: `linear-gradient(to bottom, ${shadowColor}, transparent)` }} />
      </div>
      {nav && <BottomNav active={active} onNav={onNav} />}
    </div>
  );
}
