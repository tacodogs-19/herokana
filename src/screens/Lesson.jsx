import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { CHAPTERS } from "../data";
import { Shell, Modal, useDragDismiss } from "../components/chrome.jsx";
import { buildQuestions, MODE_TITLES, KANA_COMPOSE, canProduce } from "../questions.js";
import { speakKana, kanaClipFor, wordClipFor, speakVerb, verbClipFor, useJaVoice } from "../speech.js";

const SPEED_MS = 8000;
// A small, calm rotation so the affirmation doesn't read like one canned line.
const AFFIRM = ["Nice.", "That's it.", "Yes.", "Nicely done."];

function sessionLabel(session, qs) {
  if (session.kind === "unit") {
    const c = CHAPTERS[session.chapterIdx], u = c.units[session.unitIdx];
    return `${c.name.toUpperCase()} · ${u.label.toUpperCase()}`;
  }
  if (session.kind === "custom") return `CUSTOM SET · ${qs.length} QUESTIONS`;
  if (session.kind === "numbers") return `NUMBERS · ${qs.length} QUESTIONS`;
  if (session.kind === "foundations") return `SENTENCE BASICS · ${qs.length} QUESTIONS`;
  if (session.kind === "review") return `REVIEW · ${qs.length} ITEMS`;
  return MODE_TITLES[session.mode] || "PRACTICE";
}

