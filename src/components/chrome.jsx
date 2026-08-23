import React from "react";
import { useTheme, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";

// Release velocity handed from a pull-down dismiss to App's exit animation, so
// the slide-off continues at the speed it was flung instead of a fixed time.
// One-shot: App reads it right after onDismiss fires the dismiss snapshot, then
// clears ts. Untouched by tap-back / hardware back, which keep the fixed time.
export const flingState = { vy: 0, ts: 0 };

// The Daily Review pill — a subtle gold action in the top-right of every tab
// header, opposite the logo. Shows only when there are items due; taps into
// onReview. Lives here so all four tab screens render it identically.
export function DailyReviewPill({ onReview }) {
  const { t } = useTheme();
  const progress = useProgress();
  if (!onReview || !progress.reviewDue) return null;
  return (
    <button onClick={onReview} className="hk-press" aria-label={`Daily review — ${progress.reviewDue} due`}
      style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer", border: "none",
        background: "rgba(255,255,255,0.12)", color: t.gold, borderRadius: 999,
        padding: "6px 12px 6px 10px", fontFamily: DISPLAY, fontWeight: 500, fontSize: 12.5, whiteSpace: "nowrap" }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
      Daily Review
    </button>
  );
}

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
  subtitle: { fontSize: 13.5, fontWeight: 500, lineHeight: 1.5 },
  body:     { fontSize: 14,   fontWeight: 500, lineHeight: 1.5 },
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
  // The header is an absolute overlay (see StickyHeader), so it no longer
  // reserves space in the scroll flow — the scroll box pads its top by the
  // header's (unscrolled) height instead. Measured once before paint; the
  // compact shrink doesn't change the pad (content just slides further under).
  const headerRef = React.useRef(null);
  const [headerH, setHeaderH] = React.useState(0);
  React.useLayoutEffect(() => {
    if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
  }, []);
  const onScroll = React.useCallback((e) => {
    const y = e.currentTarget.scrollTop;
    // Compact earlier (24) so it feels tied to the scroll; expand near the top
    // (3). The 21px dead-zone stays wider than the ~20px height change, so the
    // scroll-anchoring shift when it compacts can't re-cross and oscillate.
    setScrolled((s) => (y > 24 ? true : y < 3 ? false : s));
  }, []);
  return [scrolled, onScroll, headerRef, headerH];
}

