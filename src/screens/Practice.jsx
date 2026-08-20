import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { CHAPTERS, BANKS, NUMBER_GROUPS } from "../data";
import { Shell, Text, StickyHeader, useHeaderScroll } from "../components/chrome.jsx";
import { useJaVoice } from "../speech.js";

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
const MODE_COUNT = 10; // the one-tap practice modes use a fixed round size — no picker

function PracticeBody({ onStart, onOpenChart, onOpenVerbChart, onOpenBasics }) {
  const { t } = useTheme();
  const [scrolled, onHeaderScroll, headerRef, headerH] = useHeaderScroll();
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
  const [tab, setTab] = React.useState(() => {
    try { const v = localStorage.getItem("hk-prac-tab"); if (v === "alpha" || v === "words" || v === "verbs" || v === "numbers") return v; } catch (e) {}
    return "words";
  });
  const [modeCategory, setModeCategory] = React.useState(() => {
    try { const v = localStorage.getItem("hk-prac-mode-cat"); if (v === "alpha" || v === "words" || v === "verbs" || v === "sentences" || v === "numbers") return v; } catch (e) {}
    return "alpha";
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
  React.useEffect(() => { try { localStorage.setItem("hk-prac-mode-cat", modeCategory); } catch (e) {} }, [modeCategory]);

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

  // the custom set works within the active tab: kana chapters, verbs (its own
  // tab), or words & sentences (the other banked chapters)
  const inTab = (i) => {
    const id = CHAPTERS[i].id;
    if (id === "verb") return tab === "verbs";
    return BANKS[id] ? tab === "words" : tab === "alpha";
  };
  // banked chapters only contribute once at least one theme is chosen
  const effective = [...picked].filter((i) => inTab(i) && (!BANKS[CHAPTERS[i].id] || themes[CHAPTERS[i].id].size > 0));
  const needThemes = [...picked].some((i) => inTab(i) && BANKS[CHAPTERS[i].id] && themes[CHAPTERS[i].id].size === 0);

  const hasVoice = useJaVoice();
  const weakCount = Object.keys(progress.wrong).length;

  const modes = [
    { id: "review", icon: "shuffle", title: "Quick review", sub: "Mix what you know", color: t.primary, soft: t.primaryTint },
    { id: "weak", icon: "target", title: "Weak spots", sub: weakCount ? `${weakCount} tricky ${weakCount === 1 ? "item" : "items"}` : "Replay your misses", color: t.wrong, soft: t.wrongSoft },
    { id: "speed", icon: "speed", title: "Speed round", sub: "Beat the clock", color: t.gold, soft: t.goldSoft },
    // Listening needs the OS Japanese voice — disable it on devices without one
    { id: "listen", icon: "listen", title: "Listening", sub: hasVoice ? "Hear & choose" : "Needs a Japanese voice", color: t.done, soft: t.doneSoft, off: !hasVoice },
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

  const segLabel = { margin: "0 0 7px", fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 900, color: t.faint };
  const segBox = { display: "flex", gap: 0, background: t.seg, borderRadius: 12, padding: 3, marginBottom: 13 };
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
      <StickyHeader scrolled={scrolled} overlay innerRef={headerRef}>
        <img src="/assets/cat-header.svg" alt="" aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.onChrome }}>Practice</h1>
      </StickyHeader>
      <div onScroll={onHeaderScroll}
        style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", padding: "0 20px calc(94px + env(safe-area-inset-bottom))", paddingTop: headerH }}>

      <div className="hk-rise">
      <Text variant="eyebrow" color={t.ink} style={{ margin: "32px 0 12px" }}>REFERENCE</Text>
      {/* Reference sheets — passive look-up, not drills */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        <button onClick={onOpenChart} className="hk-press"
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "13px 15px",
            borderRadius: 18, cursor: "pointer", background: t.surface, border: "none", textAlign: "left", boxShadow: t.cardShadow }}>
          <span style={{ display: "flex", width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: t.primaryTint,
            alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M9 3v18M3 9h18M3 15h18M15 3v18" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>Kana chart</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, fontFamily: DISPLAY }}>Look up any kana &amp; hear it</div>
          </div>
          <span style={{ color: t.faint, fontSize: 17, flexShrink: 0 }}>›</span>
        </button>
        <button onClick={onOpenVerbChart} className="hk-press"
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "13px 15px",
            borderRadius: 18, cursor: "pointer", background: t.surface, border: "none", textAlign: "left", boxShadow: t.cardShadow }}>
          <span style={{ display: "flex", width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: t.primaryTint,
            alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h13" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>Verb list</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, fontFamily: DISPLAY }}>Common verbs &amp; conjugation forms</div>
          </div>
          <span style={{ color: t.faint, fontSize: 17, flexShrink: 0 }}>›</span>
        </button>
      </div>

      {/* Practice modes — the one-tap path, front and centre */}
      <Text variant="eyebrow" color={t.ink} style={{ margin: "60px 0 11px" }}>PRACTICE MODES</Text>
      <div style={{ display: "flex", background: t.seg, borderRadius: 12, padding: 3, marginBottom: 14 }}>
        {[{ id: "alpha", label: "Kana" }, { id: "words", label: "Words" }, { id: "verbs", label: "Verbs" }, { id: "sentences", label: "Sentences" }, { id: "numbers", label: "Numbers" }].map((tb) => {
          const on = modeCategory === tb.id;
          return (
            <button key={tb.id} onClick={() => setModeCategory(tb.id)} className="hk-press"
              style={{ flex: 1, padding: "9px 3px", borderRadius: 9, border: "none", cursor: "pointer",
                background: on ? t.surface : "transparent", color: on ? t.ink : t.sub,
                boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                fontSize: 11.5, fontWeight: on ? 800 : 600, whiteSpace: "nowrap" }}>
              {tb.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: "grid", gap: 11, gridTemplateColumns: "1fr 1fr", marginBottom: 0 }}>
        {modes.map((m) => (
          <button key={m.id} onClick={() => !m.off && onStart({ kind: "mode", mode: m.id, count: MODE_COUNT, category: modeCategory })} disabled={m.off} className="hk-press"
            style={{ textAlign: "left", background: t.surface, border: "none", borderRadius: 18, padding: "14px 14px 15px",
              cursor: m.off ? "default" : "pointer", opacity: m.off ? 0.55 : 1, boxShadow: t.cardShadow }}>
            <span style={{ display: "flex", width: 40, height: 40, borderRadius: 12, background: m.soft, alignItems: "center", justifyContent: "center", marginBottom: 11 }}>
              <PModeIcon name={m.icon} c={m.color} />
            </span>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>{m.title}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, marginTop: 2, fontFamily: DISPLAY }}>{m.sub}</div>
          </button>
        ))}
      </div>

      {/* Build a custom set — the deliberate path for drilling exact
          chapters/themes at a chosen difficulty. */}
      <Text variant="eyebrow" color={t.ink} style={{ margin: "60px 0 11px" }}>BUILD A CUSTOM SET</Text>
      <Text variant="subtitle" style={{ margin: "0 0 14px" }}>
        {tab === "numbers" ? "Pick the number ranges to practise." : "Pick the chapters to draw questions from."}
      </Text>
      <div style={{ background: t.surface, border: "none", borderRadius: 20, padding: "16px 16px 18px", boxShadow: t.cardShadow }}>
      <div style={{ display: "flex", background: t.seg, borderRadius: 12, padding: 3, marginBottom: 14 }}>
        {[{ id: "alpha", label: "Kana" }, { id: "words", label: "Words" }, { id: "verbs", label: "Verbs" }, { id: "numbers", label: "Numbers" }].map((tb) => {
          const on = tab === tb.id;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} className="hk-press"
              style={{ flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                background: on ? t.surface : "transparent", color: on ? t.ink : t.sub,
                boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                fontSize: 11.5, fontWeight: on ? 800 : 600, whiteSpace: "nowrap" }}>
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Words / Verbs tabs — difficulty + answer language above the selection */}
      {(tab === "words" || tab === "verbs") && (
        <div style={{ marginBottom: 16 }}>
          {diffAnswer("English")}
        </div>
      )}

      {/* Numbers tab — pick ranges + difficulty + answer language */}
      {tab === "numbers" && (
        <div style={{ marginBottom: 16 }}>
          {diffAnswer("Digits")}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 7px" }}>
            <p style={{ margin: 0, fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 900, color: t.faint }}>RANGES</p>
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
                    background: "transparent", border: "none", textAlign: "left" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: t.primaryTint,
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
                  background: "transparent", border: "none", textAlign: "left" }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: st === "done" ? t.doneSoft : t.primaryTint,
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
                  <p style={{ margin: "0 0 7px", fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 900, color: t.faint }}>THEMES</p>
                  {c.id === "sentence" && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      {[
                        { label: "Sentence basics", onClick: onOpenBasics,
                          icon: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></> },
                        { label: "Grammar drill", onClick: () => onStart({ kind: "foundations", count }),
                          icon: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /> },
                      ].map((b) => (
                        <button key={b.label} onClick={b.onClick} className="hk-press"
                          style={{ flex: 1, minWidth: 0, padding: "10px 8px", borderRadius: 12, cursor: "pointer",
                            background: t.line, border: "none", color: t.sub, fontFamily: DISPLAY, fontSize: 12, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}
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

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Round length — applies to the custom set */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.ink, whiteSpace: "nowrap" }}>Questions per round</span>
        <div style={{ flex: 1, display: "flex", background: t.seg, borderRadius: 12, padding: 3 }}>
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
      </div>{/* end custom set card */}
      </div>
    </div>
    </>
  );
}

export default function Practice({ onNav, onStart, onOpenChart, onOpenVerbChart, onOpenBasics }) {
  return <Shell active="Practice" onNav={onNav} whiteTop><PracticeBody onStart={onStart} onOpenChart={onOpenChart} onOpenVerbChart={onOpenVerbChart} onOpenBasics={onOpenBasics} /></Shell>;
}
