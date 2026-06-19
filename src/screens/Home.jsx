import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { CHAPTERS, BANKS } from "../data";
import { Shell, Ring, ThemeToggle } from "../components/chrome.jsx";
import SentenceBasics from "./SentenceBasics.jsx";

function UnitChip({ unit, st, t, onClick }) {
  const bg = st === "done" ? t.doneSoft : st === "current" ? t.primary : t.sunk;
  const fg = st === "current" ? "#fff" : st === "done" ? t.done : t.faint;
  return (
    <button onClick={onClick} disabled={st === "locked"} className="hk-press" title={unit.label}
      style={{ position: "relative", aspectRatio: "1", borderRadius: 14, cursor: st === "locked" ? "default" : "pointer", padding: 0, minWidth: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
        background: bg, border: st === "current" ? "none" : `1.5px solid ${st === "done" ? "transparent" : t.line}`, color: fg }}>
      {st === "done" && (
        <span style={{ position: "absolute", top: 0, right: 0, transform: "translate(30%,-30%)",
          width: 22, height: 22, borderRadius: "50%", background: t.doneMid, border: `2px solid ${t.surface}`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={t.done} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5" /></svg>
        </span>
      )}
      <span style={{ fontFamily: JP, fontSize: 19, fontWeight: 700 }}>{unit.jp}</span>
      <span style={{ fontSize: 8.5, fontWeight: 700, opacity: 0.9, maxWidth: "92%", overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{unit.label}</span>
    </button>
  );
}

function HomeBody({ onStart }) {
  const { t } = useTheme();
  const progress = useProgress();
  // hard mode replays banked chapters (not alphabets) on a separate track
  const hard = progress.hard;
  const isAlpha = (i) => !BANKS[CHAPTERS[i].id];
  const doneFor = (i) => (hard ? (isAlpha(i) ? CHAPTERS[i].units.length : progress.hardDone[i]) : progress.done[i]);
  let currentChapterIdx = CHAPTERS.findIndex((c, i) => doneFor(i) < c.units.length);
  if (currentChapterIdx === -1) currentChapterIdx = CHAPTERS.length - 1;
  const chapterState = (i) => {
    if (doneFor(i) >= CHAPTERS[i].units.length) return "done";
    if (i === currentChapterIdx) return "current";
    if (i < currentChapterIdx) return "done";
    return "locked";
  };
  const [sel, setSel] = React.useState(() => {
    try { const v = localStorage.getItem("hk-home-sel"); if (v != null && CHAPTERS[+v]) return +v; } catch (e) {}
    return currentChapterIdx;
  });
  const [expanded, setExpanded] = React.useState(() => {
    try { return localStorage.getItem("hk-home-exp") === "1"; } catch (e) { return false; }
  });
  const [showBasics, setShowBasics] = React.useState(false);
  const [hardInfoOpen, setHardInfoOpen] = React.useState(false);
  const hardUnlocked = progress.trackComplete;
  React.useEffect(() => { try { localStorage.setItem("hk-home-sel", String(sel)); } catch (e) {} }, [sel]);
  // entering hard mode focuses the current hard chapter; once unlocked the
  // alphabets leave the rail so never leave the selection on one
  React.useEffect(() => {
    if (hard || (hardUnlocked && isAlpha(sel))) setSel(currentChapterIdx);
  }, [hard, hardUnlocked]); // eslint-disable-line
  React.useEffect(() => { try { localStorage.setItem("hk-home-exp", expanded ? "1" : "0"); } catch (e) {} }, [expanded]);

  // keep the selected chapter visible on the scrollable rail
  const railRef = React.useRef(null);
  React.useEffect(() => {
    const el = railRef.current && railRef.current.querySelector(`[data-rail="${sel}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [sel]);

  const chapter = CHAPTERS[sel];
  const doneCount = doneFor(sel);
  const st = chapterState(sel);
  const cpct = Math.round((doneCount / chapter.units.length) * 100);
  const unit = st === "done" ? chapter.units[chapter.units.length - 1] : chapter.units[Math.min(doneCount, chapter.units.length - 1)];
  const accent = st === "done" ? t.done : st === "current" ? t.primary : t.lock;
  const upNext = chapter.units.slice(doneCount + 1, doneCount + 3);
  const firstUse = !hard && progress.totalDone === 0 && progress.answered === 0;

  const pick = (i) => { setSel(i); setExpanded(true); };

  return (
    <>
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>HeroKana</span>
        {hard && (
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: t.wrong,
            background: t.wrongSoft, padding: "3px 8px", borderRadius: 7 }}>HARD MODE</span>
        )}
        <div style={{ flex: 1 }} />
        <ThemeToggle />
      </div>

      {/* map rail — the track lives above the focus card */}
      <div style={{ margin: "6px 0 20px" }}>
        <p style={{ margin: "0 0 12px", fontSize: 11, letterSpacing: "0.14em", fontWeight: 700, color: t.sub }}>YOUR PROGRESS</p>

        {/* once unlocked, the alphabets collapse into a Hard mode pill */}
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
              <span style={{ color: t.faint, fontSize: 12, transform: hardInfoOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }}>▼</span>
            </button>
            {hardInfoOpen && (
              <div className="hk-reveal" style={{ background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: 16, padding: "14px 16px", marginTop: 8 }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: t.sub, fontWeight: 600, lineHeight: 1.5 }}>
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
                <p style={{ margin: "10px 2px 0", fontSize: 11.5, color: t.faint, fontWeight: 600 }}>
                  You can also toggle this anytime in Profile → Settings.
                </p>
              </div>
            )}
          </div>
        )}

        <div ref={railRef} className="hk-scroll-x" style={{ margin: "0 -20px", padding: "0 20px" }}>
          {(() => {
            const railIdx = hardUnlocked ? CHAPTERS.map((_, i) => i).filter((i) => !isAlpha(i)) : CHAPTERS.map((_, i) => i);
            const fillPos = Math.max(0, railIdx.indexOf(currentChapterIdx));
            return (
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            minWidth: "100%", width: "max-content", padding: "8px 0 4px" }}>
            <div style={{ position: "absolute", top: 31.5, left: 35.5, right: 35.5, height: 3, background: t.line, borderRadius: 2 }} />
            <div style={{ position: "absolute", top: 31.5, left: 35.5, height: 3, borderRadius: 2, background: t.doneMid,
              width: `calc((100% - 71px) * ${fillPos} / ${Math.max(1, railIdx.length - 1)})` }} />
            {railIdx.map((i) => {
              const c = CHAPTERS[i];
              const cst = chapterState(i), on = i === sel;
              // done dots mirror the "what's in this chapter" ticks: light-green
              // fill with a green check, no outline
              const dotBg = cst === "done" ? t.doneMid : cst === "current" ? t.primary : t.surface;
              const dotBorder = cst === "done" ? t.doneMid : cst === "locked" ? t.line : dotBg;
              return (
                <button key={c.id} data-rail={i} onClick={() => pick(i)} className="hk-press"
                  style={{ position: "relative", zIndex: 1, background: "transparent", border: "none", cursor: "pointer", padding: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 7, width: 71, flexShrink: 0 }}>
                  <span style={{ width: 50, height: 50, borderRadius: "50%", background: dotBg,
                    border: `2.5px solid ${dotBorder}`, display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: on ? `0 0 0 4px ${cst === "current" ? t.primarySoft : cst === "done" ? t.doneSoft : t.sunk}` : "none",
                    transition: "box-shadow 160ms ease" }}>
                    {cst === "done" ? <svg width="18" height="18" viewBox="0 0 12 12" fill="none" stroke={t.done} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5" /></svg>
                      : cst === "locked" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.lock} strokeWidth="2.2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                      : <span style={{ fontFamily: JP, fontSize: 19, fontWeight: 700, color: "#fff" }}>{c.units[0].jp}</span>}
                  </span>
                  <span style={{ fontSize: 9.5, fontWeight: on ? 800 : 600, color: on ? t.ink : t.faint, textAlign: "center",
                    lineHeight: 1.15, whiteSpace: "nowrap" }}>{c.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
            );
          })()}
        </div>
      </div>

      {/* focus card */}
      <div style={{ background: t.surface, borderRadius: 26, border: `1.5px solid ${t.line}`,
        boxShadow: `0 18px 38px -26px ${t.shadow}`, padding: "20px 20px 18px", position: "relative", overflow: "hidden" }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.14em", fontWeight: 800,
          color: st === "current" ? t.primary : st === "done" ? t.done : t.faint }}>
          {st === "current" ? (firstUse ? "START YOUR JOURNEY" : "CONTINUE LEARNING") : st === "done" ? "CHAPTER COMPLETE" : "UP AHEAD"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, margin: "8px 0 4px" }}>
          <Ring size={164} stroke={12} pct={st === "locked" ? 0 : cpct} color={accent} track={t.sunk}>
            {st === "locked"
              ? <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={t.lock} strokeWidth="1.8"><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" /></svg>
              : <span style={{ fontFamily: JP, fontSize: 68, fontWeight: 700, color: t.ink, lineHeight: 1 }}>{unit.jp}</span>}
          </Ring>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: t.ink }}>{chapter.name}</h2>
            <p style={{ margin: "3px 0 0", fontSize: 13.5, color: t.sub, fontWeight: 600, whiteSpace: "nowrap" }}>
              {st === "locked" ? `Finish ${CHAPTERS[Math.max(0, sel - 1)].name} to unlock`
                : st === "done" ? `All ${chapter.units.length} units mastered`
                : `${unit.label} · unit ${doneCount + 1} of ${chapter.units.length}`}
            </p>
          </div>
          {/* always rendered at fixed height so the button below never moves */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, height: 29 }}>
            {st === "current" && upNext.length > 0 && (
              <>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: t.faint, letterSpacing: "0.04em" }}>UP NEXT</span>
                {upNext.map((u, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: t.sunk, padding: "5px 10px 5px 7px", borderRadius: 10, flexShrink: 0 }}>
                    <span style={{ fontFamily: JP, fontSize: 15, fontWeight: 700, color: t.sub }}>{u.jp}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.sub, whiteSpace: "nowrap" }}>{u.label}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        <button onClick={() => st !== "locked" && onStart(sel)} disabled={st === "locked"} className="hk-press"
          style={{ width: "100%", marginTop: 12, padding: "15px", borderRadius: 16, border: "none",
            cursor: st === "locked" ? "default" : "pointer", background: st === "locked" ? t.sunk : accent,
            color: st === "locked" ? t.faint : "#fff", fontFamily: DISPLAY, fontSize: 16, fontWeight: 800,
            boxShadow: st === "locked" ? "none" : t.glow(accent) }}>
          {st === "locked" ? "Locked" : st === "done" ? "Review chapter" : firstUse ? "Get Started →" : "Continue lesson →"}
        </button>

        {/* sentences explainer entry point */}
        {chapter.id === "sentence" && st !== "locked" && (
          <button onClick={() => setShowBasics(true)} className="hk-press"
            style={{ width: "100%", marginTop: 10, padding: "11px", borderRadius: 13, cursor: "pointer",
              background: t.primarySoft, border: "none", color: t.primary, fontFamily: DISPLAY, fontSize: 13.5, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
            New to sentences? Read the basics
          </button>
        )}

        {/* expandable section contents */}
        {st !== "locked" && (
          <>
            <button onClick={() => setExpanded((e) => !e)} className="hk-press"
              style={{ width: "100%", marginTop: 12, paddingTop: 13, borderTop: `1px solid ${t.line}`, background: "transparent",
                borderLeft: "none", borderRight: "none", borderBottom: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between", color: t.ink }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap" }}>What's in this chapter</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: accent, background: st === "current" ? t.primarySoft : t.doneSoft, padding: "2px 8px", borderRadius: 7 }}>
                  {doneCount}/{chapter.units.length}
                </span>
              </span>
              <span style={{ color: t.faint, fontSize: 12, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}>▼</span>
            </button>
            {expanded && (
              <div className="hk-reveal" style={{ marginTop: 12 }}>
                <div style={{ height: 6, borderRadius: 4, background: t.sunk, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ width: `${cpct}%`, height: "100%", borderRadius: 4, background: accent, transition: "width 500ms ease" }} />
                </div>
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: `repeat(${BANKS[chapter.id] ? 4 : 5}, minmax(0, 1fr))` }}>
                  {chapter.units.map((u, i) => {
                    const ust = i < doneCount ? "done" : i === doneCount && st === "current" ? "current" : "locked";
                    return <UnitChip key={i} unit={u} st={ust} t={t} onClick={() => ust !== "locked" && onStart(sel, i)} />;
                  })}
                </div>
                <p style={{ margin: "11px 2px 0", fontSize: 11.5, color: t.faint }}>
                  Tap a unit to jump straight in · score 80% to mark it complete.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    {showBasics && <SentenceBasics onClose={() => setShowBasics(false)} />}
    </>
  );
}

export default function Home({ onNav, onStart }) {
  return <Shell active="Learn" onNav={onNav}><HomeBody onStart={onStart} /></Shell>;
}
