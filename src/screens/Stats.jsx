import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { CHAPTERS } from "../data";
import { READING_PACKS } from "../reading.js";
import { SUPPORT } from "../dialogue.js";

// The richer progress snapshot deferred since v1.7 — a calm read-only page:
// per-chapter completion, the review pool's shape, and Scenes reading stats.
// No goals, no comparisons, nothing red.

const BOX_LABELS = ["New", "3-day", "7-day", "21-day"];

export default function Stats({ onClose }) {
  const { t } = useTheme();
  const p = useProgress();

  const boxes = [0, 0, 0, 0];
  Object.values(p.srs || {}).forEach((v) => { if (v && boxes[v.box] != null) boxes[v.box]++; });
  const inRotation = boxes.reduce((a, b) => a + b, 0);

  const packs = READING_PACKS.map((pack) => {
    const rec = p.reading[pack.id];
    const times = (rec && rec.words) || {};
    const read = Object.keys(times).filter((jp) => pack.words.some((w) => w.jp === jp));
    const avg = read.length
      ? read.reduce((s, jp) => s + times[jp].last, 0) / read.length : null;
    return { pack, read: read.length, avg };
  });
  const started = packs.filter((x) => x.read > 0);
  const dialoguesCleared = Object.values(p.dialogues || {}).filter((d) => (d.clearedLevel ?? -1) >= 0).length;

  const Section = ({ label, children }) => (
    <>
      <p style={{ margin: "34px 0 11px", fontSize: 11, letterSpacing: "0.14em", fontWeight: 700, color: t.sub }}>{label}</p>
      {children}
    </>
  );
  const card = { background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: 18, padding: "14px 16px" };

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, height: "100dvh", zIndex: 1500, background: t.bg,
      display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", fontFamily: DISPLAY, color: t.ink, animation: "hkFade 160ms ease both" }}>

      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "calc(14px + env(safe-area-inset-top)) 20px 12px" }}>
        <button onClick={onClose} className="hk-press" aria-label="Close"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: t.faint, padding: 4, flexShrink: 0, display: "flex" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>Your progress</h1>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 20px 32px" }}>

        <Section label="CHAPTERS">
          <div style={{ ...card, display: "grid", gap: 12 }}>
            {CHAPTERS.map((c, i) => {
              const done = p.done[i] || 0;
              const pct = Math.round((done / c.units.length) * 100);
              return (
                <div key={c.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? t.done : t.sub }}>
                      {pct === 100 ? "Done" : `${done}/${c.units.length}`}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: t.sunk, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: pct === 100 ? t.done : t.primary }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section label="REVIEW POOL">
          <div style={card}>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: t.sub, lineHeight: 1.5 }}>
              {inRotation === 0
                ? "Nothing in rotation — items join as you learn and miss."
                : <>{inRotation} item{inRotation === 1 ? "" : "s"} in rotation{p.reviewDue > 0 && <> · <span style={{ color: t.primary, fontWeight: 700 }}>{p.reviewDue} ready now</span></>}. Each correct review moves an item a box to the right until it graduates.</>}
            </p>
            {inRotation > 0 && (
              <div style={{ display: "flex", gap: 8 }}>
                {boxes.map((n, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", background: t.sunk, borderRadius: 12, padding: "10px 4px" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: n ? t.ink : t.faint }}>{n}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: t.faint, marginTop: 2 }}>{BOX_LABELS[i]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section label="SCENES">
          <div style={card}>
            {started.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.sub }}>No scenes read yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {started.map(({ pack, read, avg }) => (
                  <div key={pack.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: JP, fontSize: 16, fontWeight: 700, color: t.primary, width: 24, textAlign: "center", flexShrink: 0 }}>{pack.jp}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{pack.place}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>
                      {read}/{pack.words.length} words · {(avg / 1000).toFixed(1)}s/word
                    </span>
                  </div>
                ))}
                {dialoguesCleared > 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: t.sub }}>
                    {dialoguesCleared} conversation{dialoguesCleared === 1 ? "" : "s"} cleared (of {SUPPORT.length} support levels each).
                  </p>
                )}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