// ── StickyHeader ─────────────────────────────────────────────────────────────
// The cat + screen title row. Transparent and roomy at the top of the page;
// on scroll it sticks, gains a bg + shadow, and tightens so the top area stays
// compact. Each screen owns the `scrolled` flag (onScroll on its scroll box);
// the scroll box must have paddingTop 0 so the header sits flush at the top.
export function StickyHeader({ scrolled, children, right, overlay = false, innerRef }) {
  const { t } = useTheme();
  // Solid header (same navy as the status bar, so the top strip stays seamless)
  // with concave bottom corners, so the white content pane tucks under it.
  // `overlay`: absolute, OUTSIDE the scroll box — the scroll box's elastic
  // bounce can't ride content over it or drag its corners out of place. The
  // scroll box pads its top by the header height (useHeaderScroll) to stand in
  // for the space this no longer reserves in the flow. Non-overlay stays sticky.
  const place = overlay
    ? { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 }
    : { position: "sticky", top: 0, zIndex: 10, margin: "0 -20px" };
  return (
    <div ref={innerRef} style={{ ...place,
      display: "flex", alignItems: "center",
      padding: scrolled ? "9px 20px 9px" : "14px 20px 24px",
      background: t.chrome,
      transition: "padding 200ms var(--ease-header)" }}>
      {/* The logo + title cluster nudges up and scales down when the page is
          scrolled, easing back to full size at the top. transform-origin left so
          it anchors to the left edge (title doesn't drift) instead of the centre. */}
      <div style={{ display: "flex", alignItems: "center", gap: 9,
        transformOrigin: "left center",
        transform: scrolled ? "translateY(-2px) scale(0.9)" : "none",
        transition: "transform 200ms var(--ease-header)" }}>
        {children}
      </div>
      {/* Right-aligned header action (e.g. Daily Review), pushed opposite the
          logo. Sits outside the scaling cluster so it stays a stable tap target
          as the logo shrinks on scroll. */}
      {right && <div style={{ marginLeft: "auto", flexShrink: 0, display: "flex", alignItems: "center" }}>{right}</div>}
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
  general: "/assets/cat-general.webp",
  celebrate: "/assets/cat-success.webp",
  sad: "/assets/cat-fail.webp",
  load: "/assets/cat-load.webp",
  run: "/assets/cat-run.webp",
  smash: "/assets/cat-smash.webp",
  point: "/assets/cat-point.webp",
  crossed: "/assets/cat-crossed.webp",
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
    <p style={{ margin: 0, fontSize: 12.5, color: t.sub, fontWeight: 500, lineHeight: 1.5 }}>
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active ? 2.2 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20.5a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function BottomNav({ active = "Learn", onNav }) {
  const { t, mode } = useTheme();
  // floating pill: inset from all edges, deep shadow so it reads as lifted off the page
  const navShadow = mode === "dark" ? "0 8px 30px -6px rgba(0,0,0,0.77)" : "0 10px 28px -5px rgba(30,37,64,0.50)";
  // fixed (not absolute) so it anchors to the visual viewport bottom and stays
  // put — an absolute bar sits at the bottom of the 100dvh Shell, which can
  // briefly exceed the visible viewport on reload and drop the bar off-screen.
  // Content scrolls right to the bottom behind it (no reserved bg strip); tab
  // screens add bottom padding to clear it. Frosted glass: translucent surface +
  // backdrop blur so content scrolling underneath softly shows through.
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
    <div style={{ position: "fixed", left: 0, right: 0, bottom: "calc(16px + env(safe-area-inset-bottom))", zIndex: 20,
      display: "flex", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ height: H, minWidth: 264, display: "flex", alignItems: "center", gap: 8,
          // When an outer tab is active, dock the group to that edge so the active pill's
          // outer padding equals its 6px top/bottom; middle tab stays centred. Width is
          // pinned by minWidth, so this only shifts the group, never resizes the bar.
          justifyContent: active === "Learn" ? "flex-start" : active === "Scenes" ? "flex-end" : "center",
          borderRadius: 999, padding: "0 6px", ...frost }}>
          {["Learn", "Practice", "Scenes"].map(tab)}
        </div>
        <button onClick={() => onNav && onNav("Profile")} className="hk-press" aria-label="Profile"
          style={{ width: H, height: H, flexShrink: 0, borderRadius: "50%", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", ...frost }}>
          {/* inset inner circle (42 within 54 = 6px inset) so the active blue is
              recessed the same way the left tabs' active pill is */}
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center",
            width: 42, height: 42, borderRadius: "50%",
            background: onProfile ? t.primaryTint : "transparent",
            transition: "background 200ms var(--ease-out-quart)" }}>
            <NavIcon name="Profile" active={onProfile} c={onProfile ? t.primary : t.faint} />
          </span>
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

// ── useDragDismiss ────────────────────────────────────────────────────────
// Drag-down-to-dismiss for full-screen modal sheets. Attach `scrollProps` to
// the screen's scroll container (its scrollTop gates the pull, so the gesture
// never fights an active scroll — it only engages at the top, pulling down) and
// `rootRef` to the Shell that should slide. Touch/pen only; mouse users keep the
// close button. On release past 25% of the sheet height (or a fast flick) it
// calls onDismiss — which hands off to the app's normal dismiss animation from
// the dragged position (the snapshot captures this transform), revealing the
// destination behind. If canDismiss() is false (e.g. mid-lesson) it snaps back
// and calls onBlocked instead (e.g. to raise a confirm). Otherwise it snaps back.
export function useDragDismiss({ onDismiss, onBlocked, canDismiss }) {
  const rootRef = React.useRef(null);
  const scrollRef = React.useRef(null);
  // Latest callbacks in a ref so the listeners can attach once and still call
  // the current closures (they capture live state like the mid-lesson guard).
  const cb = React.useRef(null);
  cb.current = { onDismiss, onBlocked, canDismiss };

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let g = null; // active gesture, or null
    const setT = (transform, transition) => {
      const r = rootRef.current; if (!r) return;
      r.style.transition = transition || "none";
      r.style.transform = transform;
    };
    // Listen on the stable root (not the scroll box) and read the CURRENT scroll
    // container live — a screen's scroll element can change across its states
    // (e.g. a reading view vs its done view). Native touch-scroll and a custom
    // vertical drag can't share the y-axis through touch-action, so we only own
    // the gesture when the sheet fits (touch-action:none stops the browser
    // hijacking the pull); when it overflows we fall back to pan-y and only
    // engage at scrollTop 0. Non-passive touchmove so preventDefault cancels scroll.
    const scEl = () => scrollRef.current;
    const fits = () => { const el = scEl(); return !el || el.scrollHeight <= el.clientHeight + 1; };
    const syncTA = () => { const el = scEl(); if (el) el.style.touchAction = fits() ? "none" : "pan-y"; };
    syncTA();
    const onStart = (e) => {
      syncTA();
      if (e.touches.length !== 1) { g = null; return; }
      const t = e.touches[0];
      g = { y0: t.clientY, x0: t.clientX, t0: Date.now(), on: false, dead: false };
    };
    const onMove = (e) => {
      if (!g || g.dead) return;
      const t = e.touches[0];
      const dy = t.clientY - g.y0, dx = t.clientX - g.x0;
      if (!g.on) {
        if ((scEl()?.scrollTop || 0) > 0) { g.dead = true; return; } // scrolled → let it scroll, don't dismiss
        if (dy > 6 && dy > Math.abs(dx)) g.on = true;               // at the top, pulling down → engage
        else if (dy < -2 || Math.abs(dx) > 10) { g.dead = true; return; } // up / sideways → not ours
        else return;
      }
      e.preventDefault();
      // Track a smoothed instantaneous velocity (EMA) so onEnd can hand the
      // RELEASE speed (not the whole-drag average) to the exit animation.
      const now = Date.now();
      const inst = (t.clientY - (g.lastY ?? g.y0)) / Math.max(1, now - (g.lastT ?? g.t0));
      g.vy = g.vy != null ? g.vy * 0.35 + inst * 0.65 : inst; // bias the latest sample: we want release speed, not the drag average
      g.lastY = t.clientY; g.lastT = now;
      setT(`translateY(${Math.max(0, dy)}px)`);
    };
    const onEnd = (e) => {
      if (!g) return;
      const on = g.on, relVy = Math.max(0, g.vy || 0); // px/ms at release
      const endY = e.changedTouches?.[0]?.clientY ?? g.y0;
      const dy = Math.max(0, endY - g.y0);
      const vy = dy / Math.max(1, Date.now() - g.t0);
      g = null;
      if (!on) return;
      const H = rootRef.current?.offsetHeight || 800;
      const { canDismiss, onDismiss, onBlocked } = cb.current;
      if (dy > H * 0.25 || vy > 0.5) {
        if (!canDismiss || canDismiss()) { // leave transform put; app dismiss continues from here
          flingState.vy = relVy; flingState.ts = Date.now(); // hand release speed to the exit
          onDismiss(); return;
        }
        setT("translateY(0)", "transform 260ms var(--ease-out-quart)"); onBlocked && onBlocked();
      } else {
        setT("translateY(0)", "transform 260ms var(--ease-out-quart)");
      }
    };
    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("touchmove", onMove, { passive: false });
    root.addEventListener("touchend", onEnd, { passive: true });
    root.addEventListener("touchcancel", onEnd, { passive: true });
    const vv = window.visualViewport;
    window.addEventListener("resize", syncTA);
    vv && vv.addEventListener("resize", syncTA);
    return () => {
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchmove", onMove);
      root.removeEventListener("touchend", onEnd);
      root.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("resize", syncTA);
      vv && vv.removeEventListener("resize", syncTA);
    };
  }, []);

  return { rootRef, scrollProps: { ref: scrollRef } };
}

// App shell — fills the viewport, phone-width on larger screens.
export function Shell({ children, active = "Learn", onNav, nav = true, plane = nav, whiteTop = false, modal = false, outerRef }) {
  const { t } = useTheme();
  // whiteTop: the static plane turns white just below the header (so content
  // reads as a white pane tucked under the inverse corners) and fades to the
  // grey planeTop at the bottom. It stays grey through the status bar + header
  // so the top strip is still seamless. Content scrolls over it — no cut-off.
  // Hard cut from the navy chrome to white at +40px (no fade): the fade used to
  // be invisible when chrome was light grey, but a navy→white fade reads as a
  // heavy shadow under the header. +40px sits under the opaque sticky header in
  // both its tall and compact states, so the cut is never visible.
  const planeBg = whiteTop
    ? `linear-gradient(180deg, ${t.chrome}, ${t.chrome})` // solid navy; TabScreen lays a rounded light pane over it
    : `linear-gradient(180deg, ${t.bg}, ${t.planeTop})`;
  return (
    <div ref={outerRef} style={{ width: "100%", maxWidth: 430, margin: "0 auto", height: "100dvh", background: modal ? t.chrome : t.bg,
      display: "flex", flexDirection: "column", fontFamily: DISPLAY, color: t.ink, overflow: "hidden", position: "relative",
      // modal: round + clip the WHOLE frame (status strip + content) as one shape
      // so nothing shows a dark cutout behind the corners, and a drop shadow so
      // the sheet lifts off the screen behind it while it slides / is dragged.
      ...(modal && { borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: "0 -6px 48px rgba(8, 12, 24, 0.16)" }) }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden",
        paddingTop: "env(safe-area-inset-top)", position: "relative" }}>
        {/* Felix-depth: soft tinted plane behind the header + first card so tab screens
            read as stacked layers. Gradient runs from bg (seamless with the status bar) DOWN
            to planeTop. Content (transparent bg) scrolls over it — the plane is static.
            backgroundSize is pinned to `100vh` (the large, stable viewport) so the gradient
            never RESCALES when the mobile dynamic viewport (dvh) shrinks/grows on scroll — the
            element just reveals or clips a fixed-scale gradient instead of stretching it. */}
        {plane && !modal && (
          <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            pointerEvents: "none", backgroundImage: planeBg,
            backgroundSize: "100% 100vh", backgroundRepeat: "no-repeat" }} />
        )}
        {/* modal: content is a grey sheet with rounded top corners over the
            darker chrome (which shows through the status-bar strip + corners),
            so full-screen takeovers read like a default iOS modal. */}
        <div style={{ position: "relative", zIndex: 1, flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
          ...(modal && { background: t.bg }) }}>
          {children}
        </div>
      </div>
      {nav && <BottomNav active={active} onNav={onNav} />}
    </div>
  );
}

