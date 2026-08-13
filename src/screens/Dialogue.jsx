import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { Shell, Cat } from "../components/chrome.jsx";
import { dialogueById, prepareDialogue, SUPPORT } from "../dialogue.js";
import { speakLine, stopSpeech, useSpeechRecognition, useRecorder, looseMatch, toKana } from "../speech.js";

// Small speaker icon for the audio-only (text hidden) state.
const SpeakerIcon = ({ c, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

// "Your turn — say it": the production beat on every YOU line. Shadowing first
// (hear the model, say it), with a gentle native-recognition mirror when the
// device has it, or record + play-back when it doesn't. Never blocks — Next is
// always available below it.
function SpeakBeat({ line, onHearModel, t }) {
  const sr = useSpeechRecognition();
  const rec = useRecorder();
  const matched = sr.heard ? looseMatch(sr.heard, line.jp) : false;
  const pill = (label, onClick, opts = {}) => (
    <button onClick={onClick} disabled={opts.disabled} className="hk-press"
      style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 12, cursor: opts.disabled ? "default" : "pointer",
        background: opts.fill ? t.primary : t.surface, border: `1.5px solid ${opts.fill ? t.primary : t.line}`,
        color: opts.fill ? "#fff" : t.ink, fontFamily: DISPLAY, fontSize: 13, fontWeight: 800 }}>
      {label}
    </button>
  );
  return (
    <div style={{ background: t.sunk, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
      <p style={{ margin: "0 0 8px", fontSize: 10, letterSpacing: "0.12em", fontWeight: 800, color: t.primary }}>YOUR TURN · SAY IT</p>
      <div style={{ fontFamily: JP, fontSize: 18, fontWeight: 700, color: t.ink, lineHeight: 1.25 }}>{line.jp}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: t.sub, marginTop: 2 }}>{line.romaji} · {line.en}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
        {pill("Hear model", onHearModel)}
        {sr.supported
          ? pill(sr.listening ? "Listening…" : "Say it", sr.start, { fill: true, disabled: sr.listening })
          : rec.supported
            ? pill(rec.recording ? "Stop" : "Record", rec.recording ? rec.stop : rec.start, { fill: !rec.recording })
            : null}
        {!sr.supported && rec.supported && rec.url && pill("Play yours", () => { try { new Audio(rec.url).play(); } catch (e) {} })}
      </div>
      {sr.supported && sr.heard && (
        <div className="hk-reveal" style={{ marginTop: 9, fontSize: 12.5, fontWeight: 700, color: matched ? t.done : t.sub }}>
          {matched ? "Sounds right!" : `We heard: ${toKana(sr.heard)}`}
        </div>
      )}
      {!sr.supported && !rec.supported && (
        <p style={{ margin: "9px 0 0", fontSize: 11.5, fontWeight: 600, color: t.faint }}>Say it aloud, then tap Next.</p>
      )}
    </div>
  );
}

