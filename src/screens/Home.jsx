import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { CHAPTERS, BANKS } from "../data";
import { Ring, Modal, Text, Button, TabScreen } from "../components/chrome.jsx";
import { readingUnlocked, READING_PACKS } from "../reading.js";

// Play the Learn entrance once per app load — and only after the splash has
// lifted (main.jsx dispatches hk-splash-hidden), so it isn't spent behind it.
let homeEntered = false;

function UnitChip({ unit, st, t, onClick }) {
  // Completed units are an INACTIVE state — they carry no fill colour (product
  // register bans heavy colour on inactive states). Neutral tile + crisp ink
  // glyph (never grey-on-tint, which reads muddy); the green tick is the sole
  // "done" signal. Green lives in the tick + the hero ring, not 22 surfaces.
  // done keeps its green tint; current is a soft blue tint fill with blue text;
  // locked is a neutral grey fill (inactive).
  const bg = st === "current" ? t.primaryTint : st === "done" ? t.doneSoft : t.sunk;
  const fg = st === "current" ? t.primary : st === "done" ? t.done : t.faint;
  return (
    <button onClick={onClick} disabled={st === "locked"} className="hk-press" title={unit.label}
      style={{ position: "relative", aspectRatio: "1", borderRadius: 14, cursor: st === "locked" ? "default" : "pointer", padding: 0, minWidth: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
        background: bg, border: "none",
        boxShadow: "none", color: fg }}>
      {st === "done" && (
        <span style={{ position: "absolute", top: 0, right: 0, transform: "translate(30%,-30%)",
          width: 22, height: 22, borderRadius: "50%", background: t.done, border: `2px solid ${t.surface}`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5" /></svg>
        </span>
      )}
      <span style={{ fontFamily: JP, fontSize: 19, fontWeight: 700 }}>{unit.jp}</span>
      <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.9, maxWidth: "92%", overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{unit.label}</span>
    </button>
  );
}

function ChapterCard({ chapterIdx, hard, progress, t, currentChapterIdx, expanded, setExpanded,
  onStart, onReviewChapter, onOpenBasics, onOpenKanaBasics, onOpenChart, onStartSession, onOpenScenes, onOpenVerbChart, onResetRequest }) {
  const isAlpha = (i) => !BANKS[CHAPTERS[i].id];
  const doneFor = (i) => hard ? (isAlpha(i) ? CHAPTERS[i].units.length : (progress.hardDone[i] ?? 0)) : (progress.done[i] ?? 0);

  const chapter = CHAPTERS[chapterIdx];
  const doneCount = doneFor(chapterIdx);
  const st = (() => {
    if (doneCount >= chapter.units.length) return "done";
    if (chapterIdx === currentChapterIdx) return "current";
    if (chapterIdx < currentChapterIdx) return "done";
    return "locked";
  })();
  const cpct = Math.round((doneCount / chapter.units.length) * 100);

  // Animate ring + bar from 0 on every mount (swipe remounts center slot via key).
  // On cpct change while already mounted, update directly so progress updates feel instant.
  // Suppress hk-reveal when expanded was already true on mount (e.g. swiped in with section open).
  // Once the user collapses the section, lift the suppression so re-expanding animates normally.
  const suppressReveal = React.useRef(expanded);
  React.useEffect(() => { if (!expanded) suppressReveal.current = false; }, [expanded]);

  const unit = st === "done" ? chapter.units[chapter.units.length - 1] : chapter.units[Math.min(doneCount, chapter.units.length - 1)];
  const accent = st === "done" ? t.done : st === "current" ? t.primary : t.lock;
  // ring + primary CTA stay blue even on a completed chapter (green is reserved for
  // the "what's in this chapter" section — pill, bar, unit ticks)
  const ringCta = st === "locked" ? t.lock : t.primary;
  const upNext = chapter.units.slice(doneCount + 1, doneCount + 3);
  const firstUse = !hard && progress.totalDone === 0 && progress.answered === 0;
  const canReset = doneCount > 0 && !(hard && isAlpha(chapterIdx));
  const scenesStarted = READING_PACKS.filter(p => progress.reading[p.id]?.plays > 0).length;

  const heading = st === "current" ? (firstUse ? "START YOUR JOURNEY" : "CONTINUE LEARNING")
    : st === "done" ? "CHAPTER COMPLETE" : "UP AHEAD";
  const resetBtn = canReset && (
    <button onClick={() => onResetRequest(chapterIdx)} className="hk-press"
      aria-label="Reset chapter progress"
      style={{ flexShrink: 0, padding: "5px 9px", borderRadius: 9, background: t.sunk, border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 4, color: t.faint }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
      </svg>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.04em" }}>RESET</span>
    </button>
  );
  return (
    <>
      {/* Section heading lives ABOVE the card, grey like the other eyebrows; the
          reset control rides on its right (see the ChapterCard bottom row before). */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 26, margin: "0 4px 10px" }}>
        <Text variant="eyebrow" color={t.ink} style={{ flex: 1 }}>{heading}</Text>
        {resetBtn}
      </div>
    <div style={{ background: t.surface, border: "none", borderRadius: 26,
      padding: "20px 20px 20px", boxShadow: t.cardShadow }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, margin: "0 0 4px" }}>
        <Ring size={164} stroke={12} pct={st === "locked" ? 0 : cpct} color={ringCta} track={t.sunk}>
          {st === "locked"
            ? <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={t.lock} strokeWidth="1.8"><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" /></svg>
            : <span style={{ fontFamily: JP, fontSize: 68, fontWeight: 700, color: t.ink, lineHeight: 1 }}>{unit.jp}</span>}
        </Ring>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: t.ink }}>{chapter.name}</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13.5, color: t.sub, fontWeight: 500, whiteSpace: "nowrap" }}>
            {st === "locked" ? `Finish ${CHAPTERS[Math.max(0, chapterIdx - 1)].name} to unlock`
              : st === "done" ? `All ${chapter.units.length} units mastered`
              : `${unit.label} · unit ${doneCount + 1} of ${chapter.units.length}`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, height: 29 }}>
          {st === "current" && upNext.length > 0 && (
            <>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: t.faint, letterSpacing: "0.04em" }}>UP NEXT</span>
              {upNext.map((u, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: t.sunk, padding: "5px 10px 5px 7px", borderRadius: 10, flexShrink: 0 }}>
                  <span style={{ fontFamily: JP, fontSize: 15, fontWeight: 700, color: t.sub }}>{u.jp}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: t.sub, whiteSpace: "nowrap" }}>{u.label}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <Button color={ringCta} disabled={st === "locked"}
        onClick={() => st !== "locked" && (st === "done" ? onReviewChapter(chapterIdx) : onStart(chapterIdx))}
        style={{ width: "100%", marginTop: 12, padding: "15px", borderRadius: 16, fontSize: 16,
          ...(st === "locked" && { background: t.sunk, color: t.faint, boxShadow: "none", cursor: "default" }) }}>
        {st === "locked" ? "Locked" : st === "done" ? "Review chapter" : firstUse ? "Get Started →" : doneCount === 0 ? "Start lesson →" : "Continue lesson →"}
      </Button>

      {(chapter.id === "hira" || chapter.id === "kata") && st !== "locked" && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {[
            { label: firstUse ? "Kana basics" : "Read the basics", onClick: onOpenKanaBasics,
              icon: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></> },
            { label: "Kana chart", onClick: onOpenChart,
              icon: <><rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M9 3v18M3 9h18M3 15h18M15 3v18" /></> },
          ].map((b) => (
            <button key={b.label} onClick={b.onClick} className="hk-press"
              style={{ flex: 1, minWidth: 0, padding: "11px 8px", borderRadius: 13, cursor: "pointer",
                background: t.sunk, border: "none", color: t.primary, fontFamily: DISPLAY, fontSize: 12.5, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
              {b.label}
            </button>
          ))}
        </div>
      )}

      {chapter.id === "verb" && st !== "locked" && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={onOpenVerbChart} className="hk-press"
            style={{ flex: 1, minWidth: 0, padding: "11px 8px", borderRadius: 13, cursor: "pointer",
              background: t.sunk, border: "none", color: t.primary, fontFamily: DISPLAY, fontSize: 12.5, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h13" /></svg>
            Verb list
          </button>
        </div>
      )}

      {chapter.id === "complex" && st !== "locked" && readingUnlocked(progress) && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={onOpenScenes} className="hk-press"
            style={{ flex: 1, minWidth: 0, padding: "11px 8px", borderRadius: 13, cursor: "pointer",
              background: t.sunk, border: "none", color: t.primary, fontFamily: DISPLAY, fontSize: 12.5, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {scenesStarted > 0 ? `Scenes · ${scenesStarted} of ${READING_PACKS.length} done` : "Explore Scenes →"}
          </button>
        </div>
      )}

      {chapter.id === "sentence" && st !== "locked" && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {[
            { label: "Read the basics", onClick: onOpenBasics,
              icon: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></> },
            { label: "Practice particles", onClick: () => onStartSession({ kind: "foundations" }),
              icon: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /> },
          ].map((b) => (
            <button key={b.label} onClick={b.onClick} className="hk-press"
              style={{ flex: 1, minWidth: 0, padding: "11px 8px", borderRadius: 13, cursor: "pointer",
                background: t.sunk, border: "none", color: t.primary, fontFamily: DISPLAY, fontSize: 12.5, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
              {b.label}
            </button>
          ))}
        </div>
      )}

      {st !== "locked" && (
        <>
          <button onClick={() => setExpanded((e) => !e)} className="hk-press"
            style={{ width: "100%", marginTop: 16, padding: "20px 0 0", borderTop: `1px solid ${t.line}`, background: "transparent",
              borderLeft: "none", borderRight: "none", borderBottom: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between", color: t.ink }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap" }}>What's in this chapter</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: ringCta, background: t.primarySoft, padding: "2px 8px", borderRadius: 7 }}>
                {doneCount}/{chapter.units.length}
              </span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.faint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms ease", flexShrink: 0 }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {expanded && (
            <div className={suppressReveal.current ? "" : "hk-reveal"} style={{ marginTop: 12 }}>
              <div style={{ height: 6, borderRadius: 4, background: t.sunk, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ width: `${cpct}%`, height: "100%", borderRadius: 4, background: ringCta, transition: "width 500ms ease" }} />
              </div>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: `repeat(4, minmax(0, 1fr))` }}>
                {chapter.units.map((u, i) => {
                  const ust = i < doneCount ? "done" : i === doneCount && st === "current" ? "current" : "locked";
                  return <UnitChip key={i} unit={u} st={ust} t={t} onClick={() => ust !== "locked" && onStart(chapterIdx, i)} />;
                })}
              </div>
              <p style={{ margin: "18px 2px 4px", fontSize: 11.5, fontWeight: 500, color: t.sub }}>
                Tap a unit to jump straight in · score 80% to mark it complete.
              </p>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}

function HomeBody({ onNav, onStart, onStartReview, onReviewChapter, onOpenBasics, onOpenKanaBasics, onOpenChart, onStartSession, onOpenScenes, onOpenVerbChart }) {
  const { t } = useTheme();
  const progress = useProgress();
  const hard = progress.hard;
  const isAlpha = (i) => !BANKS[CHAPTERS[i].id];
  const doneFor = (i) => (hard ? (isAlpha(i) ? CHAPTERS[i].units.length : progress.hardDone[i]) : progress.done[i]);
  let currentChapterIdx = CHAPTERS.findIndex((c, i) => doneFor(i) < c.units.length);
  if (currentChapterIdx === -1) currentChapterIdx = CHAPTERS.length - 1;

  const [sel, setSel] = React.useState(() => {
    try { const v = localStorage.getItem("hk-home-sel"); if (v != null && CHAPTERS[+v]) return +v; } catch (e) {}
    return currentChapterIdx;
  });
  const [expanded, setExpanded] = React.useState(() => {
    try { return localStorage.getItem("hk-home-exp") === "1"; } catch (e) { return false; }
  });
  const [hardInfoOpen, setHardInfoOpen] = React.useState(false);
  const [resetTarget, setResetTarget] = React.useState(null);
  const hardUnlocked = progress.trackComplete;

  // Entrance: rise + crossfade the content in when the splash lifts.
  const [anim, setAnim] = React.useState(() => !homeEntered && window.__hkSplashHidden === true);
  React.useEffect(() => {
    if (homeEntered) return;
    if (anim) { homeEntered = true; return; } // splash already gone (e.g. after onboarding)
    const on = () => { homeEntered = true; setAnim(true); };
    window.addEventListener("hk-splash-hidden", on, { once: true });
    return () => window.removeEventListener("hk-splash-hidden", on);
  }, []); // eslint-disable-line
  const enterCls = anim ? "hk-enter" : "";

  React.useEffect(() => { try { localStorage.setItem("hk-home-sel", String(sel)); } catch (e) {} }, [sel]);
  React.useEffect(() => {
    if (hard) setSel(currentChapterIdx);
  }, [hard]); // eslint-disable-line
  React.useEffect(() => { try { localStorage.setItem("hk-home-exp", expanded ? "1" : "0"); } catch (e) {} }, [expanded]);

  const railRef = React.useRef(null);
  const railScrolled = React.useRef(false);
  React.useEffect(() => {
    const el = railRef.current && railRef.current.querySelector(`[data-rail="${sel}"]`);
    // Instant on mount/re-mount — the rail re-renders at scrollLeft 0, and
    // opening+closing a lesson re-mounts Learn, so a smooth scroll here slides
    // the track across and reads as a mispositioning. Smooth only once the user
    // changes the selection (carousel swipe).
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: "center", block: "nearest", behavior: railScrolled.current ? "smooth" : "auto" });
    railScrolled.current = true;
  }, [sel]);

  const railIdx = hard ? CHAPTERS.map((_, i) => i).filter((i) => !isAlpha(i)) : CHAPTERS.map((_, i) => i);
  const pick = (i) => {
    if (animating.current) return;
    if (i === nextIdx) {
      snapTo("translateX(-66.666%)", -1, nextIdx, () => setExpanded(true));
    } else if (i === prevIdx) {
      snapTo("translateX(0%)", 1, prevIdx, () => setExpanded(true));
    } else {
      // Non-adjacent: fade out, swap content, fade back in.
      const container = containerRef.current;
      if (container && !reducedMotion()) {
        animating.current = true;
        container.style.transition = "opacity 150ms ease";
        container.style.opacity = "0";
        setTimeout(() => {
          setSel(i);
          setExpanded(true);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            container.style.opacity = "1";
            setTimeout(() => {
              container.style.transition = "none";
              animating.current = false;
            }, 150);
          }));
        }, 150);
      } else {
        setSel(i);
        setExpanded(true);
      }
    }
  };

  // ── carousel ──────────────────────────────────────────────────────────
  const containerRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const slotRefs = [React.useRef(null), React.useRef(null), React.useRef(null)];
  // ponytail: drag state in a ref so moves don't trigger re-renders
  const drag = React.useRef({ active: false, startX: 0, startY: 0, isHoriz: null, vel: 0, prevX: 0, prevT: 0 });
  const animating = React.useRef(false);

  const railPos = railIdx.indexOf(sel);
  const canSwipe = railIdx.length > 1;
  const prevIdx = railIdx[(railPos - 1 + railIdx.length) % railIdx.length];
  const nextIdx = railIdx[(railPos + 1) % railIdx.length];

  const CENTER = "translateX(-33.333%)";
  const SIDE_OPACITY = 0.55;
  const SIDE_SCALE = 0.92;
  // expo ease matches --ease-out-expo in styles.css; used for all carousel motion
  const EASE_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
  const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Interpolate slot opacity/scale based on normalised swipe progress.
  // progress: -1 = fully left (next visible), 0 = center, +1 = fully right (prev visible).
  const applySlots = (progress, withTransition) => {
    const dur = withTransition && !reducedMotion() ? "260ms" : "0ms";
    const tr = withTransition ? `opacity ${dur} ${EASE_EXPO}, transform ${dur} ${EASE_EXPO}` : "none";
    const p = Math.max(-1, Math.min(1, progress));
    const out = Math.abs(p);
    const inSlot = p > 0 ? 0 : 2;
    const outSlot = p > 0 ? 2 : 0;
    const setSlot = (ref, op, sc) => {
      if (!ref.current) return;
      ref.current.style.transition = tr;
      ref.current.style.opacity = String(op);
      ref.current.style.transform = `scale(${sc})`;
    };
    setSlot(slotRefs[1], 1 - (1 - SIDE_OPACITY) * out, 1 - (1 - SIDE_SCALE) * out);
    setSlot(slotRefs[inSlot], SIDE_OPACITY + (1 - SIDE_OPACITY) * out, SIDE_SCALE + (1 - SIDE_SCALE) * out);
    setSlot(slotRefs[outSlot], SIDE_OPACITY, SIDE_SCALE);
  };

  // Reset track + slots to center state before paint.
  // Running in useLayoutEffect (not transitionend) prevents the one-frame flash where
  // the old card briefly appears at center position before React re-renders new content.
  // align-items:flex-start on the track means scrollHeight = natural content height (not
  // flex-stretched), so the container height pin equals the actual center card height.
  React.useLayoutEffect(() => {
    const el = trackRef.current;
    if (el) { el.style.transition = "none"; el.style.transform = CENTER; }
    applySlots(0, false);
    animating.current = false;
    const center = slotRefs[1].current;
    const container = containerRef.current;
    if (center && container) container.style.height = center.scrollHeight + "px";
  }, [sel, expanded]); // eslint-disable-line

  const snapTo = (targetTransform, targetProgress, newSel, onDone) => {
    animating.current = true;
    const el = trackRef.current;
    const isReduced = reducedMotion();
    const durMs = isReduced ? 0 : 260;

    // Animate container height to incoming card's height so it doesn't crop the slide.
    // targetProgress < 0 → swiping left → incoming card is slot 2; > 0 → slot 0.
    const container = containerRef.current;
    const incomingSlot = slotRefs[targetProgress < 0 ? 2 : 0].current;
    if (container && incomingSlot && !isReduced) {
      container.style.transition = `height ${durMs}ms ${EASE_EXPO}`;
      container.style.height = incomingSlot.scrollHeight + "px";
    }

    el.style.transition = `transform ${durMs}ms ${EASE_EXPO}`;
    el.style.transform = targetTransform;
    applySlots(targetProgress, true);
    // Fire 80ms before the slide ends — expo-out is 95%+ done by then so the
    // useLayoutEffect transform reset is imperceptible, but the ring starts
    // animating while the card is still arriving.
    setTimeout(() => {
      el.style.transition = "none";
      el.style.pointerEvents = "";
      if (container) container.style.transition = "none";
      setSel(newSel);
      onDone?.();
    }, isReduced ? 0 : durMs - 80);
  };

  const snapBack = () => {
    animating.current = true;
    const el = trackRef.current;
    const dur = reducedMotion() ? "0ms" : "220ms";
    el.style.transition = `transform ${dur} ${EASE_EXPO}`;
    el.style.transform = CENTER;
    el.style.pointerEvents = "";
    applySlots(0, true);
    el.addEventListener("transitionend", () => { el.style.transition = "none"; animating.current = false; }, { once: true });
  };

  const onDragStart = (clientX, clientY) => {
    if (!canSwipe || animating.current) return;
    drag.current = { active: true, startX: clientX, startY: clientY, isHoriz: null, vel: 0, prevX: clientX, prevT: Date.now() };
  };

  const onDragMove = (clientX, clientY) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = clientX - d.startX;
    const dy = clientY - d.startY;
    if (d.isHoriz === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        d.isHoriz = Math.abs(dx) > Math.abs(dy) * 0.8;
        if (d.isHoriz) trackRef.current.style.pointerEvents = "none";
      }
      return;
    }
    if (!d.isHoriz) return;
    const now = Date.now();
    d.vel = (clientX - d.prevX) / Math.max(1, now - d.prevT);
    d.prevX = clientX;
    d.prevT = now;
    trackRef.current.style.transform = `calc(-33.333% + ${dx}px)`;
    const w = containerRef.current?.offsetWidth ?? 300;
    applySlots(dx / w, false);
  };

  const onDragEnd = (clientX, pIdx, nIdx) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (!d.isHoriz) { trackRef.current.style.pointerEvents = ""; return; }
    const dx = clientX - d.startX;
    const w = containerRef.current?.offsetWidth ?? 300;
    if (dx < -(w * 0.25) || d.vel < -0.4) {
      snapTo("translateX(-66.666%)", -1, nIdx);
    } else if (dx > w * 0.25 || d.vel > 0.4) {
      snapTo("translateX(0%)", 1, pIdx);
    } else {
      snapBack();
    }
  };

  const touchHandlers = {
    onTouchStart: (e) => onDragStart(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove:  (e) => onDragMove(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd:   (e) => onDragEnd(e.changedTouches[0].clientX, prevIdx, nextIdx),
    onTouchCancel: () => { drag.current.active = false; drag.current.isHoriz = null; snapBack(); },
  };
  const mouseHandlers = {
    onMouseDown:  (e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); },
    onMouseMove:  (e) => onDragMove(e.clientX, e.clientY),
    onMouseUp:    (e) => onDragEnd(e.clientX, prevIdx, nextIdx),
    onMouseLeave: (e) => { if (drag.current.active) onDragEnd(e.clientX, prevIdx, nextIdx); },
  };
  // ── /carousel ─────────────────────────────────────────────────────────

  const resetChapter = resetTarget != null ? CHAPTERS[resetTarget.chapterIdx] : null;
  const resetPrevName = resetTarget != null && resetTarget.chapterIdx > 0 ? CHAPTERS[resetTarget.chapterIdx - 1].name : null;

  const cardProps = {
    hard, progress, t, currentChapterIdx, expanded, setExpanded,
    onStart, onReviewChapter, onOpenBasics, onOpenKanaBasics, onOpenChart, onStartSession, onOpenScenes, onOpenVerbChart,
    onResetRequest: (idx) => setResetTarget({ chapterIdx: idx }),
  };

  return (
    <TabScreen active="Learn" onNav={onNav} onReview={onStartReview}
      header={
      <>
        <img src="/assets/cat-header.svg" alt="" aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0 }} />
        <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.onChrome }}>HeroKana</span>
        {hard && (
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: t.wrong,
            background: t.wrongSoft, padding: "3px 8px", borderRadius: 7 }}>HARD MODE</span>
        )}
      </>
    }>

      {/* .hk-rise: on a tab switch the whole content pane rises as one block (the
          header/nav stay put). On first load this wrapper is static and the inner
          blocks below play the staggered .hk-enter instead — the two never overlap
          (anim is false once homeEntered, i.e. on every tab switch back here). */}
      <div className="hk-rise">
      <div className={enterCls} style={{ "--i": 1, margin: "32px 0 20px" }}>
        <Text variant="eyebrow" color={t.ink} style={{ margin: "0 0 12px" }}>YOUR PROGRESS</Text>

        {hardUnlocked && (
          <div style={{ marginBottom: 14 }}>
            <button onClick={() => setHardInfoOpen((o) => !o)} className="hk-press"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 999,
                cursor: "pointer", background: hard ? t.wrongSoft : t.sunk, border: `1.5px solid ${hard ? t.wrong : t.line}`, textAlign: "left" }}>
              <span style={{ display: "flex", width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: hard ? t.wrong : t.faint, alignItems: "center", justifyContent: "center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: t.ink }}>Hard mode</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: hard ? t.wrong : t.sub }}>{hard ? "On" : "Off"}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.faint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, transform: hardInfoOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {hardInfoOpen && (
              <div className="hk-reveal" style={{ background: t.surface, border: "none", borderRadius: 16, padding: "14px 16px", marginTop: 8 }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: t.sub, fontWeight: 500, lineHeight: 1.5 }}>
                  Replays words & sentences (not the alphabets) with answers in English and no hints — a tougher second pass for extra XP.
                </p>
                <button onClick={() => progress.setHard(!hard)} className="hk-press"
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 14, cursor: "pointer",
                    background: hard ? t.primarySoft : t.surface, border: `1.5px solid ${hard ? t.primary : t.line}`, textAlign: "left" }}>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800, color: t.ink }}>{hard ? "Turn off hard mode" : "Turn on hard mode"}</span>
                  <span style={{ width: 44, height: 26, borderRadius: 13, flexShrink: 0, position: "relative",
                    background: hard ? t.primary : t.line, transition: "background 160ms" }}>
                    <span style={{ position: "absolute", top: 3, left: hard ? 21 : 3, width: 20, height: 20, borderRadius: "50%",
                      background: "#fff", transition: "left 160ms", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
                  </span>
                </button>
                <p style={{ margin: "10px 2px 0", fontSize: 11.5, color: t.faint, fontWeight: 500 }}>
                  You can also toggle this anytime in Profile → Settings.
                </p>
              </div>
            )}
          </div>
        )}

        <div ref={railRef} className="hk-scroll-x" style={{ margin: "0 -20px", padding: "0 20px" }}>
          {(() => {
            const fillPos = Math.max(0, railIdx.indexOf(currentChapterIdx));
            return (
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                minWidth: "100%", width: "max-content", padding: "8px 0 4px" }}>
                {/* white track under the not-yet-complete stops; green fill covers the completed part on top */}
                <div style={{ position: "absolute", top: 32, left: 35.5, right: 35.5, height: 2, borderRadius: 2, background: t.line }} />
                <div style={{ position: "absolute", top: 32, left: 35.5, height: 2, borderRadius: 2, background: t.doneMid,
                  width: `calc((100% - 71px) * ${fillPos} / ${Math.max(1, railIdx.length - 1)})` }} />
                {railIdx.map((i, pos) => {
                  const c = CHAPTERS[i];
                  const cst = (() => {
                    const df = doneFor(i);
                    if (df >= CHAPTERS[i].units.length) return "done";
                    if (i === currentChapterIdx) return "current";
                    if (i < currentChapterIdx) return "done";
                    return "locked";
                  })();
                  const on = i === sel;
                  const dotBg = cst === "done" ? t.doneMid : cst === "current" ? t.primary : t.sunk;
                  const dotBorder = cst === "done" ? t.doneMid : dotBg;
                  return (
                    <button key={c.id} data-rail={i} onClick={() => pick(i)} className={"hk-press" + (anim ? " hk-rail-in" : "")}
                      style={{ position: "relative", zIndex: 1, background: "transparent", border: "none", cursor: "pointer", padding: 0,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 7, width: 71, flexShrink: 0,
                        // left-to-right: leftmost circle enters first, sweeping right
                        animationDelay: anim ? `${pos * 55}ms` : undefined }}>
                      <span style={{ width: 50, height: 50, borderRadius: "50%", background: dotBg,
                        border: `2.5px solid ${dotBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {cst === "done" ? <svg width="18" height="18" viewBox="0 0 12 12" fill="none" stroke={t.done} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5" /></svg>
                          : cst === "locked" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.lock} strokeWidth="2.2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                          : <span style={{ fontFamily: JP, fontSize: 19, fontWeight: 700, color: "#fff" }}>{c.units[0].jp}</span>}
                      </span>
                      <span style={{ fontSize: 10.5, fontWeight: on ? 800 : 600, color: on ? t.ink : t.sub, textAlign: "center",
                        lineHeight: 1.15, whiteSpace: "nowrap" }}>{c.short || c.name.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* carousel — full-width canvas; card width unchanged via slot padding matching page padding.
          Container height is pinned to center slot via useLayoutEffect so dots never drift. */}
      {/* Bottom padding gives the card's soft lift room inside this overflow:hidden clip box
          (height is pinned to slot.scrollHeight, which now includes the padding, so the pin
          stays consistent). Negative margin cancels it so surrounding layout is unchanged. */}
      <div ref={containerRef} className={enterCls} style={{ "--i": 2, overflow: "hidden", touchAction: "pan-y", userSelect: "none", margin: "0 -20px -58px" }}
        {...touchHandlers} {...mouseHandlers}>
        <div ref={trackRef} style={{ display: "flex", width: "300%", alignItems: "flex-start", willChange: "transform" }}>
          {[prevIdx, sel, nextIdx].map((idx, i) => (
            <div key={i === 1 ? `c-${sel}` : i} ref={slotRefs[i]} style={{ flex: "0 0 33.333%", minWidth: 0, padding: "12px 20px 58px" }}>
              <ChapterCard chapterIdx={idx} {...cardProps} />
            </div>
          ))}
        </div>
      </div>


      {resetTarget != null && (
        <Modal onDismiss={() => setResetTarget(null)}>
          <div style={{ background: t.surface, border: "none", borderRadius: 20, padding: "20px 20px 18px",
            boxShadow: t.cardShadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: t.sunk, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.sub} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                </svg>
              </span>
              <div style={{ fontSize: 17, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>Reset {resetChapter.name}?</div>
            </div>
            <div style={{ fontSize: 13.5, color: t.sub, fontWeight: 500, margin: "8px 0 18px", fontFamily: DISPLAY, lineHeight: 1.5 }}>
              <strong style={{ color: t.ink }}>{resetChapter.name}</strong> and all chapters after it will reset to zero.
              {resetPrevName
                ? <> <strong style={{ color: t.ink }}>{resetPrevName}</strong> and earlier chapters will be unaffected.</>
                : <> All chapter progress will be cleared.</>}
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <button onClick={() => setResetTarget(null)} className="hk-press"
                style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: t.primary,
                  color: "#fff", fontFamily: DISPLAY, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: t.glow(t.primary) }}>
                Keep my progress
              </button>
              <button onClick={() => { progress.resetFromChapter(resetTarget.chapterIdx); setResetTarget(null); }} className="hk-press"
                style={{ width: "100%", padding: "13px", borderRadius: 14, border: `1.5px solid ${t.line}`, background: t.surface,
                  color: t.wrong, fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>
                Reset from {resetChapter.name}
              </button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </TabScreen>
  );
}

export default function Home({ onNav, onStart, onStartReview, onReviewChapter, onOpenBasics, onOpenKanaBasics, onOpenChart, onStartSession, onOpenVerbChart }) {
  return <HomeBody onNav={onNav} onStart={onStart} onStartReview={onStartReview} onReviewChapter={onReviewChapter} onOpenBasics={onOpenBasics} onOpenKanaBasics={onOpenKanaBasics} onOpenChart={onOpenChart} onStartSession={onStartSession} onOpenScenes={() => onNav("Scenes")} onOpenVerbChart={onOpenVerbChart} />;
}
