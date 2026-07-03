import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { HIRA, KATA, KANA_MNEMONICS } from "../data";
import { speak, useJaVoice } from "../speech.js";
import STROKES from "../strokes.json";

// Animated stroke order (KanjiVG data, 109x109 viewBox). A faint full glyph
// sits underneath as the guide; strokes draw in sequence. Tap to replay.
function StrokeGlyph({ ch, size, ink, guide }) {
  const ds = STROKES[ch] || [];
  const [run, setRun] = React.useState(0);
  return (
    <svg key={run} width={size} height={size} viewBox="0 0 109 109" role="img"
      aria-label={`Stroke order for ${ch}`}
      onClick={(e) => { e.stopPropagation(); setRun((r) => r + 1); }}>
      {ds.map((d, i) => (
        <path key={`g${i}`} d={d} fill="none" stroke={guide} strokeWidth="4.5"
          strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {ds.map((d, i) => (
        <path key={i} d={d} className="hk-stroke" fill="none" stroke={ink} strokeWidth="5"
          strokeLinecap="round" strokeLinejoin="round" pathLength="1"
          strokeDasharray="1" strokeDashoffset="1" style={{ animationDelay: `${i * 500}ms` }} />
      ))}
    </svg>
  );
}

const ROWS = [
  ["a", "i", "u", "e", "o"],
  ["ka", "ki", "ku", "ke", "ko"],
  ["sa", "shi", "su", "se", "so"],
  ["ta", "chi", "tsu", "te", "to"],
  ["na", "ni", "nu", "ne", "no"],
  ["ha", "hi", "fu", "he", "ho"],
  ["ma", "mi", "mu", "me", "mo"],
  ["ya", null, "yu", null, "yo"],
  ["ra", "ri", "ru", "re", "ro"],
  ["wa", null, null, null, "wo"],
  [null, null, "n", null, null],
];
const EXTRA = [
  { label: "VOICED",       rows: [["ga", "gi", "gu", "ge", "go"]] },
  { label: "COMBINATIONS", rows: [["kya", null, "kyu", null, "kyo"]] },
];

const ALL_KANA = [
  ...ROWS.flat().filter(Boolean),
  ...EXTRA.flatMap((s) => s.rows.flat().filter(Boolean)),
];

// row filter chips — first non-null romaji of each row/section
const ROW_CHIPS = [
  { id: "main-0",  rj: "a" },
  { id: "main-1",  rj: "ka" },
  { id: "main-2",  rj: "sa" },
  { id: "main-3",  rj: "ta" },
  { id: "main-4",  rj: "na" },
  { id: "main-5",  rj: "ha" },
  { id: "main-6",  rj: "ma" },
  { id: "main-7",  rj: "ya" },
  { id: "main-8",  rj: "ra" },
  { id: "main-9",  rj: "wa" },
  { id: "main-10", rj: "n" },
  { id: "extra-0", rj: "ga" },
  { id: "extra-1", rj: "kya" },
];

const PREF_KEY = "hk-kana-chart";
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; }
}

function filteredKanaFor(rowFilter) {
  if (rowFilter === "all") return ALL_KANA;
  if (rowFilter.startsWith("main-")) return ROWS[+rowFilter.split("-")[1]].filter(Boolean);
  return EXTRA[+rowFilter.split("-")[1]].rows.flat().filter(Boolean);
}

const GridIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </svg>
);
const CardIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18" />
  </svg>
);

