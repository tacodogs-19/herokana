import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { Shell, Cat, Button, useDragDismiss } from "../components/chrome.jsx";
import { packById, buildReadingSession, slowWords, band, BAND_COPY } from "../reading.js";

// Maneki-neko reaction by reading speed (the brief: paw up = fast, sleepy =
// slow). Cat usage in this mode is sanctioned by the feature brief — see
// docs/decisions.md. A wrong answer overrides with the "almost" mood.
const moodFor = (correct, b) => (!correct ? "sad" : b === "instant" ? "point" : b === "read" ? "general" : "load");

const fmt = (ms) => `${(ms / 1000).toFixed(1)}s`;

function ReadingBody({ packId, slow, onExit, scrollProps }) {
  const { t } = useTheme();
  const progress = useProgress();
  const pack = packById(packId);

  // Round is fixed for the life of the screen. `slow` restricts it to the
  // words whose last read was in the slow band (the re-drill).
  const [session] = React.useState(() =>
    buildReadingSession(pack, slow ? slowWords(pack, progress.reading[packId]) : null));

  const [i, setI] = React.useState(0);
  const [picked, setPicked] = React.useState(null);
  const [results, setResults] = React.useState([]); // { jp, ms, correct }
  const [phase, setPhase] = React.useState("drill"); // drill | done
  const startRef = React.useRef(0);
  const q = session[i];

  // Reset the silent stopwatch at the start of each word. No visible clock —
  // speed is a reward shown only after answering.
  React.useEffect(() => {
    if (phase === "drill") startRef.current = performance.now();
  }, [i, phase]);

  const answered = picked != null;
  const correct = answered && picked === q.answer;
  const ms = answered ? results[results.length - 1].ms : 0;
  const b = answered ? band(ms) : null;

  const choose = (opt) => {
    if (answered) return;
    const took = Math.round(performance.now() - startRef.current);
    setPicked(opt);
    setResults((r) => [...r, { jp: q.jp, ms: took, correct: opt === q.answer }]);
  };

  const next = () => {
    if (i + 1 >= session.length) { finish(); return; }
    setI(i + 1); setPicked(null);
  };

  const finish = () => {
    progress.recordReading(pack.id, results);
    setPhase("done");
  };

  // average seconds per word, over the words read correctly (the hero number)
  const summary = React.useMemo(() => {
    const ok = results.filter((r) => r.correct);
    const avg = ok.length ? ok.reduce((s, r) => s + r.ms, 0) / ok.length : 0;
    return { avg, correct: ok.length, total: results.length };
  }, [results]);

  if (phase === "done") {
    return (
      <div {...scrollProps} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "18px 22px 22px", textAlign: "center", overflowY: "auto" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Cat mood="run" size={132} />
          <p style={{ margin: "6px 0 0", fontSize: 12.5, letterSpacing: "0.14em", fontWeight: 900, color: t.primary }}>
            {pack.place.toUpperCase()} · READING
          </p>
          {/* hero number — average seconds per word */}
          <div style={{ margin: "8px 0 0", display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: t.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {(summary.avg / 1000).toFixed(1)}
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: t.sub }}>s</span>
          </div>
          <p style={{ margin: "5px 0 0", fontSize: 14, color: t.sub, fontWeight: 600 }}>
            average per word · {summary.correct}/{summary.total} read
          </p>
        </div>

        <div style={{ display: "grid", gap: 10, flexShrink: 0, marginTop: 16 }}>
          <Button onClick={onExit} style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16.5 }}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div {...scrollProps} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "14px 20px 18px", overflowY: "auto" }}>
      {/* top bar: close + segmented progress (same idiom as Lesson) */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 22 }}>
        <button onClick={onExit} className="hk-press" aria-label="Exit reading" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.faint, padding: 4, flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <div style={{ flex: 1, display: "flex", gap: 5 }}>
          {session.map((_, k) => {
            const done = k < results.length, ok = done && results[k].correct;
            const c = k === i ? t.primary : !done ? t.line : ok ? t.done : t.wrong;
            return <div key={k} style={{ flex: 1, height: 7, borderRadius: 4, background: c, transition: "background 200ms" }} />;
          })}
        </div>
      </div>

      <p style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 900, color: t.primary }}>
        {pack.place.toUpperCase()} · READ THE REAL WORLD
      </p>
      <h2 style={{ margin: "0 0 18px", fontSize: 21, fontWeight: 800, color: t.ink }}>What does this say?</h2>

      {/* prompt card — the word + a "you'd see this where" hint. Reveal slot is
          fixed-height so the options below never shift. */}
      <div style={{ position: "relative", background: t.surface, borderRadius: 24, padding: "16px 20px", height: 224, flexShrink: 0,
        border: "none", display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, boxShadow: t.cardShadow, transition: "border-color 200ms" }}>
        <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <span style={{ fontFamily: JP, fontSize: q.jp.length > 5 ? 40 : q.jp.length > 3 ? 52 : 64, fontWeight: 700, color: t.ink, lineHeight: 1.2, textAlign: "center" }}>{q.jp}</span>
          {/* romaji reading, revealed after answering so you can check you read
              the kana correctly. Reserved slot so the word never shifts. */}
          <div style={{ height: 20, flexShrink: 0, display: "flex", alignItems: "center" }}>
            {answered && <span className="hk-reveal" style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: t.sub, letterSpacing: "0.03em" }}>{q.romaji}</span>}
          </div>
        </div>
        {/* "where you'd see it" hint */}
        <div style={{ height: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999,
            background: t.sunk, color: t.sub, fontSize: 12.5, fontWeight: 700 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>
            {q.where}
          </span>
        </div>
        {/* speed reveal slot — fixed height, only fills after answering */}
        <div aria-live="polite" style={{ height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {answered && (
            <span className="hk-reveal" style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
              <Cat mood={moodFor(correct, b)} size={30} />
              <span style={{ fontSize: 14.5, fontWeight: 800, color: correct ? (b === "slow" ? t.gold : t.done) : t.wrong }}>
                {correct ? `${fmt(ms)} · ${BAND_COPY[b]}` : `It's “${q.answer}”`}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* meaning choices — tapping one answers immediately (no Check step) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 0" }}>
        <div style={{ display: "grid", gap: 11, gridTemplateColumns: "1fr 1fr" }}>
          {q.options.map((o) => {
            const isAns = o === q.answer, isPick = o === picked;
            const bg = !answered ? t.surface : isAns ? t.doneSoft : isPick ? t.wrongSoft : t.surface;
            const bc = !answered ? "transparent" : isAns ? t.done : isPick ? t.wrong : "transparent";
            const fg = answered && isAns ? t.done : answered && isPick ? t.wrong : t.ink;
            return (
              <button key={o} onClick={() => choose(o)} className="hk-press" disabled={answered}
                style={{ padding: "16px 8px", borderRadius: 16, cursor: answered ? "default" : "pointer", background: bg,
                  border: `2px solid ${bc}`, boxShadow: t.cardShadow, color: fg, fontFamily: DISPLAY, fontSize: 15.5, fontWeight: 800 }}>
                {o}
              </button>
            );
          })}
        </div>
      </div>

      {/* action — only appears once answered, so the timing stays honest */}
      <button onClick={next} disabled={!answered} className="hk-press"
        style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", cursor: answered ? "pointer" : "default",
          background: !answered ? t.sunk : t.primary, color: !answered ? t.faint : "#fff",
          fontFamily: DISPLAY, fontSize: 16.5, fontWeight: 800, flexShrink: 0, boxShadow: answered ? t.glow(t.primary) : "none" }}>
        {i + 1 >= session.length ? "See results →" : "Next word →"}
      </button>
    </div>
  );
}

export default function ReadingMode({ packId, slow, onExit }) {
  const swipe = useDragDismiss({ onDismiss: onExit });
  return <Shell nav={false} modal outerRef={swipe.rootRef}><ReadingBody packId={packId} slow={slow} onExit={onExit} scrollProps={swipe.scrollProps} /></Shell>;
}
