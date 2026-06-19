import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { CHAPTERS, BANKS, NUMBER_GROUPS } from "../data";
import { Shell, ThemeToggle } from "../components/chrome.jsx";
import SentenceBasics from "./SentenceBasics.jsx";

const PModeIcon = ({ name, c }) => {
  if (name === "shuffle") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>;
  if (name === "target") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill={c} /></svg>;
  if (name === "speed") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 13V9M12 2h0M9 2h6M18.5 6.5l1.5-1.5" /></svg>;
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>;
};

// The custom-set selection lives in sessionStorage: it starts blank the first
// time Practice is opened in a session, then remembers the last choice (even an
// empty one) for the rest of that session.
const loadSessionSet = (key) => {
  try { const v = JSON.parse(sessionStorage.getItem(key)); if (Array.isArray(v)) return new Set(v); } catch (e) {}
  return new Set();
};
const loadSessionThemes = () => {
  const empty = Object.fromEntries(Object.keys(BANKS).map((id) => [id, new Set()]));
  try {
    const v = JSON.parse(sessionStorage.getItem("hk-prac-themes"));
    if (v && typeof v === "object")
      Object.keys(BANKS).forEach((id) => { if (Array.isArray(v[id])) empty[id] = new Set(v[id]); });
  } catch (e) {}
  return empty;
};

const DIFFICULTIES = [
  { id: "easy", label: "Easy", hint: "Multiple choice" },
  { id: "medium", label: "Medium", hint: "Fewer hints" },
  { id: "hard", label: "Hard", hint: "Type the answer" },
];
const ROUND_SIZES = [5, 10, 15, 20];