function DialogueBody({ dialogueId, onExit }) {
  const { t } = useTheme();
  const progress = useProgress();
  const d = dialogueById(dialogueId);

  // Start one level past the hardest cleared so far (first run → Guided).
  const cleared = (progress.dialogues[dialogueId] && progress.dialogues[dialogueId].clearedLevel);
  const [levelIdx, setLevelIdx] = React.useState(() => Math.min(SUPPORT.length - 1, Math.max(0, (cleared ?? -1) + 1)));
  const level = SUPPORT[levelIdx];

  const [lines] = React.useState(() => prepareDialogue(d)); // stable shuffled options
  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState(null);
  const [results, setResults] = React.useState([]); // { correct } per check
  const [phase, setPhase] = React.useState("play"); // play | done
  const scrollRef = React.useRef(null);

  const line = lines[idx];
  const isCheck = !!(line && line.check);
  const answered = picked != null;
  const correct = answered && picked === line.en;

  // bundled clips (two neural voices) with device TTS as the fallback
  const speak = React.useCallback((text, who) =>
    speakLine(text, { who, rate: level.rate }), [level]);

  React.useEffect(() => stopSpeech, []); // leaving mid-line stops the audio

  // Auto-play the active line; keep the newest bubble in view.
  React.useEffect(() => {
    if (phase !== "play" || !line) return;
    speak(line.jp, line.who);
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [idx, phase]); // eslint-disable-line

  // Changing the support level restarts the run (scaffolding can't change mid-way).
  const setLevel = (li) => { setLevelIdx(li); setIdx(0); setPicked(null); setResults([]); setPhase("play"); stopSpeech(); };

  const choose = (opt) => {
    if (answered) return;
    setPicked(opt);
    setResults((r) => [...r, { correct: opt === line.en }]);
  };

  const next = () => {
    if (idx + 1 >= lines.length) {
      const checks = lines.filter((l) => l.check).length;
      const got = results.filter((r) => r.correct).length;
      const pct = checks ? Math.round((got / checks) * 100) : 100;
      progress.recordDialogue(d.id, { pct, levelIdx });
      stopSpeech();
      setPhase("done");
      return;
    }
    setIdx(idx + 1); setPicked(null);
  };

  // Is a bubble's text visible? Past lines always read (building transcript);
  // the active line follows the support level.
  const textVisible = (k, ln, answeredThis) => {
    if (k < idx) return true;
    if (level.id === "guided") return true;
    if (ln.check) return answeredThis;     // listen/ear: questions are audio-only until answered
    return level.id === "listen";          // ear hides context too until you advance
  };

  if (phase === "done") {
    const checks = lines.filter((l) => l.check).length;
    const got = results.filter((r) => r.correct).length;
    const pct = checks ? Math.round((got / checks) * 100) : 100;
    const passed = pct >= 80;
    const canStepDown = passed && levelIdx < SUPPORT.length - 1;
    return (
      <Shell nav={false}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "18px 22px 22px", overflowY: "auto" }}>
        <div style={{ textAlign: "center" }}>
          <Cat mood={passed ? "run" : "general"} size={120} style={{ margin: "0 auto" }} />
          <p style={{ margin: "4px 0 0", fontSize: 12.5, letterSpacing: "0.14em", fontWeight: 800, color: t.primary }}>
            {SUPPORT[levelIdx].label.toUpperCase()} · {d.title.toUpperCase()}
          </p>
          <div style={{ margin: "8px 0 0" }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: passed ? t.done : t.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>{pct}%</span>
          </div>
          <p style={{ margin: "5px 0 0", fontSize: 14, color: t.sub, fontWeight: 600 }}>
            understood · {got}/{checks} caught
          </p>
        </div>

        {/* full transcript — reading reinforcement after the listening */}
        <div style={{ marginTop: 18 }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 800, color: t.faint }}>TRANSCRIPT</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lines.map((ln, k) => {
              const you = ln.who === "you";
              return (
              <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: you ? "flex-end" : "flex-start" }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.08em", color: t.faint, margin: "0 4px 3px" }}>
                  {you ? "YOU" : "STAFF"}
                </span>
                <div style={{ maxWidth: "85%", background: you ? t.primarySoft : t.surface, border: `1.5px solid ${you ? "transparent" : t.line}`,
                  borderRadius: 16, padding: "11px 14px", textAlign: "left" }}>
                  <div style={{ fontFamily: JP, fontSize: 16, fontWeight: 700, color: t.ink, lineHeight: 1.25 }}>{ln.jp}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: t.sub, marginTop: 2 }}>{ln.romaji} · {ln.en}</div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, flexShrink: 0, marginTop: 16 }}>
          {canStepDown && (
            <button onClick={() => setLevel(levelIdx + 1)} className="hk-press" style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none",
              background: t.primary, color: "#fff", fontFamily: DISPLAY, fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: t.glow(t.primary) }}>
              Try it at {SUPPORT[levelIdx + 1].label} level →
            </button>
          )}
          <button onClick={() => setLevel(levelIdx)} className="hk-press" style={{ width: "100%", padding: canStepDown ? "14px" : "16px", borderRadius: 16,
            border: canStepDown ? `1.5px solid ${t.line}` : "none", background: canStepDown ? t.surface : t.primary,
            color: canStepDown ? t.ink : "#fff", fontFamily: DISPLAY, fontSize: 15.5, fontWeight: 800, cursor: "pointer",
            boxShadow: canStepDown ? "none" : t.glow(t.primary) }}>
            {passed ? "Replay this level" : "Try again"}
          </button>
          <button onClick={onExit} className="hk-press" style={{ width: "100%", padding: "13px", borderRadius: 16,
            border: `1.5px solid ${t.line}`, background: t.surface, color: t.ink, fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>
            Done
          </button>
        </div>
      </div>
      </Shell>
    );
  }

  const heading = isCheck ? line.ask : "Listen";

  return (
    <Shell nav={false} scrollShadow={false}>
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "14px 20px 18px" }}>
      {/* top bar: exit + segmented progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 12 }}>
        <button onClick={onExit} className="hk-press" aria-label="Exit conversation" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.faint, padding: 4, flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <div style={{ flex: 1, display: "flex", gap: 5 }}>
          {lines.map((ln, k) => {
            const isCheckSeg = !!ln.check;
            const passedSeg = k < idx || (k === idx && answered);
            const c = !isCheckSeg
              ? (k <= idx ? t.line : t.sunk)
              : k === idx && !answered ? t.primary
              : k > idx ? t.sunk
              : results[lines.slice(0, k + 1).filter((l) => l.check).length - 1] && results[lines.slice(0, k + 1).filter((l) => l.check).length - 1].correct ? t.done : t.wrong;
            return <div key={k} style={{ flex: isCheckSeg ? 1.4 : 0.7, height: 7, borderRadius: 4, background: c, transition: "background 200ms" }} />;
          })}
        </div>
      </div>

      {/* support dial — the manual difficulty scale */}
      <div style={{ display: "flex", background: t.seg, borderRadius: 12, padding: 3, marginBottom: 4 }}>
        {SUPPORT.map((s, li) => {
          const on = li === levelIdx;
          return (
            <button key={s.id} onClick={() => setLevel(li)} className="hk-press"
              style={{ flex: 1, padding: "7px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                background: on ? t.surface : "transparent", color: on ? t.ink : t.sub,
                boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY, fontSize: 12.5, fontWeight: on ? 800 : 600 }}>
              {s.label}
            </button>
          );
        })}
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 600, color: t.faint, textAlign: "center" }}>{level.blurb}</p>

      <p style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 800, color: t.primary }}>{d.title.toUpperCase()}</p>
      <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: t.ink }}>{heading}</h2>

      {/* transcript so far */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "2px 0 8px" }}>
        {lines.slice(0, idx + 1).map((ln, k) => {
          const active = k === idx;
          const answeredThis = active ? answered : true;
          const vis = textVisible(k, ln, answeredThis);
          const you = ln.who === "you";
          const showResult = active && ln.check && answered;
          const border = showResult ? (correct ? t.done : t.wrong) : t.line;
          // the English meaning IS the answer to a check — keep it hidden on the
          // active question until answered, even when the kana/romaji show (Guided)
          const hideAnswer = active && !!ln.check && !answered;
          return (
            <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: you ? "flex-end" : "flex-start" }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.08em", color: t.faint, margin: "0 4px 3px" }}>{you ? "YOU" : "STAFF"}</span>
              <div style={{ maxWidth: "85%", background: you ? t.primarySoft : t.surface, border: `1.5px solid ${you ? "transparent" : border}`,
                borderRadius: 16, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, opacity: active ? 1 : 0.85 }}>
                <button onClick={() => speak(ln.jp, ln.who)} className="hk-press" aria-label="Replay"
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, display: "flex", color: you ? t.primary : t.sub }}>
                  <SpeakerIcon c={you ? t.primary : t.sub} />
                </button>
                {vis ? (
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: JP, fontSize: 18, fontWeight: 700, color: t.ink, lineHeight: 1.25 }}>{ln.jp}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: t.sub, marginTop: 2 }}>{ln.romaji}{hideAnswer ? "" : ` · ${ln.en}`}</div>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.faint, fontStyle: "italic" }}>
                    {ln.check ? "Listen and choose" : "Tap to hear"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* action zone: comprehension options, or Next */}
      <div style={{ flexShrink: 0, paddingTop: 10 }}>
        {isCheck && !answered ? (
          <div style={{ display: "grid", gap: 9 }}>
            {line.options.map((o) => (
              <button key={o} onClick={() => choose(o)} className="hk-press"
                style={{ width: "100%", padding: "13px 14px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                  background: t.surface, border: `1.5px solid ${t.line}`, color: t.ink, fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 700 }}>
                {o}
              </button>
            ))}
          </div>
        ) : (
          <>
            {line.who === "you" && <SpeakBeat key={idx} line={line} onHearModel={() => speak(line.jp, line.who)} t={t} />}
            <div style={{ height: 24, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
              color: isCheck ? (correct ? t.done : t.wrong) : t.sub, fontWeight: 800, fontSize: 14 }}>
              {isCheck && answered && <span className="hk-reveal">{correct ? "Caught it!" : `They said “${line.en}”`}</span>}
            </div>
            <button onClick={next} className="hk-press"
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", cursor: "pointer",
                background: isCheck && answered ? (correct ? t.done : t.wrong) : t.primary, color: "#fff",
                fontFamily: DISPLAY, fontSize: 16.5, fontWeight: 800, boxShadow: t.glow(isCheck && answered ? (correct ? t.done : t.wrong) : t.primary) }}>
              {idx + 1 >= lines.length ? "See result →" : "Next →"}
            </button>
          </>
        )}
      </div>
    </div>
    </Shell>
  );
}

export default function Dialogue({ dialogueId, onExit }) {
  return <DialogueBody dialogueId={dialogueId} onExit={onExit} />;
}
