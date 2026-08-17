import React from "react";
import { useProgress } from "./store.jsx";
import { CHAPTERS, BANKS, loadProfile, KANA_BASICS, SENTENCE_BASICS } from "./data";
import Home from "./screens/Home.jsx";
import Lesson from "./screens/Lesson.jsx";
import Result from "./screens/Result.jsx";
import Profile from "./screens/Profile.jsx";
import Practice from "./screens/Practice.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Reading from "./screens/Reading.jsx";
import ReadingPack from "./screens/ReadingPack.jsx";
import ReadingMode from "./screens/ReadingMode.jsx";
import Dialogue from "./screens/Dialogue.jsx";
import KanaChart from "./screens/KanaChart.jsx";
import VerbChart from "./screens/VerbChart.jsx";
import Basics from "./screens/Basics.jsx";

export default function App() {
  const progress = useProgress();
  const [scr, setScr] = React.useState({ name: "home" });
  const [profile, setProfile] = React.useState(loadProfile);
  const [editing, setEditing] = React.useState(false);
  const [navKey, setNavKey] = React.useState(0);
  const [navDir, setNavDir] = React.useState("none");
  const onboardingVisible = !profile || editing;

  // Onboarding registers its step-back function so the back button can walk
  // back through the wizard rather than leaving it.
  const obBack = React.useRef(null);

  // ---- History-backed navigation ----
  // go() = forward push (drill in), dir defaults to "forward" but nav() passes "tab"
  // replace() = in-place swap (lesson→result, try-again); still animates forward
  const go = (next, dir = "forward") => {
    setNavDir(dir);
    setNavKey((k) => k + 1);
    window.history.pushState({ scr: next }, "");
    setScr(next);
  };
  const replace = (next) => {
    setNavDir("forward");
    setNavKey((k) => k + 1);
    window.history.replaceState({ scr: next }, "");
    setScr(next);
  };

  // Refs so the once-bound popstate handler sees current overlay state.
  const onbRef = React.useRef(onboardingVisible); onbRef.current = onboardingVisible;
  const editRef = React.useRef(editing); editRef.current = editing;
  const scrRef = React.useRef(scr); scrRef.current = scr;

  React.useEffect(() => {
    window.history.pushState({ scr: { name: "home" } }, ""); // arm home; the entry below is the exit boundary
    const onPop = (e) => {
      // Overlays (onboarding wizard / profile editor) handle back internally and
      // must not consume a screen entry, so re-arm the one the pop just ate.
      if (onbRef.current) {
        if (obBack.current && obBack.current()) { window.history.pushState({ scr: scrRef.current }, ""); return; }
        if (editRef.current) { setEditing(false); window.history.pushState({ scr: scrRef.current }, ""); return; }
        window.history.back(); // first-run, step 0 → let it exit
        return;
      }
      const s = e.state && e.state.scr;
      if (s) {
        setNavDir("back");
        setNavKey((k) => k + 1);
        setScr(s);
        return;
      }
      window.history.back(); // popped past the base → exit
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (onboardingVisible)
    return (
      <Onboarding
        initial={editing ? profile : null}
        registerBack={(fn) => { obBack.current = fn; }}
        onDone={() => { setProfile(loadProfile()); setEditing(false); }}
      />
    );

  // Every tab switch pushes, so back returns to the last visited tab (and the
  // gesture preview snapshots it). Tapping the current tab is a no-op.
  const nav = (tab) => {
    const name = tab === "Profile" ? "profile" : tab === "Practice" ? "practice" : tab === "Scenes" ? "reading" : "home";
    if (name !== scr.name) go({ name }, "tab");
  };

  const startUnit = (ci, ui) => {
    // hard mode applies to banked chapters (words/sentences), not the alphabets
    const hard = progress.hard && !!BANKS[CHAPTERS[ci].id];
    const prog = hard ? progress.hardDone[ci] : progress.done[ci];
    const unitIdx = ui ?? Math.min(prog, CHAPTERS[ci].units.length - 1);
    const session = { kind: "unit", chapterIdx: ci, unitIdx };
    // hard mode = medium difficulty (multiple choice, no hints) answered in English
    if (hard) { session.difficulty = "medium"; session.dir = "en"; session.hard = true; }
    go({ name: "lesson", session });
  };
  const startPractice = (session) => go({ name: "lesson", session });
  const startReview = () => go({ name: "lesson", session: { kind: "review" } });
  const startChapterReview = (ci) => go({ name: "lesson", session: { kind: "chapter-review", chapterIdx: ci } });
  const openPack = (packId) => go({ name: "readingPack", packId });
  const startReading = (packId, slow) => go({ name: "readingDrill", packId, slow });
  const startDialogue = (dialogueId, packId) => go({ name: "dialogue", dialogueId, packId });
  const openKanaChart = () => go({ name: "kanaChart" });
  const openVerbChart = () => go({ name: "verbChart" });
  const openBasics = () => go({ name: "sentenceBasics" });
  const openKanaBasics = () => go({ name: "kanaBasics" });
  const goBack = () => window.history.back();

  let content;
  if (scr.name === "lesson")
    content = (
      <Lesson key={JSON.stringify(scr.session) + (scr.attempt || 0)} session={scr.session}
        onExit={goBack}
        onComplete={(r) => {
          const isUnit = scr.session.kind === "unit";
          progress.completeLesson({
            chapterIdx: isUnit ? scr.session.chapterIdx : null,
            unitIdx: isUnit ? scr.session.unitIdx : null,
            correct: r.correct, total: r.total, missed: r.missed, solved: r.solved, hard: scr.session.hard,
          });
          if (scr.session.kind === "review") progress.markReviewDone();
          // finishing a chapter's last unit moves Home's focus to the next chapter
          if (isUnit && r.correct >= Math.ceil(r.total * 0.8)
            && scr.session.unitIdx + 1 >= CHAPTERS[scr.session.chapterIdx].units.length) {
            const next = Math.min(scr.session.chapterIdx + 1, CHAPTERS.length - 1);
            try { localStorage.setItem("hk-home-sel", String(next)); } catch (e) {}
          }
          // replace so a back-gesture from the result skips the played lesson
          replace({ name: "result", session: scr.session, correct: r.correct, total: r.total });
        }} />
    );
  else if (scr.name === "result")
    content = (
      <Result session={scr.session} correct={scr.correct} total={scr.total}
        onDone={goBack}
        onReview={() => replace({ name: "lesson", session: scr.session, attempt: Date.now() })}
        onKeepGoing={() => replace({ name: "lesson", session: scr.session, attempt: Date.now() })}
        onFinish={goBack}
        onReadingGrad={() => replace({ name: "reading" })} />
    );
  else if (scr.name === "profile")
    content = <Profile onNav={nav} onEditProfile={() => setEditing(true)} onReset={() => progress.resetProgress()} />;
  else if (scr.name === "practice")
    content = <Practice onNav={nav} onStart={startPractice} onOpenChart={openKanaChart} onOpenVerbChart={openVerbChart} onOpenBasics={openBasics} />;
  else if (scr.name === "kanaChart")
    content = <KanaChart onClose={goBack} />;
  else if (scr.name === "verbChart")
    content = <VerbChart onClose={goBack} />;
  else if (scr.name === "sentenceBasics")
    content = <Basics title="Sentence basics" cards={SENTENCE_BASICS} onClose={goBack}
      intro="A quick tour of how Japanese sentences fit together, before you start the Sentences chapter." />;
  else if (scr.name === "kanaBasics")
    content = <Basics title="Kana basics" cards={KANA_BASICS} onClose={goBack}
      intro="What the Japanese writing system is, before you learn your first sounds." />;
  else if (scr.name === "reading")
    content = <Reading onNav={nav} onOpenPack={openPack} />;
  else if (scr.name === "readingPack")
    content = <ReadingPack packId={scr.packId} onNav={nav} onBack={goBack}
      onStartReading={startReading} onStartDialogue={startDialogue} />;
  else if (scr.name === "readingDrill")
    content = <ReadingMode key={`${scr.packId}${scr.slow ? "-slow" : ""}`} packId={scr.packId} slow={scr.slow} onExit={goBack} />;
  else if (scr.name === "dialogue")
    content = <Dialogue key={scr.dialogueId} dialogueId={scr.dialogueId} onExit={goBack} />;
  else
    content = <Home onNav={nav} onStart={startUnit} onStartReview={startReview} onReviewChapter={startChapterReview} onOpenBasics={openBasics} onOpenKanaBasics={openKanaBasics} onOpenChart={openKanaChart} onStartSession={startPractice} onOpenVerbChart={openVerbChart} />;

  // Forward nav: slide up from below (feels like drilling in / stacking a new card)
  // Back nav: fade in (feels like the stack is unwinding)
  // Tab switch: NO whole-screen transform — that would drag the sticky header and
  // the fixed nav (a transform makes fixed children relative to it). Instead the
  // .hk-nav-tab class scopes a fade+rise onto each screen's .hk-rise content pane
  // (styles.css), leaving the header + nav static.
  const animStyle = navDir === "forward"
    ? { animation: "hkEnter 280ms var(--ease-out) both" }
    : navDir === "back"
    ? { animation: "hkFade 180ms ease both" }
    : undefined;

  // Outer div always opaque with the correct bg so Chrome never sees a gap
  // between the status bar and the WebView during the opacity:0 animation frames.
  return (
    <div style={{ background: "var(--hk-bg)", minHeight: "100dvh" }}>
      <div key={navKey} className={navDir === "tab" ? "hk-nav-tab" : undefined} style={animStyle}>{content}</div>
    </div>
  );
}