function LessonBody({ session, onComplete, onExit }) {
  const { t } = useTheme();
  const progress = useProgress();
  const [qs, setQs] = React.useState(() => buildQuestions(session, progress));
  const [i, setI] = React.useState(0);
  const [sel, setSel] = React.useState(null);
  const [cons, setCons] = React.useState(null); // tile pad: pending consonant
  const [typed, setTyped] = React.useState("");
  const [checked, setChecked] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [timeLeft, setTimeLeft] = React.useState(1);
  const [confirmExit, setConfirmExit] = React.useState(false);
  // a session can resolve to no questions (e.g. a review whose items no longer
  // exist in the content) — bail out rather than dereference an empty round
  React.useEffect(() => { if (qs.length === 0) onExit(); }, []); // eslint-disable-line
  // Warm the (heavy) result cats now, so the result screen paints without a
  // fetch/decode stall when the round ends.
  React.useEffect(() => { ["/assets/cat-success.webp", "/assets/cat-fail.webp"].forEach((s) => { new Image().src = s; }); }, []);
  const q = qs[i];
  if (!q) return null;
  // confirm before leaving only if the learner is mid-round
  const tryExit = () => (results.length > 0 || i > 0 ? setConfirmExit(true) : onExit());
  // Drag the sheet down to dismiss — mirrors tryExit: confirm mid-round, else leave.
  const swipe = useDragDismiss({
    onDismiss: onExit,
    onBlocked: () => setConfirmExit(true),
    canDismiss: () => !(results.length > 0 || i > 0),
  });
  const isSpeed = session.kind === "mode" && session.mode === "speed";
  // lenient typed matching: case, spacing, and punctuation don't count
  const norm = (s) => s.toLowerCase().replace(/’/g, "'").replace(/[?.!,]/g, "").replace(/\s+/g, " ").trim();
  const given = q.input ? norm(typed) : sel;
  const isRight = (g) => q.input ? (q.answers || [q.answer]).some((a) => norm(a) === g) : g === q.answer;
  const correct = checked && isRight(given);
  const unscoredType = (x) => x.type === "word_reveal" || x.type === "teach" || x.type === "intro";
  // Production questions are always actionable: with nothing built the action
  // becomes "I don't know" (reveals the answer, counts as a miss, requeues) so a
  // learner who can't recall a sound is never trapped by a dead Check button.
  const canCheck = unscoredType(q) || q.prod || (q.input ? typed.trim().length > 0 : sel != null);
  const idk = q.prod && !checked && sel == null; // the "I don't know" escape state

  const hasVoice = useJaVoice();
  // Kana and phrase-bank words have bundled clips (no device voice needed);
  // sentences/numbers still ride the OS voice. canHear covers all three so those
  // surfaces work anywhere a clip exists.
  const canHear = (text) => hasVoice || !!kanaClipFor(text) || !!wordClipFor(text);
  // Kanji seen in this session — updated on advance so furigana stays visible
  // for the entire first encounter, then hides on any repeat of the same kanji.
  const seenKanjiRef = React.useRef(new Set());

  // Listening questions announce themselves — but only when there's audio to
  // do it; without any the question falls back to a readable prompt (below).
  React.useEffect(() => {
    if ((q.listen || q.type === "teach") && canHear(q.prompt)) speakKana(q.prompt);
    return () => { try { speechSynthesis.cancel(); } catch (e) {} };
  }, [i, hasVoice]);

  const check = React.useCallback(() => {
    setChecked(true);
    const right = isRight(given);
    setResults((r) => [...r, right]);
    // Memory loop: a missed kana returns at the end of the lesson for a second
    // retrieval attempt — production when the tile pad can build the sound,
    // otherwise the same question again. One retry per question.
    if (!right && q.type === "kana" && session.kind === "unit" && !q.requeued) {
      const again = canProduce(q.answer) && !q.prod
        ? { type: "kana", prod: true, prompt: q.prompt, answer: q.answer, meaning: q.meaning, requeued: true }
        : { ...q, requeued: true };
      setQs((prev) => [...prev, again]);
    }
  }, [given, q]);
  const checkRef = React.useRef(check);
  checkRef.current = check;

  // Speed round: each question is on the clock.
  React.useEffect(() => {
    if (!isSpeed || checked) return;
    const start = Date.now();
    setTimeLeft(1);
    const id = setInterval(() => {
      const left = 1 - (Date.now() - start) / SPEED_MS;
      if (left <= 0) { clearInterval(id); checkRef.current(); }
      else setTimeLeft(left);
    }, 100);
    return () => clearInterval(id);
  }, [i, checked, isSpeed]);

  // Unscored cards (word reveal / teach) never count toward correct or total;
  // concept items additionally stay out of the spaced-review bookkeeping.
  const finish = () => {
    const scored = (x) => !unscoredType(x);
    const right = qs.reduce((s, x, k) => s + (scored(x) && results[k] ? 1 : 0), 0);
    const pooled = (ok) => qs.filter((x, k) => x.type !== "concept" && scored(x) && !!results[k] === ok)
      .map((m) => ({ prompt: m.prompt, answer: m.answer }));
    onComplete({ correct: right, total: qs.filter(scored).length, missed: pooled(false), solved: pooled(true) });
  };
  const advance = () => { setI(i + 1); setSel(null); setCons(null); setTyped(""); setChecked(false); };

  const onAction = () => {
    // reveal/teach: unscored card — one tap advances without a check phase
    if (unscoredType(q)) {
      setResults((r) => [...r, true]);
      if (i + 1 >= qs.length) finish();
      else advance();
      return;
    }
    if (!checked) check();
    else if (i + 1 >= qs.length) finish();
    else {
      if (q.furigana) seenKanjiRef.current.add(q.prompt);
      advance();
    }
  };

  const optBg = (o) => {
    if (!checked) return sel === o ? t.primarySoft : t.surface;
    if (o === q.answer) return t.doneSoft;
    if (o === sel) return t.wrongSoft;
    return t.surface;
  };
  const optBorder = (o) => {
    // no outline by default (selection reads via optBg + the card shadow); an
    // outline appears only on the answered result — green for the correct answer,
    // red for the wrong pick
    if (checked && o === q.answer) return t.done;
    if (checked && o === sel) return t.wrong;
    return "transparent";
  };
  const optColor = (o) => {
    if (checked && o === q.answer) return t.done;
    if (checked && o === sel) return t.wrong;
    return t.ink;
  };

  const concept = q.type === "concept";
  const heading = q.type === "intro" ? q.title : q.type === "teach" ? "Meet a new kana." : q.type === "word_reveal" ? "Look what you can read." : concept ? "Sentence basics" : (q.listen && canHear(q.prompt)) ? "What do you hear?" : q.furigana ? "What does this kanji mean?" : q.prod ? "What sound does it make?" : q.type === "phrase" ? "What does this say?" : "Which sound is this?";
  // "Hear it" pre-answer would give production questions away — the sound IS the answer
  const hearSlot = checked || (q.type === "kana" && !q.prod) || q.type === "word_reveal" || q.type === "teach";
  // typed (hard) questions use the shorter card, so cap the prompt size to keep
  // it clear of the input below
  const promptSize = q.input
    ? (q.prompt.length > 7 ? 26 : 32)
    : (q.prompt.length > 7 ? 30 : q.prompt.length > 2 ? 44 : 96);
  const showPrompt = !q.listen || checked || !canHear(q.prompt);
  // sentence-length romaji options don't fit two abreast
  const longOptions = !q.input && q.options?.some((o) => o.length > 12);

  return (
    <Shell nav={false} modal outerRef={swipe.rootRef}>
    <div {...swipe.scrollProps} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "20px 20px 18px", overflowY: "auto" }}>
      {/* top bar: close + a single progress bar filling to the % completed */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: isSpeed ? 10 : 22 }}>
        <button onClick={tryExit} className="hk-press" aria-label="Exit lesson" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.faint, padding: 4, flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ display: "block" }}><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: t.line, overflow: "hidden" }}>
          <div style={{ width: `${(results.length / qs.length) * 100}%`, height: "100%", borderRadius: 3,
            background: t.primary, transition: "width 450ms var(--ease-out-expo)" }} />
        </div>
      </div>
      {isSpeed && (
        <div style={{ height: 4, borderRadius: 3, background: t.sunk, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ width: `${Math.max(0, timeLeft) * 100}%`, height: "100%", borderRadius: 3,
            background: timeLeft < 0.25 ? t.wrong : t.gold }} />
        </div>
      )}

      <p style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 900, color: t.primary }}>
        {sessionLabel(session, qs)}
      </p>
      <h2 style={{ margin: "0 0 18px", fontSize: 21, fontWeight: 800, color: t.ink }}>{heading}</h2>

      {/* prompt card — fixed height; prompt centers in its zone and the hint
          and Hear-it rows keep reserved slots so nothing ever shifts. Typed
          (hard) questions use a shorter card so the prompt and the input stay
          visible together once the on-screen keyboard opens. */}
      <div className={checked && !correct ? "hk-shake" : ""}
        style={{ position: "relative", background: t.surface, borderRadius: 24, padding: "16px 20px",
        height: q.input ? 168 : 224, flexShrink: 0,
        border: "none",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: t.cardShadow }}>
        {checked && (
          <div className="hk-pop" style={{ position: "absolute", top: 0, right: 0, transform: "translate(38%,-38%)",
            width: 38, height: 38, borderRadius: "50%", background: correct ? t.done : t.wrong, display: "flex",
            alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px -3px rgba(0,0,0,0.3)", border: "none" }}>
            {correct
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>}
          </div>
        )}
        {/* flex column so kana + mnemonic center together as a unit */}
        <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {!showPrompt
            ? <button onClick={() => speakKana(q.prompt)} className="hk-press" aria-label="Play sound"
                style={{ width: 96, height: 96, borderRadius: "50%", border: "none", cursor: "pointer", background: t.primarySoft,
                  color: t.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
              </button>
            : concept
              ? <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: t.ink, textAlign: "center" }}>
                  {q.prompt}
                  {q.ex && <span style={{ display: "block", marginTop: 12, fontFamily: JP, fontSize: 21, fontWeight: 700, color: t.ink }}>{q.ex}</span>}
                </span>
              : <span style={{ fontFamily: JP, fontSize: promptSize, fontWeight: 700, lineHeight: 1.2, color: t.ink, textAlign: "center" }}>{q.prompt}</span>}
          {q.furigana && !concept && !seenKanjiRef.current.has(q.prompt) && (
            <span style={{ fontFamily: JP, fontSize: 14, fontWeight: 500, color: t.sub, marginTop: 4 }}>{q.furigana}</span>
          )}
          {!concept && (
            <div style={{ height: (q.hint || (checked && q.meaning)) ? 20 : 0, marginTop: (q.hint || (checked && q.meaning)) ? 8 : 0, overflow: "hidden", flexShrink: 0, transition: "height 200ms, margin-top 200ms", display: "flex", alignItems: "center" }}>
              {q.hint
                ? <span style={{ fontSize: 13.5, fontWeight: 500, color: t.sub }}>"{q.hint}"</span>
                : checked && q.meaning
                  ? <span className="hk-reveal" style={{ fontSize: 13.5, fontWeight: 500, color: t.sub }}>"{q.meaning}"</span>
                  : null}
            </div>
          )}
        </div>
        {concept ? (
          <div style={{ minHeight: 42, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            {checked && q.meaning && <span className="hk-reveal" style={{ fontSize: 13, fontWeight: 500, color: t.sub, lineHeight: 1.4 }}>{q.meaning}</span>}
          </div>
        ) : (
          <div style={{ height: hearSlot ? 38 : 0, marginTop: hearSlot ? 0 : -8, overflow: "hidden", flexShrink: 0, transition: "height 200ms, margin-top 200ms" }}>
            <div style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {showPrompt && (canHear(q.prompt) || (q.audio && verbClipFor(q.audio))) && hearSlot && (
                <button onClick={() => q.audio ? speakVerb(q.audio) : speakKana(q.prompt)} className="hk-press" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                  borderRadius: 12, border: `1.5px solid ${t.line}`, background: t.bg, color: t.sub, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", fontFamily: DISPLAY }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
                  Hear it
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* plain + polite reveal — verbs are answered in their dictionary form, but
          the polite ます form is what appears in sentences, so once answered both
          are shown side by side (with the meaning already on the card above). */}
      {checked && q.forms && (
        <div className="hk-reveal" style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
          {[
            { label: "PLAIN", jp: q.forms.plainJp, r: q.forms.plainR },
            { label: "POLITE", jp: q.forms.politeJp, r: q.forms.politeR },
          ].map((f) => (
            <div key={f.label} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2,
              background: t.chipTint, borderRadius: 14, padding: "9px 18px", minWidth: 96 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: t.sub, fontFamily: DISPLAY }}>{f.label}</span>
              <span style={{ fontFamily: JP, fontSize: 19, fontWeight: 700, color: t.ink, lineHeight: 1.25 }}>{f.jp}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: t.sub, fontFamily: DISPLAY }}>{f.r}</span>
            </div>
          ))}
        </div>
      )}

      {/* word-mapping chips — prototype: shows romaji + English under each kana
          chunk so the learner sees how the sentence decomposes. Only renders on
          sentences that carry a `parts` array (currently the About me unit). */}
      {checked && q.parts && (
        <div className="hk-reveal" style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 12 }}>
          {q.parts.map((p, k) => (
            <span key={k} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1,
              background: t.chipTint, borderRadius: 12, padding: "6px 10px" }}>
              <span style={{ fontFamily: JP, fontSize: 16, fontWeight: 700, color: t.ink, lineHeight: 1.2 }}>{p.jp}</span>
              <span style={{ fontSize: 9, fontWeight: 500, color: t.faint, fontFamily: DISPLAY }}>{p.romaji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, fontFamily: DISPLAY }}>{p.en}</span>
            </span>
          ))}
        </div>
      )}

      {/* answers */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 0" }}>
        {q.type === "intro" ? (
          <div style={{ textAlign: "center", padding: "0 6px" }}>
            <p style={{ margin: 0, fontSize: 15.5, fontWeight: 500, color: t.sub, fontFamily: DISPLAY, lineHeight: 1.65 }}>{q.body}</p>
          </div>
        ) : q.type === "word_reveal" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: t.sub, fontFamily: DISPLAY, letterSpacing: "0.05em" }}>{q.reading}</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>{q.meaning}</p>
          </div>
        ) : q.type === "teach" ? (
          <div className="hk-reveal" style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontSize: 38, fontWeight: 800, color: t.primary, fontFamily: DISPLAY, textTransform: "lowercase", lineHeight: 1 }}>{q.reading}</p>
            {q.meaning && <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: t.sub, fontFamily: DISPLAY, lineHeight: 1.5 }}>{q.meaning}</p>}
          </div>
        ) : q.prod ? (
          <div>
            {/* composed answer + backspace (steps back: "ka" → "k…" → empty) */}
            <div style={{ position: "relative", height: 54, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 16, fontFamily: DISPLAY, fontSize: 22, fontWeight: 800, textTransform: "lowercase",
              border: `2px solid ${checked ? (correct ? t.done : t.wrong) : sel ? t.primary : t.line}`,
              background: checked ? (correct ? t.doneSoft : t.wrongSoft) : t.surface,
              color: checked ? (correct ? t.done : t.wrong) : sel ? t.ink : t.faint,
              transition: "border-color 200ms, background 200ms" }}>
              {(() => { const txt = sel || (cons ? `${cons}…` : "build the sound");
                return <span key={txt} className={sel ? "hk-settle" : ""}>{txt}</span>; })()}
              {!checked && (sel || cons) && (
                <button onClick={() => { if (sel) setSel(null); else setCons(null); }} className="hk-press" aria-label="Backspace"
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    width: 38, height: 38, borderRadius: 11, border: "none", cursor: "pointer",
                    background: t.sunk, color: t.sub, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" /><path d="m12 9 6 6M18 9l-6 6" />
                  </svg>
                </button>
              )}
            </div>
            {checked && !correct && (
              <p className="hk-reveal" style={{ margin: "0 0 10px", textAlign: "center", fontSize: 14.5, fontWeight: 800, color: t.done }}>{q.answer}</p>
            )}
            {(() => {
              const tile = (on, off) => ({ padding: "12px 4px", borderRadius: 12, cursor: checked || off ? "default" : "pointer",
                background: on ? t.primarySoft : t.surface, border: `2px solid ${on ? t.primary : t.line}`,
                color: on ? t.primary : t.ink, fontFamily: DISPLAY, fontSize: 16, fontWeight: 800,
                opacity: off ? 0.35 : 1, transition: "opacity 150ms, border-color 150ms, background 150ms" });
              return (
                <>
                  {/* consonants (tap again to clear) + standalone ん after w —
                      one 5-col grid so every key is the same width */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 8 }}>
                    {Object.keys(KANA_COMPOSE).map((c) => (
                      <button key={c} disabled={checked} className="hk-press"
                        onClick={() => { setCons(cons === c ? null : c); setSel(null); }}
                        style={tile(cons === c, false)}>{c}</button>
                    ))}
                    {/* standalone ん — labelled with the kana itself so it reads
                        as one complete sound, not a second "n" consonant */}
                    <button disabled={checked || cons != null} className="hk-press"
                      onClick={() => setSel("n")} style={{ ...tile(sel === "n" && cons == null, cons != null), fontFamily: JP }}>ん</button>
                  </div>
                  {/* vowels — same 5-col rhythm. Once a consonant is armed the
                      keys relabel to the actual syllable (h → ha hi fu he ho), so
                      irregular sounds like fu/shi/chi/tsu are discoverable rather
                      than needing an "f"/"sh" key that doesn't exist. */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                    {["a", "i", "u", "e", "o"].map((v) => {
                      const val = cons ? (KANA_COMPOSE[cons] || {})[v] : v;
                      return (
                        <button key={v} disabled={checked || (cons != null && !val)} className="hk-press"
                          onClick={() => setSel(val)} style={tile(val != null && sel === val, cons != null && !val)}>
                          {(() => { const lbl = cons ? (val || v) : v; return <span key={lbl} className="hk-relabel">{lbl}</span>; })()}
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        ) : q.input ? (
          <>
            <input value={typed} onChange={(e) => !checked && setTyped(e.target.value)} disabled={checked}
              placeholder={q.answers ? "Type the romaji or English" : "Type the romaji"}
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              onFocus={(e) => { const el = e.target; setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300); }}
              onKeyDown={(e) => { if (e.key === "Enter" && canCheck) onAction(); }}
              style={{ width: "100%", padding: "16px", borderRadius: 16, fontFamily: DISPLAY, fontSize: 18, fontWeight: 700,
                textAlign: "center", outline: "none", color: checked ? (correct ? t.done : t.wrong) : t.ink,
                background: checked ? (correct ? t.doneSoft : t.wrongSoft) : t.surface, boxShadow: t.cardShadow,
                border: `2px solid ${checked ? (correct ? t.done : t.wrong) : "transparent"}` }} />
            {checked && !correct && (
              <p className="hk-reveal" style={{ margin: "10px 0 0", textAlign: "center",
                fontSize: 14.5, fontWeight: 800, color: t.done }}>
                {(q.answers || [q.answer]).join(" · ")}
              </p>
            )}
          </>
        ) : (
          <div key={i} style={{ display: "grid", gap: 11, gridTemplateColumns: longOptions ? "1fr" : "1fr 1fr" }}>
            {q.options.map((o, oi) => (
              <button key={o} onClick={() => !checked && setSel(o)}
                className={`hk-press hk-opt-enter${checked && o === q.answer ? (correct ? " hk-correct" : " hk-guide") : ""}`}
                disabled={checked}
                style={{ '--i': oi, ...(checked && !correct && o === q.answer ? { '--guide': `${t.done}66` } : {}),
                  padding: longOptions ? "12px 8px" : "16px 8px", borderRadius: 16, cursor: checked ? "default" : "pointer", background: optBg(o),
                  border: `2px solid ${optBorder(o)}`, boxShadow: t.cardShadow, color: optColor(o), fontFamily: DISPLAY,
                  fontSize: q.type === "phrase" || concept ? 15.5 : 19, fontWeight: 800,
                  textTransform: q.type === "phrase" || concept ? "none" : "lowercase",
                  transition: "background 220ms var(--ease-out-quart), border-color 220ms var(--ease-out-quart), color 220ms" }}>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* feedback + action — row is always present so answers never shift */}
      <div style={{ height: 27, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
        color: correct ? t.done : t.wrong, fontWeight: 800, fontSize: 15 }}>
        {checked && (
          <span className="hk-reveal">
            {correct ? AFFIRM[i % AFFIRM.length] : "Not quite"}
          </span>
        )}
      </div>
      <button onClick={onAction} disabled={!checked && !canCheck} className="hk-press"
        style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", cursor: checked || canCheck ? "pointer" : "default",
          background: idk ? t.sunk : !checked && !canCheck ? t.sunk : checked ? (correct ? t.done : t.wrong) : t.primary,
          color: idk ? t.sub : !checked && !canCheck ? t.faint : "#fff",
          fontFamily: DISPLAY, fontSize: 16.5, fontWeight: 800, flexShrink: 0,
          boxShadow: idk || (!checked && !canCheck) ? "none" : t.glow(checked ? (correct ? t.done : t.wrong) : t.primary),
          transition: "background 240ms var(--ease-out-quart), box-shadow 240ms var(--ease-out-quart), color 150ms" }}>
        {unscoredType(q) ? (i + 1 >= qs.length ? "Finish →" : "Got it →") : !checked ? (idk ? "I don't know" : "Check") : i + 1 >= qs.length ? "Finish →" : "Continue →"}
      </button>

      {confirmExit && (
        <Modal onDismiss={() => setConfirmExit(false)}>
          <div style={{ background: t.surface, color: t.ink, border: "none", borderRadius: 20,
            padding: "20px 20px 18px", fontFamily: DISPLAY, boxShadow: t.cardShadow }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Leave this lesson?</div>
            <div style={{ fontSize: 13.5, color: t.sub, fontWeight: 500, margin: "6px 0 16px", lineHeight: 1.45 }}>
              Your progress in this round won't be saved.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <button onClick={() => setConfirmExit(false)} className="hk-press"
                style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: t.primary,
                  color: "#fff", fontFamily: DISPLAY, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: t.glow(t.primary) }}>
                Keep going
              </button>
              <button onClick={onExit} className="hk-press"
                style={{ width: "100%", padding: "13px", borderRadius: 14, border: `1.5px solid ${t.line}`, background: t.surface,
                  color: t.wrong, fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>
                Leave
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </Shell>
  );
}

export default function Lesson({ session, onComplete, onExit }) {
  return <LessonBody session={session} onComplete={onComplete} onExit={onExit} />;
}
