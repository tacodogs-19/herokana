import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { Modal, Text, TabScreen } from "../components/chrome.jsx";
import { READING_PACKS, readingUnlocked, readingGate } from "../reading.js";
import { dialoguesForPack } from "../dialogue.js";

function LockedState({ t, progress }) {
  const gate = readingGate();
  const doneThemes = Math.min(progress.done[gate.chapterIdx] || 0, gate.total);
  return (
    <div style={{ background: t.surface, border: "none", borderRadius: 22, padding: "28px 22px",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: t.cardShadow }}>
      <span style={{ display: "flex", width: 66, height: 66, borderRadius: "50%", background: t.sunk, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.lock} strokeWidth="1.9"><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" /></svg>
      </span>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.ink }}>Unlocks after the kana chapters</h2>
      <p style={{ margin: "8px 0 0", fontSize: 13.5, color: t.sub, fontWeight: 500, lineHeight: 1.5, maxWidth: 280 }}>
        Finish the <strong style={{ color: t.ink }}>{gate.name}</strong> chapter, then come back to read the real
        Japanese you'll meet on a trip — signs, konbini, cafés and more — at a glance.
      </p>
      {/* progress toward the gate */}
      <div style={{ width: "100%", maxWidth: 240, marginTop: 18 }}>
        <div style={{ height: 8, borderRadius: 5, background: t.sunk, overflow: "hidden" }}>
          <div style={{ width: `${gate.total ? (doneThemes / gate.total) * 100 : 0}%`, height: "100%", borderRadius: 5, background: t.primary, transition: "width 500ms ease" }} />
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 700, color: t.faint }}>{doneThemes} / {gate.total} units done</p>
      </div>
    </div>
  );
}

// The hub renders the packs as one trip in the order you'd hit the places.
// Display order only — progress is keyed by pack id, so tuning this is safe.
const TRIP_ORDER = ["airport", "station", "signs", "konbini", "cafe", "restaurant", "money", "hotel"];

const packState = (pack, progress) => {
  const r = progress.reading[pack.id] || {};
  const dlgs = dialoguesForPack(pack.id);
  const cleared = dlgs.filter((d) => ((progress.dialogues[d.id] && progress.dialogues[d.id].clearedLevel) ?? -1) >= 0).length;
  const played = !!r.plays;
  return {
    done: played && dlgs.length > 0 && cleared === dlgs.length,
    started: played || cleared > 0,
    wordsRead: Math.min(Object.keys(r.words || {}).length, pack.words.length),
    dialogues: dlgs.length,
  };
};

// Smooth height auto-collapse via the grid 0fr/1fr trick; the global
// reduced-motion rule in styles.css zeroes these transitions.
const EASE = "var(--ease-out-quart)";
// Per-property shorthand pairs — a single "a, b, c 320ms" declaration would
// leave a and b at 0s (they'd snap instead of animating).
const morph = (...props) => props.map((p) => `${p} 320ms ${EASE}`).join(", ");
const Collapse = ({ open, children }) => (
  <div aria-hidden={!open} style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: morph("grid-template-rows") }}>
    <div style={{ overflow: "hidden", minHeight: 0 }}>
      <div style={{ opacity: open ? 1 : 0, transition: `opacity 240ms ${EASE} ${open ? "90ms" : "0ms"}` }}>{children}</div>
    </div>
  </div>
);

