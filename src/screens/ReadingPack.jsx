import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { Shell, useDragDismiss } from "../components/chrome.jsx";
import { packById, slowWords } from "../reading.js";
import { dialoguesForPack, checkCount, SUPPORT } from "../dialogue.js";

const fmt = (ms) => `${(ms / 1000).toFixed(1)}s`;

function ReadingPackBody({ packId, onBack, onStartReading, onStartDialogue, scrollProps }) {
  const { t } = useTheme();
  const progress = useProgress();
  const pack = packById(packId);
  const data = progress.reading[packId];
  const played = (data && data.plays) || 0;
  const slow = slowWords(pack, data);
  const dialogues = dialoguesForPack(packId); // audio comes from bundled clips, no device voice needed

  return (
    <div {...scrollProps} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 20px 24px" }}>
      <button onClick={onBack} className="hk-press" aria-label="Back" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.ink, padding: 4, marginBottom: 8, marginLeft: -4, display: "flex" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
      </button>

      {/* arrival header — you've reached this place */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <span style={{ display: "flex", width: 60, height: 60, borderRadius: 18, flexShrink: 0, background: t.primarySoft, alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: JP, fontSize: 32, fontWeight: 700, color: t.primary }}>{pack.jp}</span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>{pack.place}</h1>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: t.sub, fontWeight: 600, lineHeight: 1.4 }}>{pack.blurb}</p>
        </div>
      </div>

      {/* word preview — what you'll meet here, fills the page with real content */}
      <p style={{ margin: "32px 0 10px", fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: t.ink }}>WHAT YOU'LL READ</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {pack.words.map((w) => (
          <span key={w.jp} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1,
            background: t.line, borderRadius: 12, padding: "7px 12px" }}>
            <span style={{ fontFamily: JP, fontSize: 16, fontWeight: 700, color: t.ink, lineHeight: 1.2 }}>{w.jp}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: t.faint, fontFamily: DISPLAY }}>{w.romaji}</span>
          </span>
        ))}
      </div>

      {/* two ways to practice — cards self-categorise (read = blue, listen = gold) */}
      <p style={{ margin: "72px 0 11px", fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: t.ink }}>PRACTICE</p>
      <button onClick={() => onStartReading(packId)} className="hk-press"
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "15px 16px", cursor: "pointer", marginBottom: 11,
          background: t.surface, border: "none", borderRadius: 18, textAlign: "left", boxShadow: t.cardShadow }}>
        <span style={{ display: "flex", width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: t.primarySoft, alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6.5" cy="14.5" r="3.5" /><circle cx="17.5" cy="14.5" r="3.5" /><path d="M10 14c.7-.9 3.3-.9 4 0" /><path d="M3 14l2-6.5h2M21 14l-2-6.5h-2" /></svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>Read the words</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: played ? t.done : t.sub, marginTop: 2, fontFamily: DISPLAY }}>
            {played ? `Best ${fmt(data.bestAvgMs)} / word · ${pack.words.length} words` : `Read all ${pack.words.length} at a glance`}
          </div>
        </div>
        <span style={{ color: t.faint, fontSize: 18, flexShrink: 0 }}>›</span>
      </button>

      {/* re-drill the words whose last read was slow — only shown when there are any */}
      {slow.length > 0 && (
        <button onClick={() => onStartReading(packId, true)} className="hk-press"
          style={{ display: "block", margin: "-3px 0 11px", padding: "9px 14px", cursor: "pointer",
            background: t.sunk, border: "none", borderRadius: 12, fontFamily: DISPLAY,
            fontSize: 12.5, fontWeight: 700, color: t.sub }}>
          Read {slow.length} slow {slow.length === 1 ? "word" : "words"} again →
        </button>
      )}

      {dialogues.length === 0 ? (
        <div style={{ background: t.sunk, borderRadius: 16, padding: "18px 16px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.faint }}>More conversations coming soon.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 11 }}>
          {dialogues.map((d) => {
            const rec = progress.dialogues[d.id];
            const cleared = rec ? rec.clearedLevel : -1;
            const stat = cleared >= 0
              ? `Cleared: ${SUPPORT[cleared].label}${cleared < SUPPORT.length - 1 ? "" : " · top level"}`
              : rec ? `Best ${rec.bestPct}%` : "Not started";
            return (
              <button key={d.id} onClick={() => onStartDialogue(d.id, packId)} className="hk-press"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", cursor: "pointer",
                  background: t.surface, border: "none", borderRadius: 18, textAlign: "left" }}>
                <span style={{ display: "flex", width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: t.goldSoft, alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 20.5l1.4-5.6a8.4 8.4 0 0 1-.9-3.9A8.4 8.4 0 0 1 12 2.5a8.4 8.4 0 0 1 9 9z" /></svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>{d.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: cleared >= 0 ? t.done : t.sub, marginTop: 2, fontFamily: DISPLAY }}>
                    {stat} · {checkCount(d)} questions
                  </div>
                </div>
                <span style={{ color: t.faint, fontSize: 18, flexShrink: 0 }}>›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReadingPack({ packId, onNav, onBack, onStartReading, onStartDialogue }) {
  const swipe = useDragDismiss({ onDismiss: onBack });
  return (
    <Shell active="Scenes" onNav={onNav} nav={false} modal outerRef={swipe.rootRef}>
      <ReadingPackBody packId={packId} onBack={onBack} onStartReading={onStartReading} onStartDialogue={onStartDialogue} scrollProps={swipe.scrollProps} />
    </Shell>
  );
}