// ── TabScreen ─────────────────────────────────────────────────────────────
// The shared frame for the four bottom-nav screens (Learn/Practice/Scenes/
// Profile): Shell + the overlay header + the scroll box, all wired to
// useHeaderScroll. A screen supplies its `header` content and its scrollable
// body; the header-height spacer, overscroll containment and the compact-scroll
// flag live here so they can't drift across screens.
export function TabScreen({ active, onNav, header, onReview, children }) {
  const { t } = useTheme();
  const [scrolled, onHeaderScroll, headerRef, headerH] = useHeaderScroll();
  // The light content pane sits on the navy with rounded top corners AT the
  // header's bottom, and it IS the scroll container so content clips to those
  // corners. The header shrinks by EXACTLY its padding delta on scroll —
  // (14+24) - (9+9) = 20px; the logo's scale(0.9) is a visual transform and
  // doesn't change layout height — so the compact top is exactly headerH - 20.
  // A larger offset would let the header edge overlap and clip the corners.
  const paneTop = headerH ? (scrolled ? headerH - 20 : headerH) : 0;
  // Skip the top transition on first mount (headerH measures from 0), so the
  // pane doesn't slide/round in on load; enable it after a frame.
  const [animate, setAnimate] = React.useState(false);
  React.useEffect(() => { const id = requestAnimationFrame(() => setAnimate(true)); return () => cancelAnimationFrame(id); }, []);
  return (
    <Shell active={active} onNav={onNav} whiteTop>
      <StickyHeader scrolled={scrolled} overlay innerRef={headerRef} right={<DailyReviewPill onReview={onReview} />}>{header}</StickyHeader>
      <div onScroll={onHeaderScroll}
        style={{ position: "absolute", top: paneTop, left: 0, right: 0, bottom: 0, zIndex: 1,
          transition: animate ? "top 200ms var(--ease-header)" : "none",
          overflowY: "auto", overscrollBehaviorY: "contain",
          // white at the top of the pane easing down to the grey planeTop, pinned
          // to 100vh so it doesn't rescale as the pane top shifts or dvh changes.
          backgroundImage: `linear-gradient(180deg, ${t.surface}, ${t.planeTop})`,
          backgroundSize: "100% 100vh", backgroundRepeat: "no-repeat",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          // Longhand (not the `padding` shorthand + env()/calc): the shorthand
          // serialises to an empty style attribute in an innerHTML snapshot clone.
          paddingRight: 20, paddingLeft: 20,
          paddingBottom: "calc(94px + env(safe-area-inset-bottom))" }}>
        {children}
      </div>
    </Shell>
  );
}
