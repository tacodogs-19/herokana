import React from "react";
import { useTheme, DISPLAY } from "../theme.jsx";

// ── Text ──────────────────────────────────────────────────────────────────
// One source of truth for the app's text roles. Screens use <Text variant>
// instead of hand-rolling size/weight/tracking inline, so a change to e.g.
// "subtitle" propagates everywhere instead of drifting per screen.
// Colour has a per-variant default but is overridable (eyebrows are ink on a
// section heading, primary on the card, etc.); margins/layout stay per-caller.
const TEXT_VARIANTS = {
  eyebrow:  { fontSize: 11.5, fontWeight: 900, letterSpacing: "0.14em" },
  heading:  { fontSize: 20,   fontWeight: 800 },
  title:    { fontSize: 22,   fontWeight: 800 },
  subtitle: { fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 },
  body:     { fontSize: 14,   fontWeight: 600, lineHeight: 1.5 },
  caption:  { fontSize: 11.5, fontWeight: 700 },
};
const TEXT_DEFAULT_COLOR = { eyebrow: "sub", heading: "ink", title: "ink", subtitle: "sub", body: "ink", caption: "faint" };
export function Text({ variant = "body", as: Tag = "p", color, style, children, ...rest }) {
  const { t } = useTheme();
  return (
    <Tag style={{ margin: 0, fontFamily: DISPLAY, color: color || t[TEXT_DEFAULT_COLOR[variant]], ...TEXT_VARIANTS[variant], ...style }} {...rest}>
      {children}
    </Tag>
  );
}

// Drives StickyHeader's compact state from a scroll box's onScroll. Hysteresis
// (on above 30, off below 6) is deliberate: the header shrinks ~20px when
// compact, which — being in the sticky flow — shifts scrollTop back via scroll
// anchoring. A single threshold would let that shift re-cross the line and the
// header would oscillate; a dead-zone wider than the height change stops it.
export function useHeaderScroll() {
  const [scrolled, setScrolled] = React.useState(false);
  const onScroll = React.useCallback((e) => {
    const y = e.currentTarget.scrollTop;
    setScrolled((s) => (y > 30 ? true : y < 6 ? false : s));
  }, []);
  return [scrolled, onScroll];
}

// ── StickyHeader ─────────────────────────────────────────────────────────────
// The cat + screen title row. Transparent and roomy at the top of the page;
// on scroll it sticks, gains a bg + shadow, and tightens so the top area stays
// compact. Each screen owns the `scrolled` flag (onScroll on its scroll box);
// the scroll box must have paddingTop 0 so the header sits flush at the top.
export function StickyHeader({ scrolled, children }) {
  const { t, mode } = useTheme();
  // On scroll the header frosts: a backdrop-blur layer whose background ramps
  // from solid t.bg at the top (seamless with the status bar) into a translucent
  // frost. The bottom is a crisp, defined edge (soft shadow), not a fade. The
  // content row sits above it, crisp.
  const frostBg = `linear-gradient(to bottom, ${t.bg} 0%, ${t.bg} 32%, color-mix(in srgb, ${t.bg} 80%, transparent) 100%)`;
  const shadow = mode === "dark" ? "0 6px 18px -8px rgba(0,0,0,0.6)" : "0 6px 18px -8px rgba(7,15,36,0.22)";
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, margin: "0 -20px" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: frostBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: scrolled ? shadow : "none",
        opacity: scrolled ? 1 : 0, transition: "opacity 220ms ease" }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 9,
        padding: scrolled ? "9px 20px 9px" : "14px 20px 24px",
        transition: "padding 220ms var(--ease-out-quart)" }}>
        {children}
      </div>
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
// The app's floating surface: white, rounded, soft lift. One definition so the
// shadow/shape can't drift per screen. `as="button"` for clickable cards
// (reference rows, settings rows). Radius/padding come from the caller's style.
export function Card({ as: Tag = "div", className = "", style, children, ...rest }) {
  const { t } = useTheme();
  const isBtn = Tag === "button";
  return (
    <Tag className={isBtn ? ("hk-press " + className).trim() : (className || undefined)}
      style={{ background: t.surface, border: "none", borderRadius: 20, boxShadow: t.cardShadow,
        ...(isBtn && { cursor: "pointer", textAlign: "left", font: "inherit", width: "100%" }), ...style }} {...rest}>
      {children}
    </Tag>
  );
}

// ── Button ──────────────────────────────────────────────────────────────────
// primary = filled accent + glow (the glow lives HERE, so every primary action
// gets it automatically and consistently). soft = recessed sunk chip.
// outline = bordered surface. Accent colour overridable; radius/padding/size
// via style. Interactive press (.hk-press) is baked in.
export function Button({ variant = "primary", color, className = "", style, children, ...rest }) {
  const { t } = useTheme();
  const c = color || t.primary;
  const V = {
    primary: { background: c, color: "#fff", boxShadow: t.glow(c) },
    soft:    { background: t.sunk, color: c, fontWeight: 700 }, // secondary: lighter than the 800 primary
    outline: { background: t.surface, color: c, border: `1.5px solid ${t.line}` },
  };
  return (
    <button className={("hk-press " + className).trim()}
      style={{ border: "none", cursor: "pointer", fontFamily: DISPLAY, fontWeight: 800, borderRadius: 16, ...V[variant], ...style }} {...rest}>
      {children}
    </button>
  );
}

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