export default function KanaChart({ onClose }) {
  const { t } = useTheme();
  const [kana,      setKana]      = React.useState(() => loadPrefs().kana || "hira");
  const [view,      setView]      = React.useState(() => loadPrefs().view || "grid");
  const [rowFilter, setRowFilter] = React.useState("all");
  const [active,    setActive]    = React.useState(null);
  const [cardIdx,   setCardIdx]   = React.useState(0);
  const [flipped,   setFlipped]   = React.useState(false);
  const [strokes,   setStrokes]   = React.useState(false);
  const [hint,      setHint]      = React.useState(() => !localStorage.getItem(PREF_KEY));

  const map = kana === "hira" ? HIRA : KATA;
  const hasJa = useJaVoice();

  const visibleKana = filteredKanaFor(rowFilter);
  const rj = visibleKana[Math.min(cardIdx, visibleKana.length - 1)];
  const mnemonic = KANA_MNEMONICS[rj] || null;

  React.useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ view, kana }));
  }, [view, kana]);

  React.useEffect(() => { setCardIdx(0); setFlipped(false); }, [rowFilter, kana]);

  const switchView = (v) => { setView(v); setHint(false); };

  const goCard = (dir) => {
    setCardIdx((i) => (i + dir + visibleKana.length) % visibleKana.length);
    setFlipped(false);
  };

  const Cell = ({ rj: romaji }) => {
    if (!romaji) return <span aria-hidden />;
    const on = active === romaji;
    return (
      <button onClick={() => { setActive(romaji); if (hasJa) speak(map[romaji]); }} className="hk-press"
        aria-label={`${map[romaji]} — ${romaji}`}
        style={{ aspectRatio: "1", borderRadius: 13, cursor: "pointer", padding: 0, minWidth: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          background: on ? t.primary : t.surface, border: `1.5px solid ${on ? t.primary : t.line}`,
          color: on ? "#fff" : t.ink, transition: "background 120ms, border-color 120ms" }}>
        <span style={{ fontFamily: JP, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{map[romaji]}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: on ? "#fff" : t.faint }}>{romaji}</span>
      </button>
    );
  };

  const Grid = ({ rows }) => (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
          {row.map((rj, ci) => <Cell key={ci} rj={rj} />)}
        </div>
      ))}
    </div>
  );

  const toggleStyle = (on) => ({
    width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: on ? t.surface : "transparent",
    boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
  });

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, height: "100dvh", zIndex: 1500, background: t.bg, display: "flex", flexDirection: "column",
      maxWidth: 430, margin: "0 auto", fontFamily: DISPLAY, color: t.ink, animation: "hkFade 160ms ease both" }}>

      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "calc(14px + env(safe-area-inset-top)) 20px 12px" }}>
        <button onClick={onClose} className="hk-press" aria-label="Close"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: t.faint, padding: 4, flexShrink: 0, display: "flex" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>Kana chart</h1>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", background: t.sunk, borderRadius: 10, padding: 3, gap: 2 }}>
          <button onClick={() => switchView("grid")} className="hk-press" aria-label="Grid view" style={toggleStyle(view === "grid")}>
            <GridIcon color={view === "grid" ? t.ink : t.faint} />
          </button>
          <button onClick={() => switchView("card")} className="hk-press" aria-label="Card view" style={toggleStyle(view === "card")}>
            <CardIcon color={view === "card" ? t.ink : t.faint} />
          </button>
        </div>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: view === "card" ? "hidden" : "auto", padding: "4px 20px 28px", display: "flex", flexDirection: "column" }}>

        {/* first-visit hint */}
        {hint && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: t.primarySoft, borderRadius: 13, padding: "10px 14px", marginBottom: 12, flexShrink: 0 }}>
            <span style={{ flex: 1, fontSize: 13, color: t.primary, fontWeight: 600, lineHeight: 1.4 }}>
              Use the icons top-right to switch between grid lookup and flashcard drill.
            </span>
            <button onClick={() => setHint(false)} className="hk-press"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: t.primary, padding: 2, flexShrink: 0, fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        )}

        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: t.sub, fontWeight: 600, lineHeight: 1.5, flexShrink: 0 }}>
          {view === "card"
            ? "Tap the card to reveal the reading. Navigate with the arrows."
            : hasJa ? "Tap any kana to hear it." : "Tap a kana to see its reading. (No Japanese voice on this device.)"}
        </p>

        {/* Hiragana / Katakana toggle */}
        <div style={{ display: "flex", background: t.sunk, borderRadius: 12, padding: 3, marginBottom: 12, flexShrink: 0 }}>
          {[{ id: "hira", label: "Hiragana" }, { id: "kata", label: "Katakana" }].map((k) => {
            const on = kana === k.id;
            return (
              <button key={k.id} onClick={() => { setKana(k.id); setActive(null); setFlipped(false); }} className="hk-press"
                style={{ flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                  background: on ? t.surface : "transparent", color: on ? t.ink : t.sub,
                  boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                  fontSize: 13.5, fontWeight: on ? 800 : 600 }}>
                {k.label}
              </button>
            );
          })}
        </div>

        {/* Row filter chips */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 16, flexShrink: 0, paddingBottom: 2,
          scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {[{ id: "all", label: "All" }, ...ROW_CHIPS].map((chip) => {
            const on = rowFilter === chip.id;
            const label = chip.id === "all" ? "All" : map[chip.rj];
            return (
              <button key={chip.id} onClick={() => { setRowFilter(chip.id); setActive(null); }} className="hk-press"
                style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${on ? t.primary : t.line}`,
                  background: on ? t.primarySoft : t.surface, color: on ? t.primary : t.sub,
                  fontFamily: chip.id === "all" ? DISPLAY : JP, fontSize: chip.id === "all" ? 12 : 16,
                  fontWeight: on ? 800 : 600, cursor: "pointer", lineHeight: 1.4 }}>
                {label}
              </button>
            );
          })}
        </div>

        {view === "grid" ? (
          <>
            {rowFilter === "all" ? (
              <>
                <Grid rows={ROWS} />
                {EXTRA.map((sec) => (
                  <div key={sec.label} style={{ marginTop: 20 }}>
                    <p style={{ margin: "0 0 9px", fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 700, color: t.faint }}>{sec.label}</p>
                    <Grid rows={sec.rows} />
                  </div>
                ))}
              </>
            ) : rowFilter.startsWith("main-") ? (
              <Grid rows={[ROWS[+rowFilter.split("-")[1]]]} />
            ) : (
              <Grid rows={EXTRA[+rowFilter.split("-")[1]].rows} />
            )}
          </>
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <div key={`${rowFilter}-${cardIdx}`} onClick={() => { setFlipped((f) => !f); if (hasJa) speak(map[rj]); }}
              style={{ width: "100%", perspective: "1200px", cursor: "pointer", flexShrink: 0 }}>
              <div style={{ position: "relative", width: "100%", height: 300,
                transformStyle: "preserve-3d", transition: "transform 400ms cubic-bezier(0.4,0,0.2,1)",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                {/* Front: kana + mnemonic */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                  background: t.surface, borderRadius: 26, border: `1.5px solid ${t.line}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "28px 28px 20px", gap: 12, boxShadow: `0 20px 44px -28px ${t.shadow}` }}>
                  {strokes && STROKES[map[rj]]
                    ? <StrokeGlyph ch={map[rj]} size={110} ink={t.ink} guide={t.line} />
                    : <span style={{ fontFamily: JP, fontSize: 96, fontWeight: 700, lineHeight: 1, color: t.ink }}>{map[rj]}</span>}
                  {strokes && STROKES[map[rj]] ? (
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.sub, textAlign: "center", lineHeight: 1.5 }}>Tap the glyph to replay</span>
                  ) : mnemonic && (
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.sub, textAlign: "center", lineHeight: 1.5 }}>{mnemonic}</span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.faint, letterSpacing: "0.08em", marginTop: 4 }}>TAP TO REVEAL</span>
                </div>
                {/* Back: romaji + both scripts */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)", background: t.primarySoft, borderRadius: 26, border: `1.5px solid ${t.primary}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "28px 28px 20px", gap: 10, boxShadow: `0 20px 44px -28px ${t.shadow}` }}>
                  <span style={{ fontSize: 60, fontWeight: 800, color: t.primary, fontFamily: DISPLAY, letterSpacing: "-0.02em" }}>{rj}</span>
                  <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
                    {[{ glyph: HIRA[rj], label: "Hiragana" }, { glyph: KATA[rj], label: "Katakana" }].map(({ glyph, label }) => (
                      <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <span style={{ fontFamily: JP, fontSize: 42, fontWeight: 700, color: t.ink, opacity: 0.65 }}>{glyph}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: t.primary, letterSpacing: "0.06em", opacity: 0.7 }}>{label.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stroke-order toggle — single glyphs only (combos are two kana).
                Slot stays laid out on combo cards so the nav row never shifts. */}
            <button onClick={() => setStrokes((s) => !s)} className="hk-press"
              disabled={!STROKES[map[rj]]} aria-hidden={!STROKES[map[rj]]}
              style={{ padding: "7px 16px", borderRadius: 20,
                cursor: STROKES[map[rj]] ? "pointer" : "default",
                visibility: STROKES[map[rj]] ? "visible" : "hidden",
                border: `1.5px solid ${strokes ? t.primary : t.line}`,
                background: strokes ? t.primarySoft : t.surface, color: strokes ? t.primary : t.sub,
                fontFamily: DISPLAY, fontSize: 12.5, fontWeight: 700 }}>
              {strokes ? "Hide stroke order" : "Show stroke order"}
            </button>

            {/* Prev / counter / Next */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
              <button onClick={() => goCard(-1)} className="hk-press"
                style={{ width: 50, height: 50, borderRadius: 14, border: `1.5px solid ${t.line}`, background: t.surface,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: t.ink, flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>{cardIdx + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: t.faint }}> / {visibleKana.length}</span>
              </div>
              <button onClick={() => goCard(1)} className="hk-press"
                style={{ width: 50, height: 50, borderRadius: 14, border: `1.5px solid ${t.line}`, background: t.surface,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: t.ink, flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            {/* CC BY-SA attribution for the stroke data — slot is always laid out
                so toggling strokes never shifts the card */}
            <p aria-hidden={!strokes} style={{ margin: 0, height: 14, fontSize: 10, fontWeight: 600, color: t.faint,
              opacity: strokes ? 1 : 0, transition: "opacity 160ms" }}>
              Stroke order data: KanjiVG (CC BY-SA)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
