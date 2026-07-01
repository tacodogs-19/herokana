import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { Shell, ThemeToggle } from "../components/chrome.jsx";
import { READING_PACKS, readingUnlocked, readingGate } from "../reading.js";
import { dialoguesForPack } from "../dialogue.js";

function LockedState({ t, progress }) {
  const gate = readingGate();
  const doneThemes = Math.min(progress.done[gate.chapterIdx] || 0, gate.total);
  return (
    <div style={{ background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: 22, padding: "28px 22px",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: `0 16px 34px -26px ${t.shadow}` }}>
      <span style={{ display: "flex", width: 66, height: 66, borderRadius: "50%", background: t.sunk, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.lock} strokeWidth="1.9"><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" /></svg>
      </span>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.ink }}>Unlocks after the words track</h2>
      <p style={{ margin: "8px 0 0", fontSize: 13.5, color: t.sub, fontWeight: 600, lineHeight: 1.5, maxWidth: 280 }}>
        Finish the <strong style={{ color: t.ink }}>{gate.name}</strong> chapter, then come back to read real station,
        konbini and restaurant words at a glance.
      </p>
      {/* progress toward the gate */}
      <div style={{ width: "100%", maxWidth: 240, marginTop: 18 }}>
        <div style={{ height: 8, borderRadius: 5, background: t.sunk, overflow: "hidden" }}>
          <div style={{ width: `${gate.total ? (doneThemes / gate.total) * 100 : 0}%`, height: "100%", borderRadius: 5, background: t.primary, transition: "width 500ms ease" }} />
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 700, color: t.faint }}>{doneThemes} / {gate.total} themes done</p>
      </div>
    </div>
  );
}

// A compact scene tile for the grid — glyph + place + a one-glance status.
function PackTile({ pack, t, progress, onOpenPack }) {
  const rPlayed = !!(progress.reading[pack.id] && progress.reading[pack.id].plays);
  const dlgs = dialoguesForPack(pack.id);
  const cleared = dlgs.filter((d) => ((progress.dialogues[d.id] && progress.dialogues[d.id].clearedLevel) ?? -1) >= 0).length;
  const done = rPlayed && dlgs.length > 0 && cleared === dlgs.length;
  const started = rPlayed || cleared > 0;
  const status = done ? "Done" : started ? "In progress" : "New";
  const color = done ? t.done : started ? t.primary : t.faint;
  return (
    <button onClick={() => onOpenPack(pack.id)} className="hk-press"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: "18px 12px 14px", cursor: "pointer",
        background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: 18, textAlign: "center" }}>
      <span style={{ display: "flex", width: 52, height: 52, borderRadius: 15, flexShrink: 0,
        background: done ? t.doneSoft : t.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: JP, fontSize: 26, fontWeight: 700, color: done ? t.done : t.primary }}>{pack.jp}</span>
      </span>
      <span style={{ fontSize: 15, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>{pack.place}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color, fontFamily: DISPLAY }}>
        {done
          ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke={t.done} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5" /></svg>
          : <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />}
        {status}
      </span>
    </button>
  );
}

function ReadingBody({ onOpenPack }) {
  const { t } = useTheme();
  const progress = useProgress();
  const unlocked = readingUnlocked(progress);

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 20px 24px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <img src="/assets/cat-header.png" alt="" aria-hidden="true" style={{ width: 28, height: 28, flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>Scenes</h1>
        <div style={{ flex: 1 }} />
        <ThemeToggle />
      </header>

      <p style={{ margin: "0 0 6px", fontSize: 11.5, letterSpacing: "0.14em", fontWeight: 700, color: t.sub }}>IN THE REAL WORLD</p>
      <p style={{ margin: "0 0 16px", fontSize: 13.5, color: t.faint, lineHeight: 1.5 }}>
        The words and conversations you'll meet on a trip — grouped by where you'll run into them.
      </p>

      {!unlocked ? (
        <LockedState t={t} progress={progress} />
      ) : (
        <div style={{ display: "grid", gap: 11, gridTemplateColumns: "1fr 1fr" }}>
          {READING_PACKS.map((pack) => (
            <PackTile key={pack.id} pack={pack} t={t} progress={progress} onOpenPack={onOpenPack} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Reading({ onNav, onOpenPack }) {
  return <Shell active="Scenes" onNav={onNav}><ReadingBody onOpenPack={onOpenPack} /></Shell>;
}