// Kana clips are bundled, but words/sentences/verbs still speak via the OS
// Japanese voice — absent on some bare Android devices. Where those surfaces
// can't play, point the learner at the one fix web code can offer: install
// Google's TTS engine (a PWA/TWA can't fire the native install-voice intent).
const TTS_PLAY_URL = "https://play.google.com/store/apps/details?id=com.google.android.tts";
export function NoVoiceHint({ children }) {
  const { t } = useTheme();
  return (
    <p style={{ margin: 0, fontSize: 12.5, color: t.sub, fontWeight: 600, lineHeight: 1.5 }}>
      {children || "This device has no Japanese voice, so audio here stays silent."}{" "}
      <a href={TTS_PLAY_URL} target="_blank" rel="noopener noreferrer"
        style={{ color: t.primary, fontWeight: 700, textDecoration: "underline" }}>
        Install or update Google Text-to-Speech
      </a>{" "}to turn it on.
    </p>
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
      {/* active shoulders close with z so the fill's bottom edge gets round
          joins — an open arc auto-closes with sharp corners that poke past
          the round stroke caps and read as a clipped edge */}
      <circle cx="12" cy="8" r="4" /><path d={active ? "M4 20.5a8 8 0 0 1 16 0z" : "M4 20.5a8 8 0 0 1 16 0"} />
    </svg>
  );
}

export function BottomNav({ active = "Learn", onNav }) {
  const { t, mode } = useTheme();
  // floating pill: inset from all edges, deep shadow so it reads as lifted off the page
  const navShadow = mode === "dark" ? "0 8px 30px -6px rgba(0,0,0,0.77)" : "0 10px 28px -5px rgba(30,37,64,0.50)";
  // absolute so content scrolls right to the bottom behind it (no reserved bg strip);
  // tab screens add bottom padding to clear it. Inset from all edges, deep shadow.
  // Frosted glass: slightly translucent surface + backdrop blur so content
  // scrolling underneath softly shows through.
  const navBg = mode === "dark" ? "rgba(26,33,56,0.82)" : "rgba(255,255,255,0.82)";
  // Frosted-glass surface shared by both nav segments.
  const frost = { background: navBg, boxShadow: navShadow,
    backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" };
  // Google-Photos-style bar: inactive destinations are a bare label; the active
  // one morphs into a filled pill with its icon. Profile is pulled out into its
  // own frosted circle on the right (their Search).
  const tab = (label) => {
    const on = label === active;
    return (
      <button key={label} onClick={() => onNav && onNav(label)} className="hk-press"
        style={{ display: "flex", alignItems: "center", gap: on ? 7 : 0, cursor: "pointer", border: "none",
          background: on ? t.primaryTint : "transparent", borderRadius: 999,
          padding: on ? "9px 15px" : "9px 10px", transition: "background 200ms var(--ease-out-quart)" }}>
        {on && <NavIcon name={label} active c={t.primary} />}
        <span style={{ fontSize: 12.5, fontWeight: on ? 700 : 600, color: on ? t.primary : t.sub,
          fontFamily: DISPLAY, whiteSpace: "nowrap" }}>{label}</span>
      </button>
    );
  };
  const onProfile = active === "Profile";
  const H = 54; // fixed nav height so the bar stays put across tabs and the profile circle is round
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: "calc(16px + env(safe-area-inset-bottom))", zIndex: 20,
      display: "flex", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ height: H, minWidth: 264, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          borderRadius: 999, padding: "0 6px", ...frost }}>
          {["Learn", "Practice", "Scenes"].map(tab)}
        </div>
        <button onClick={() => onNav && onNav("Profile")} className="hk-press" aria-label="Profile"
          style={{ width: H, height: H, flexShrink: 0, borderRadius: "50%", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            ...frost, ...(onProfile && { background: t.primaryTint }) }}>
          <NavIcon name="Profile" active={onProfile} c={onProfile ? t.primary : t.faint} />
        </button>
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
export function Shell({ children, active = "Learn", onNav, nav = true, plane = nav }) {
  const { t } = useTheme();
  return (
    <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", height: "100dvh", background: t.bg,
      display: "flex", flexDirection: "column", fontFamily: DISPLAY, color: t.ink, overflow: "hidden", position: "relative" }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden",
        paddingTop: "env(safe-area-inset-top)", position: "relative" }}>
        {/* Felix-depth: soft tinted plane behind the header + first card so tab screens
            read as stacked layers. Gradient runs from bg (seamless with the status bar) DOWN
            to planeTop. Content (transparent bg) scrolls over it — the plane is static.
            backgroundSize is pinned to `100vh` (the large, stable viewport) so the gradient
            never RESCALES when the mobile dynamic viewport (dvh) shrinks/grows on scroll — the
            element just reveals or clips a fixed-scale gradient instead of stretching it. */}
        {plane && (
          <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            pointerEvents: "none", background: `linear-gradient(180deg, ${t.bg}, ${t.planeTop})`,
            backgroundSize: "100% 100vh", backgroundRepeat: "no-repeat" }} />
        )}
        <div style={{ position: "relative", zIndex: 1, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
      {nav && <BottomNav active={active} onNav={onNav} />}
    </div>
  );
}
