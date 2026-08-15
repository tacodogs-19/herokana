import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { speakVerb } from "../speech.js";
import { GROUPS, FORMS } from "../verbs.js";

export default function VerbChart({ onClose }) {
  const { t } = useTheme();
  const [groupId, setGroupId] = React.useState("ru");
  const [active, setActive] = React.useState(null);

  const group = GROUPS.find((g) => g.id === groupId);

  const tap = (v) => {
    setActive((a) => (a === v.romaji ? null : v.romaji));
    speakVerb(v.jp); // bundled neural clip, falls back to device TTS
  };

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, height: "100dvh", zIndex: 1500, background: t.bg,
      display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", fontFamily: DISPLAY, color: t.ink,
      animation: "hkFade 160ms ease both" }}>

      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "calc(14px + env(safe-area-inset-top)) 20px 12px", flexShrink: 0 }}>
        <button onClick={onClose} className="hk-press" aria-label="Close"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: t.faint, padding: 4, flexShrink: 0, display: "flex" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>Verb list</h1>
      </header>

      <div style={{ margin: "0 20px 14px", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: t.sub, fontWeight: 600, lineHeight: 1.5 }}>
          Tap a verb to see its forms and hear it.
        </p>
      </div>

      {/* Group toggle */}
      <div style={{ display: "flex", background: t.seg, borderRadius: 12, padding: 3, margin: "0 20px 16px", flexShrink: 0 }}>
        {GROUPS.map((g) => {
          const on = g.id === groupId;
          return (
            <button key={g.id} onClick={() => { setGroupId(g.id); setActive(null); }} className="hk-press"
              style={{ flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                background: on ? t.surface : "transparent", color: on ? t.ink : t.sub,
                boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                fontSize: 13, fontWeight: on ? 800 : 600 }}>
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Verb list */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 20px 28px" }}>
        <p style={{ margin: "0 0 12px", fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 900, color: t.faint }}>
          {group.sub.toUpperCase()}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {group.verbs.map((v) => {
            const on = active === v.romaji;
            return (
              <div key={v.romaji} style={{ borderRadius: 18, overflow: "hidden", border: "none",
                boxShadow: t.cardShadow }}>
                {/* Verb row — standard borderless card (surface + cardShadow), like everywhere else */}
                <button onClick={() => tap(v)} className="hk-press"
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 15px",
                    background: on ? t.primarySoft : t.surface, border: "none", cursor: "pointer", textAlign: "left",
                    transition: "background 150ms" }}>
                  <span style={{ fontFamily: JP, fontSize: 28, fontWeight: 700, lineHeight: 1, color: t.ink, flexShrink: 0, minWidth: 56 }}>{v.jp}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: on ? t.primary : t.sub, fontFamily: JP, lineHeight: 1.3 }}>{v.r}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: on ? t.primary : t.faint, fontFamily: DISPLAY, letterSpacing: "0.02em" }}>{v.romaji}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: on ? t.primary : t.sub, fontFamily: DISPLAY }}>{v.en}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on ? t.primary : t.faint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: on ? "rotate(180deg)" : "none", transition: "transform 200ms" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Conjugation forms */}
                {on && (
                  <div style={{ padding: "12px 15px 14px", background: t.bg, borderTop: `1px solid ${t.line}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {FORMS.map(({ key, romKey, label }) => (
                        <div key={key} style={{ background: t.surface, borderRadius: 13, padding: "10px 12px",
                          border: "none" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: t.faint, letterSpacing: "0.1em", marginBottom: 5 }}>{label.toUpperCase()}</div>
                          <div style={{ fontFamily: JP, fontSize: 20, fontWeight: 700, color: t.ink, lineHeight: 1.2 }}>{v[key]}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginTop: 3 }}>{v[romKey]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
