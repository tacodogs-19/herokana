import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";

// Generic read-through explainer. Renders a titled list of {title, body, ex?}
// cards as a full-screen overlay. Used for both Kana basics and Sentence basics
// (content + title/intro passed in by App).
export default function Basics({ title, intro, cards, onClose }) {
  const { t } = useTheme();
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, height: "100dvh", zIndex: 1500, background: t.bg, display: "flex", flexDirection: "column",
      maxWidth: 430, margin: "0 auto", fontFamily: DISPLAY, color: t.ink, animation: "hkFade 160ms ease both" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "calc(14px + env(safe-area-inset-top)) 20px 12px" }}>
        <button onClick={onClose} className="hk-press" aria-label="Close"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: t.faint, padding: 4, flexShrink: 0, display: "flex" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>{title}</h1>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 20px 28px" }}>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: t.sub, fontWeight: 600, lineHeight: 1.5 }}>{intro}</p>
        <div style={{ display: "grid", gap: 12 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: 18, padding: "16px 16px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 8, background: t.primarySoft, color: t.primary,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800, marginTop: 1 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: t.ink }}>{c.title}</div>
                  <p style={{ margin: "6px 0 0", fontSize: 13.5, color: t.sub, fontWeight: 600, lineHeight: 1.5 }}>{c.body}</p>
                </div>
              </div>
              {c.ex && (
                <div style={{ marginTop: 12, marginLeft: 34, background: t.sunk, borderRadius: 13, padding: "11px 13px" }}>
                  <div style={{ fontFamily: JP, fontSize: 17, fontWeight: 700, color: t.ink }}>{c.ex.jp}</div>
                  <div style={{ fontSize: 12.5, color: t.sub, fontWeight: 600, marginTop: 3 }}>{c.ex.romaji}</div>
                  <div style={{ fontSize: 12.5, color: t.faint, fontWeight: 600, marginTop: 2 }}>{c.ex.en}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="hk-press"
          style={{ width: "100%", marginTop: 18, padding: "15px", borderRadius: 16, border: "none", cursor: "pointer",
            background: t.primary, color: "#fff", fontFamily: DISPLAY, fontSize: 16, fontWeight: 800, boxShadow: t.glow(t.primary) }}>
          Got it
        </button>
      </div>
    </div>
  );
}