// One itinerary stop. Tapping a compact stop expands it in place into the
// focus card; only the card's CTA navigates to the pack. The morph sticks to
// compositor-friendly properties where it can (transforms, colors, opacity) —
// the card padding and chip size are the two deliberate layout animations.
function Stop({ pack, s, t, active, first, last, onSelect, onOpenPack }) {
  const bodyRef = React.useRef(null);
  // on return to the hub, bring the restored active card back into view
  React.useEffect(() => {
    if (active && bodyRef.current) bodyRef.current.scrollIntoView({ block: "nearest" });
  }, []);
  const select = () => {
    if (active) return;
    onSelect(pack.id);
    // once the card has grown, nudge it fully into view on short screens
    setTimeout(() => {
      if (bodyRef.current) bodyRef.current.scrollIntoView({ block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }, 340);
  };
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {/* rail column — per-stop segments abut the node exactly, so the line
          never overshoots the first or last node as it slides */}
      <span style={{ width: 26, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ width: 2, height: active ? 26 : 9, flexShrink: 0,
          background: first ? "transparent" : t.line, transition: morph("height") }} />
        {/* node — filled when active, check when done, dot otherwise */}
        <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: s.done ? t.doneSoft : active ? t.primary : t.surface,
          border: `2px solid ${s.done ? t.done : active ? t.primary : t.line}`,
          transition: morph("background-color", "border-color") }}>
          {s.done
            ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={t.done} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5" /></svg>
            : <span style={{ width: 8, height: 8, borderRadius: "50%",
                background: active ? "#fff" : s.started ? t.primary : t.line,
                transition: morph("background-color") }} />}
        </span>
        <span style={{ width: 2, flex: 1, background: last ? "transparent" : t.line }} />
      </span>

      {/* body — transparent row that morphs into the focus card */}
      <div ref={bodyRef} style={{ flex: 1, minWidth: 0, borderRadius: 18, marginBottom: 10,
        background: active ? t.surface : "transparent",
        border: `1.5px solid transparent`,
        padding: active ? "6px 14px" : "0px",
        boxShadow: active ? t.cardShadow : "none",
        transition: morph("background-color", "border-color", "padding", "box-shadow") }}>
        <button onClick={select} className="hk-press"
          style={{ width: "100%", display: "flex", gap: 11, alignItems: "center", padding: "12px 0",
            borderRadius: 12, // keeps the keyboard focus ring rounded
            background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
          <span style={{ width: active ? 44 : 28, height: active ? 44 : 28, borderRadius: active ? 12 : 9,
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: s.done && !active ? t.doneSoft : t.primarySoft,
            transition: morph("width", "height", "border-radius", "background-color") }}>
            <span style={{ display: "block", fontFamily: JP, fontWeight: 700, fontSize: 13,
              color: s.done && !active ? t.done : t.primary,
              transform: `scale(${active ? 1.7 : 1})`,
              transition: morph("transform", "color") }}>{pack.jp}</span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 15, fontWeight: 800, fontFamily: DISPLAY,
              color: s.done && !active ? t.sub : t.ink, transition: morph("color") }}>{pack.place}</span>
            <Collapse open={active}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: t.sub, fontFamily: DISPLAY, lineHeight: 1.4 }}>{pack.blurb}</span>
            </Collapse>
          </span>
          {/* untouched scenes carry no label — absence means "not started" */}
          {(s.done || s.started) && (
            <span aria-hidden={active} style={{ fontSize: 11.5, fontWeight: 700, fontFamily: DISPLAY, flexShrink: 0,
              overflow: "hidden", whiteSpace: "nowrap", maxWidth: active ? 0 : 80,
              color: s.done ? t.done : t.primary,
              opacity: active ? 0 : 1, transition: morph("opacity", "max-width") }}>
              {s.done ? "Done" : "In progress"}
            </span>
          )}
        </button>

        <Collapse open={active}>
          <div style={{ padding: "2px 0 8px" }}>
            {s.started && (
              <div style={{ height: 5, borderRadius: 3, background: t.sunk, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${(s.wordsRead / pack.words.length) * 100}%`, height: "100%", borderRadius: 3, background: t.primary }} />
              </div>
            )}
            <p style={{ margin: "0 0 10px", fontSize: 11.5, fontWeight: 500, color: t.faint, fontFamily: DISPLAY }}>
              {s.started
                ? `${s.wordsRead} of ${pack.words.length} words read`
                : `${pack.words.length} words · ${s.dialogues} conversation${s.dialogues === 1 ? "" : "s"}`}
            </p>
            <button onClick={() => onOpenPack(pack.id)} className="hk-press" tabIndex={active ? 0 : -1}
              style={{ width: "100%", padding: 11, borderRadius: 13, border: "none", cursor: "pointer",
                background: t.primary, color: "#fff", fontFamily: DISPLAY, fontSize: 14, fontWeight: 800, boxShadow: t.glow(t.primary) }}>
              {s.done ? "Revisit scene" : s.started ? "Continue" : "Start scene"}
            </button>
          </div>
        </Collapse>
      </div>
    </div>
  );
}

function ReadingBody({ onNav, onOpenPack, onReview }) {
  const { t } = useTheme();
  const progress = useProgress();
  const unlocked = readingUnlocked(progress);
  // survives the trip into a pack and back (the screen remounts); resets on a
  // fresh app open so the smart default picks the focus stop again
  const [sel, setSel] = React.useState(() => {
    try { return sessionStorage.getItem("hk-scenes-sel"); } catch (e) { return null; }
  });
  React.useEffect(() => {
    try { sel == null ? sessionStorage.removeItem("hk-scenes-sel") : sessionStorage.setItem("hk-scenes-sel", sel); } catch (e) {}
  }, [sel]);

  const packs = TRIP_ORDER.map((id) => READING_PACKS.find((p) => p.id === id)).filter(Boolean);
  const states = packs.map((p) => packState(p, progress));
  // the focus stop: a tapped scene wins, else the one you're mid-way through,
  // else the first fresh one
  const selIdx = sel == null ? -1 : packs.findIndex((p) => p.id === sel);
  const startedIdx = states.findIndex((s) => s.started && !s.done);
  const curIdx = selIdx >= 0 ? selIdx : startedIdx >= 0 ? startedIdx : states.findIndex((s) => !s.done);
  const doneCount = states.filter((s) => s.done).length;

  const [confirmReset, setConfirmReset] = React.useState(false);
  const hasScenesData = Object.keys(progress.reading).length > 0 || Object.keys(progress.dialogues).length > 0;

  return (
    <TabScreen active="Scenes" onNav={onNav} onReview={onReview} header={
      <>
        <img src="/assets/cat-header.svg" alt="" aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.onChrome }}>Scenes</h1>
        <div style={{ flex: 1 }} />
        {/* subtle red, mirroring the gold Daily Review pill idiom (translucent bg,
            colour carried by the icon + label) — a quiet destructive cue */}
        {unlocked && hasScenesData && (
          <button onClick={() => setConfirmReset(true)} className="hk-press" aria-label="Reset Scenes progress"
            style={{ padding: "5px 10px 5px 8px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, color: t.wrongOnChrome }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.04em" }}>RESET</span>
          </button>
        )}
      </>
    }>
      <div className="hk-rise">
      <Text variant="eyebrow" color={t.ink} style={{ margin: "32px 0 12px" }}>IN THE REAL WORLD</Text>
      <Text variant="subtitle" style={{ margin: "0 0 16px" }}>
        {doneCount === packs.length
          ? "Every stop on the trip is done — revisit any scene to keep the words fresh."
          : "One trip through Japan, stop by stop: the words and conversations you'll meet at each one."}
      </Text>

      {!unlocked ? (
        <LockedState t={t} progress={progress} />
      ) : (
        <div>
          {packs.map((pack, i) => (
            <React.Fragment key={pack.id}>
              {/* iOS-style inset separator — cleared around the active card,
                  whose own border does the separating there */}
              {/* zero-height so the row gap stays inside the stops and the rail
                  segments span it without breaks; the hairline overlays the gap */}
              {i > 0 && (
                <div aria-hidden="true" style={{ height: 0, position: "relative" }}>
                  <div style={{ position: "absolute", top: -5, left: 77, right: 0, height: 1, background: t.line,
                    opacity: i === curIdx || i - 1 === curIdx ? 0 : 1, transition: morph("opacity") }} />
                </div>
              )}
              <Stop pack={pack} s={states[i]} t={t} active={i === curIdx}
                first={i === 0} last={i === packs.length - 1}
                onSelect={setSel} onOpenPack={onOpenPack} />
            </React.Fragment>
          ))}
        </div>
      )}

      {confirmReset && (
        <Modal onDismiss={() => setConfirmReset(false)}>
          <div style={{ background: t.surface, border: "none", borderRadius: 20, padding: "20px 20px 18px",
            boxShadow: t.cardShadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: t.sunk, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.sub} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                </svg>
              </span>
              <div style={{ fontSize: 17, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>Reset Scenes?</div>
            </div>
            <div style={{ fontSize: 13.5, color: t.sub, fontWeight: 500, margin: "8px 0 18px", fontFamily: DISPLAY, lineHeight: 1.5 }}>
              Reading times and conversation results will be cleared, so every stop starts fresh.
              Chapter progress, XP and reviews are unaffected.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <button onClick={() => { progress.resetScenes(); setSel(null); setConfirmReset(false); }} className="hk-press"
                style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: t.primary,
                  color: "#fff", fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 800, cursor: "pointer", boxShadow: t.glow(t.primary) }}>
                Reset Scenes
              </button>
              <button onClick={() => setConfirmReset(false)} className="hk-press"
                style={{ width: "100%", padding: "13px", borderRadius: 14, border: `1.5px solid ${t.line}`, background: t.surface,
                  color: t.sub, fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>
                Keep my progress
              </button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </TabScreen>
  );
}

export default function Reading({ onNav, onOpenPack, onReview }) {
  return <ReadingBody onNav={onNav} onOpenPack={onOpenPack} onReview={onReview} />;
}