function PracticeBody({ onStart }) {
  const { t } = useTheme();
  const progress = useProgress();
  const [picked, setPicked] = React.useState(() => loadSessionSet("hk-prac-chapters"));
  const [themes, setThemes] = React.useState(loadSessionThemes);
  const [diff, setDiff] = React.useState(() => {
    try { return localStorage.getItem("hk-prac-diff") || "easy"; } catch (e) { return "easy"; }
  });
  const [count, setCount] = React.useState(() => {
    try { const v = +localStorage.getItem("hk-prac-count"); if (ROUND_SIZES.includes(v)) return v; } catch (e) {}
    return 10;
  });
  const [dir, setDir] = React.useState(() => {
    try { const v = localStorage.getItem("hk-prac-dir"); if (v === "en" || v === "romaji") return v; } catch (e) {}
    return "romaji";
  });
  const [numGroups, setNumGroups] = React.useState(() => loadSessionSet("hk-prac-numbers"));
  const [showBasics, setShowBasics] = React.useState(false);
  const [tab, setTab] = React.useState(() => {
    try { const v = localStorage.getItem("hk-prac-tab"); if (v === "alpha" || v === "words" || v === "numbers") return v; } catch (e) {}
    return "words";
  });
  React.useEffect(() => { try { sessionStorage.setItem("hk-prac-chapters", JSON.stringify([...picked])); } catch (e) {} }, [picked]);
  React.useEffect(() => {
    try { sessionStorage.setItem("hk-prac-themes", JSON.stringify(Object.fromEntries(Object.entries(themes).map(([id, s]) => [id, [...s]])))); } catch (e) {}
  }, [themes]);
  React.useEffect(() => { try { localStorage.setItem("hk-prac-diff", diff); } catch (e) {} }, [diff]);
  React.useEffect(() => { try { localStorage.setItem("hk-prac-count", String(count)); } catch (e) {} }, [count]);
  React.useEffect(() => { try { localStorage.setItem("hk-prac-dir", dir); } catch (e) {} }, [dir]);
  React.useEffect(() => { try { localStorage.setItem("hk-prac-tab", tab); } catch (e) {} }, [tab]);
  React.useEffect(() => { try { sessionStorage.setItem("hk-prac-numbers", JSON.stringify([...numGroups])); } catch (e) {} }, [numGroups]);

  const toggleNum = (id) => setNumGroups((p) => {
    const n = new Set(p);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggle = (i) => setPicked((p) => {
    const n = new Set(p);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });
  const toggleTheme = (id, ti) => setThemes((p) => {
    const n = new Set(p[id]);
    n.has(ti) ? n.delete(ti) : n.add(ti);
    return { ...p, [id]: n };
  });

  // the custom set works within the active tab: alphabet (kana chapters)
  // or words & sentences (banked chapters)
  const inTab = (i) => (BANKS[CHAPTERS[i].id] ? tab === "words" : tab === "alpha");
  // banked chapters only contribute once at least one theme is chosen
  const effective = [...picked].filter((i) => inTab(i) && (!BANKS[CHAPTERS[i].id] || themes[CHAPTERS[i].id].size > 0));
  const needThemes = [...picked].some((i) => inTab(i) && BANKS[CHAPTERS[i].id] && themes[CHAPTERS[i].id].size === 0);

  const weakCount = Object.keys(progress.wrong).length;
  const modes = [
    { id: "review", icon: "shuffle", title: "Quick review", sub: "Mix what you know", color: t.primary, soft: t.primarySoft },
    { id: "weak", icon: "target", title: "Weak spots", sub: weakCount ? `${weakCount} tricky kana` : "Replay your misses", color: t.wrong, soft: t.wrongSoft },
    { id: "speed", icon: "speed", title: "Speed round", sub: "Beat the clock", color: t.gold, soft: t.goldSoft },
    { id: "listen", icon: "listen", title: "Listening", sub: "Hear & choose", color: t.done, soft: t.doneSoft },
  ];

  const numReady = tab === "numbers" && numGroups.size > 0;
  const canStart = tab === "numbers" ? numReady : effective.length > 0;

  const start = () => {
    if (tab === "numbers") {
      if (numReady) onStart({ kind: "numbers", groups: [...numGroups], difficulty: diff, count });
      return;
    }
    if (!effective.length) return;
    onStart({
      kind: "custom", chapters: effective, difficulty: diff, count,
      themes: Object.fromEntries(Object.entries(themes).map(([id, s]) => [id, [...s]])),
    });
  };

  const startLabel = canStart ? `Start practice · ${count} questions`
    : tab === "numbers" ? "Select at least one range"
    : needThemes ? "Pick at least one theme" : "Select at least one chapter";

  const segLabel = { margin: "0 0 7px", fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 700, color: t.faint };
  const segBox = { display: "flex", gap: 0, background: t.sunk, borderRadius: 12, padding: 3, marginBottom: 13 };
  // Difficulty + Answer-in controls, shared by the Words and Numbers tabs and
  // shown above the selection.
  const diffAnswer = (enLabel) => (
    <>
      <p style={segLabel}>DIFFICULTY</p>
      <div style={segBox}>
        {DIFFICULTIES.map((d) => {
          const dOn = diff === d.id;
          return (
            <button key={d.id} onClick={() => setDiff(d.id)} className="hk-press"
              style={{ flex: 1, padding: "7px 4px 6px", borderRadius: 9, border: "none", cursor: "pointer",
                background: dOn ? t.surface : "transparent", color: dOn ? t.ink : t.sub,
                boxShadow: dOn ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800 }}>{d.label}</span>
              <span style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.75, whiteSpace: "nowrap" }}>{d.hint}</span>
            </button>
          );
        })}
      </div>
      <p style={segLabel}>ANSWER IN</p>
      <div style={segBox}>
        {[{ id: "romaji", label: "Romaji" }, { id: "en", label: enLabel }].map((d) => {
          const dOn = dir === d.id;
          return (
            <button key={d.id} onClick={() => setDir(d.id)} className="hk-press"
              style={{ flex: 1, padding: "8px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                background: dOn ? t.surface : "transparent", color: dOn ? t.ink : t.sub,
                boxShadow: dOn ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                fontSize: 12.5, fontWeight: dOn ? 800 : 600 }}>
              {d.label}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <>
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 20px 24px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>Practice</h1>
        <div style={{ flex: 1 }} />
        <ThemeToggle />
      </header>

      {/* Build a custom set */}
      <p style={{ margin: "0 0 6px", fontSize: 11.5, letterSpacing: "0.14em", fontWeight: 700, color: t.sub }}>BUILD A CUSTOM SET</p>
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: t.faint }}>
        {tab === "numbers" ? "Pick the number ranges to practise." : "Pick the chapters to draw questions from."}
      </p>
      <div style={{ display: "flex", background: t.sunk, borderRadius: 12, padding: 3, marginBottom: 14 }}>
        {[{ id: "alpha", label: "Alphabet" }, { id: "words", label: "Words" }, { id: "numbers", label: "Numbers" }].map((tb) => {
          const on = tab === tb.id;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} className="hk-press"
              style={{ flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                background: on ? t.surface : "transparent", color: on ? t.ink : t.sub,
                boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                fontSize: 13, fontWeight: on ? 800 : 600, whiteSpace: "nowrap" }}>
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Words tab — difficulty + answer language above the chapter selection */}
      {tab === "words" && (
        <div style={{ marginBottom: 16 }}>
          {diffAnswer("English")}
        </div>
      )}

      {/* Numbers tab — pick ranges + difficulty + answer language */}
      {tab === "numbers" && (
        <div style={{ marginBottom: 16 }}>
          {diffAnswer("Digits")}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 7px" }}>
            <p style={{ margin: 0, fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 700, color: t.faint }}>RANGES</p>
            {(() => {
              const allOn = numGroups.size === NUMBER_GROUPS.length;
              return (
                <button onClick={() => setNumGroups(allOn ? new Set() : new Set(NUMBER_GROUPS.map((g) => g.id)))} className="hk-press"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: t.primary, fontFamily: DISPLAY, fontSize: 12, fontWeight: 800 }}>
                  {allOn ? "Clear all" : "Select all"}
                </button>
              );
            })()}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {NUMBER_GROUPS.map((g) => {
              const on = numGroups.has(g.id);
              return (
                <button key={g.id} onClick={() => toggleNum(g.id)} className="hk-press"
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", borderRadius: 16, cursor: "pointer",
                    background: on ? t.primarySoft : t.surface, border: `1.5px solid ${on ? t.primary : t.line}`, textAlign: "left" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: t.primarySoft,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: JP, fontSize: 18, fontWeight: 700, color: t.primary }}>{g.jp}</span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: t.ink, fontFamily: DISPLAY }}>{g.label}</div>
                    <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 600, fontFamily: DISPLAY }}>{g.items.length} numbers</div>
                  </div>
                  <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, border: `2px solid ${on ? t.primary : t.line}`,
                    background: on ? t.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {on && <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5" /></svg>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: tab === "numbers" ? "none" : "grid", gap: 10, marginBottom: 16 }}>
        {CHAPTERS.map((c, i) => {
          if (!inTab(i)) return null;
          const st = progress.chapterState(i);
          const on = picked.has(i);
          const banked = !!BANKS[c.id];
          const sel = banked ? themes[c.id] : null;
          const missingThemes = banked && on && sel.size === 0;
          return (
            <div key={c.id}>
              <button onClick={() => toggle(i)} className="hk-press"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", borderRadius: 16, cursor: "pointer",
                  background: on ? t.primarySoft : t.surface, border: `1.5px solid ${on ? t.primary : t.line}`, textAlign: "left" }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: st === "done" ? t.doneSoft : t.primarySoft,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: JP, fontSize: 18, fontWeight: 700, color: st === "done" ? t.done : t.primary }}>{c.units[0].jp}</span>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: t.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: DISPLAY }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: missingThemes ? t.primary : t.sub, fontWeight: 600, fontFamily: DISPLAY }}>
                    {banked
                      ? (on ? (sel.size ? `${sel.size} of ${c.units.length} themes · ${DIFFICULTIES.find((d) => d.id === diff).label}` : "Pick themes below") : `${c.units.length} themes`)
                      : `${c.units.length} units`}
                  </div>
                </div>
                <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, border: `2px solid ${on ? t.primary : t.line}`,
                  background: on ? t.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {on && <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5" /></svg>}
                </span>
              </button>

              {/* banked sub-options — selectable themes (difficulty & answer-in
                  live above the selection now) */}
              {banked && on && (
                <div className="hk-reveal" style={{ padding: "10px 4px 2px 8px" }}>
                  <p style={{ margin: "0 0 7px", fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 700, color: t.faint }}>THEMES</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {(() => {
                      const allOn = sel.size === c.units.length;
                      return (
                        <button onClick={() => setThemes((p) => ({ ...p, [c.id]: allOn ? new Set() : new Set(c.units.map((_, x) => x)) }))}
                          className="hk-press"
                          style={{ padding: "7px 14px", borderRadius: 11, cursor: "pointer",
                            background: allOn ? t.primary : t.surface, border: `1.5px solid ${allOn ? t.primary : t.line}`,
                            color: allOn ? "#fff" : t.sub, fontFamily: DISPLAY, fontSize: 12.5, fontWeight: 700 }}>
                          All
                        </button>
                      );
                    })()}
                    {c.units.map((u, ti) => {
                      const tOn = sel.has(ti);
                      return (
                        <button key={ti} onClick={() => toggleTheme(c.id, ti)} className="hk-press"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px 7px 9px", borderRadius: 11, cursor: "pointer",
                            background: tOn ? t.primary : t.surface, border: `1.5px solid ${tOn ? t.primary : t.line}`,
                            color: tOn ? "#fff" : t.sub, fontFamily: DISPLAY, fontSize: 12.5, fontWeight: 700 }}>
                          <span style={{ fontFamily: JP, fontSize: 14, fontWeight: 700 }}>{u.jp}</span>
                          {u.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* sentences-only: getting-started helpers */}
                  {c.id === "sentence" && (
                    <>
                      <p style={{ margin: "16px 0 7px", fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 700, color: t.faint }}>GETTING STARTED</p>
                      <button onClick={() => onStart({ kind: "foundations", count })} className="hk-press"
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left", marginBottom: 9,
                          background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}>
                        <span style={{ display: "flex", width: 34, height: 34, borderRadius: 10, background: t.primarySoft, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2 2 0 0 1 6 4h5v15H6a2 2 0 0 0-2 1z" /><path d="M20 5.5A2 2 0 0 0 18 4h-5v15h5a2 2 0 0 1 2 1z" /></svg>
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>Sentence foundations</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginTop: 1, fontFamily: DISPLAY }}>Particles, word order & endings</div>
                        </div>
                        <span style={{ color: t.faint, fontSize: 17, flexShrink: 0 }}>›</span>
                      </button>
                      <button onClick={() => setShowBasics(true)} className="hk-press"
                        style={{ width: "100%", padding: "11px", borderRadius: 13, cursor: "pointer",
                          background: t.primarySoft, border: "none", color: t.primary, fontFamily: DISPLAY, fontSize: 13, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
                        See the sentence basics overview
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Round length — applies to custom sets and modes */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.ink, whiteSpace: "nowrap" }}>Questions per round</span>
        <div style={{ flex: 1, display: "flex", background: t.sunk, borderRadius: 12, padding: 3 }}>
          {ROUND_SIZES.map((n) => {
            const on = count === n;
            return (
              <button key={n} onClick={() => setCount(n)} className="hk-press"
                style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: "none", cursor: "pointer",
                  background: on ? t.surface : "transparent", color: on ? t.ink : t.sub,
                  boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                  fontSize: 13, fontWeight: on ? 800 : 600 }}>
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={start} disabled={!canStart} className="hk-press"
        style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", cursor: canStart ? "pointer" : "default",
          background: canStart ? t.primary : t.sunk, color: canStart ? "#fff" : t.faint, fontFamily: DISPLAY, fontSize: 16, fontWeight: 800,
          boxShadow: canStart ? t.glow(t.primary) : "none" }}>
        {startLabel}
      </button>

      {/* Modes */}
      <p style={{ margin: "72px 0 11px", fontSize: 11.5, letterSpacing: "0.14em", fontWeight: 700, color: t.sub }}>PRACTICE MODES</p>
      <div style={{ display: "grid", gap: 11, gridTemplateColumns: "1fr 1fr" }}>
        {modes.map((m) => (
          <button key={m.id} onClick={() => onStart({ kind: "mode", mode: m.id, count })} className="hk-press"
            style={{ textAlign: "left", background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: 18, padding: "14px 14px 15px", cursor: "pointer" }}>
            <span style={{ display: "flex", width: 40, height: 40, borderRadius: 12, background: m.soft, alignItems: "center", justifyContent: "center", marginBottom: 11 }}>
              <PModeIcon name={m.icon} c={m.color} />
            </span>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>{m.title}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, marginTop: 2, fontFamily: DISPLAY }}>{m.sub}</div>
          </button>
        ))}
      </div>
    </div>
    {showBasics && <SentenceBasics onClose={() => setShowBasics(false)} />}
    </>
  );
}

export default function Practice({ onNav, onStart }) {
  return <Shell active="Practice" onNav={onNav}><PracticeBody onStart={onStart} /></Shell>;
}
