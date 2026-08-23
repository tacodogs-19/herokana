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
import { flingState } from "./components/chrome.jsx";

// Modal/takeover screens (rounded-corner sheets, or full-screen overlays). We
// still hold one behind the incoming sheet, but DIM it (like iOS receding the
// presenting context) so its own rounded corners fall back and only the incoming
// sheet's corners read — instead of two rounded tops stacking as a busy overlap.
const MODAL_SCREENS = new Set(["lesson", "result", "dialogue", "readingDrill",
  "readingPack", "kanaChart", "verbChart", "sentenceBasics", "kanaBasics"]);

export default function App() {
  const progress = useProgress();
  const [scr, setScr] = React.useState({ name: "home" });
  const [profile, setProfile] = React.useState(loadProfile);
  const [editing, setEditing] = React.useState(false);
  const [navKey, setNavKey] = React.useState(0);
  const [navDir, setNavDir] = React.useState("none");
  const wrapRef = React.useRef(null);
  // A held DOM snapshot of an adjacent screen during a transition: mode "behind"
  // (forward — the previous screen sits behind the slide-up) or "dismiss" (back —
  // the leaving screen slides down off the top). { html, key, mode }.
  const [snap, setSnap] = React.useState(null);
  // Snapshot the current screen's markup + the scroll offsets of every scrollable
  // node (innerHTML clones lose scroll — the rail would snap to its left edge and
  // the page to the top). Offsets are keyed by descendant index so they can be
  // re-applied to the identical clone tree after it mounts (see applyScrolls).
  const snapshot = (mode) => {
    const el = wrapRef.current;
    if (!el) return;
    const scrolls = [];
    el.querySelectorAll("*").forEach((n, i) => { if (n.scrollTop || n.scrollLeft) scrolls.push([i, n.scrollTop, n.scrollLeft]); });
    // Pull-down dismiss hands a release velocity (chrome.jsx flingState); map it
    // to the slide-off duration so a hard flick whips off and a gentle release
    // glides. Fixed 240ms otherwise (tap-back, hardware back).
    // ponytail: velocity→duration curve, not a real spring — swap for a spring if the ease ever needs to track drag momentum exactly.
    let dur = 240;
    if (mode === "dismiss" && Date.now() - flingState.ts < 150) {
      dur = Math.round(Math.min(300, Math.max(140, 400 / (flingState.vy + 0.7))));
      flingState.ts = 0; // one-shot
    }
    // dim the held layer when it's a modal sheet (see MODAL_SCREENS) so its
    // corners recede behind the incoming sheet's
    setSnap({ html: el.innerHTML, scrolls, key: Date.now(), mode, dim: mode === "behind" && MODAL_SCREENS.has(scr.name), dur });
  };
  const applyScrolls = (node) => {
    if (!node || !snap || !snap.scrolls) return;
    const set = () => {
      const all = node.querySelectorAll("*");
      snap.scrolls.forEach(([i, top, left]) => {
        const t = all[i];
        if (t) { void t.scrollHeight; t.scrollTop = top; t.scrollLeft = left; }
      });
    };
    set(); // immediate — the rail (no images) restores now
    // re-apply after a frame: a vertical offset can clamp against a stale height
    // while the clone's (cached) images are still sizing; by the next frame they
    // have, so the full offset lands.
    requestAnimationFrame(set);
  };
  // Scroll memory for back-nav: capture the live screen's scroll offsets (same
  // index-keyed shape as snapshot) so they can be stashed in the history entry
  // we're leaving and re-applied to the freshly-mounted screen on the way back.
  const captureScrolls = () => {
    const el = wrapRef.current;
    if (!el) return [];
    const s = [];
    el.querySelectorAll("*").forEach((n, i) => { if (n.scrollTop || n.scrollLeft) s.push([i, n.scrollTop, n.scrollLeft]); });
    return s;
  };
  const pendingRestore = React.useRef(null);
  React.useLayoutEffect(() => {
    const scrolls = pendingRestore.current;
    if (!scrolls) return;
    pendingRestore.current = null;
    const root = wrapRef.current;
    if (!root) return;
    const apply = () => {
      const all = root.querySelectorAll("*");
      scrolls.forEach(([i, top, left]) => { const t = all[i]; if (t) { void t.scrollHeight; t.scrollTop = top; t.scrollLeft = left; } });
    };
    apply();
    requestAnimationFrame(apply);
  }, [navKey]);
  const onboardingVisible = !profile || editing;

  // Onboarding registers its step-back function so the back button can walk
  // back through the wizard rather than leaving it.
  const obBack = React.useRef(null);

  // ---- History-backed navigation ----
  // go() = forward push (drill in), dir defaults to "forward" but nav() passes "tab"
  // replace() = in-place swap within the lesson/result flow (lesson→result,
  //   try-again). No sheet slide — the outcome is part of the lesson, so the
  //   destination just appears in place and its own content animates in.
  const go = (next, dir = "forward") => {
    // stash the leaving screen's scroll in its (current) history entry so a later
    // back-nav here restores where we were
    try { window.history.replaceState({ scr: scrRef.current, scrolls: captureScrolls() }, ""); } catch (e) {}
    if (dir === "forward") snapshot("behind"); // hold the current screen behind the slide-up (dimmed if it's a modal)
    setNavDir(dir);
    setNavKey((k) => k + 1);
    window.history.pushState({ scr: next }, "");
    setScr(next);
  };
  const replace = (next) => {
    setNavDir("replace"); // not "forward"/"tab"/"back" → no screen-level animation
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
        // Snapshot the leaving screen so it can slide down off-screen while the
        // destination (rendered behind it) is revealed. A DOM snapshot preserves
        // the exact visual — a re-mounted React screen would flash its initial
        // state (e.g. a mid-lesson would jump back to question 1). Cleared on
        // the slide-down's animationend.
        snapshot("dismiss");
        pendingRestore.current = (e.state && e.state.scrolls) || null; // restore this screen's scroll after it re-mounts
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
    content = <Profile onNav={nav} onEditProfile={() => setEditing(true)} onReset={() => progress.resetProgress()} onReview={startReview} />;
  else if (scr.name === "practice")
    content = <Practice onNav={nav} onStart={startPractice} onOpenChart={openKanaChart} onOpenVerbChart={openVerbChart} onOpenBasics={openBasics} onReview={startReview} />;
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
    content = <Reading onNav={nav} onOpenPack={openPack} onReview={startReview} />;
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
  // Back nav: the destination sits still and the leaving screen (the `dismiss`
  //   snapshot overlay below) slides down off it — a sheet dismiss.
  // Tab switch: NO whole-screen transform — that would drag the sticky header and
  // the fixed nav (a transform makes fixed children relative to it). Instead the
  // .hk-nav-tab class scopes a fade+rise onto each screen's .hk-rise content pane
  // (styles.css), leaving the header + nav static.
  // Arrival settles in on the deliberate iOS sheet curve; the dismiss (below) is
  // quicker and lighter so leaving never feels as weighty as arriving.
  const animStyle = navDir === "forward"
    ? { animation: "hkSlideUp 340ms var(--ease-drawer) both, hkSlideFade 170ms var(--ease-drawer) both" }
    : undefined;

  // Outer div always opaque with the correct bg so Chrome never sees a gap
  // between the status bar and the WebView during the opacity:0 animation frames.
  return (
    <div style={{ background: "var(--hk-bg)", minHeight: "100dvh" }}>
      {/* forward: hold the previous screen behind the slide-up (its own transform
          contains its fixed children; DOM-before + transformed wrapper keeps it
          beneath). Cleared on the wrapper's slide-up animationend. */}
      {snap && snap.mode === "behind" && (
        <>
          <div key={snap.key} ref={applyScrolls} aria-hidden="true" className="hk-snap"
            style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", transform: "translateZ(0)" }}
            dangerouslySetInnerHTML={{ __html: snap.html }} />
          {/* dim the held screen behind the incoming sheet (DOM after it, before
              the wrapper) — revealed during the slide-up and while dragging the
              sheet down, for iOS-sheet depth. Fades in over the slide-up duration
              so it ramps with the movement instead of snapping on. */}
          <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "rgba(8,12,24,0.4)",
            animation: navDir === "forward" ? "hkSlideFade 340ms var(--ease-drawer) both" : undefined }} />
        </>
      )}
      {/* zIndex 1 keeps the live screen above the persistent behind-snapshot
          (below). For modal screens we KEEP that snapshot after the slide-up so
          a drag-dismiss reveals the real destination behind the sheet instead of
          the bare app background; non-modal forwards clear it as before. */}
      <div key={navKey} ref={wrapRef} className={navDir === "tab" ? "hk-nav-tab" : undefined}
        style={{ position: "relative", zIndex: 1, ...animStyle }}
        onAnimationEnd={(e) => { if (e.animationName === "hkSlideUp" && !MODAL_SCREENS.has(scr.name)) setSnap(null); }}>{content}</div>
      {/* back: the leaving screen slides down off the bottom, on top. A dim over
          the destination fades out as it's revealed — depth on the way out too. */}
      {snap && snap.mode === "dismiss" && (
        <>
          <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none",
            background: "rgba(8,12,24,0.4)", animation: `hkDimOut ${snap.dur}ms var(--ease-drawer) both` }} />
          <div key={snap.key} ref={applyScrolls} aria-hidden="true" className="hk-snap"
            style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none",
              animation: `hkSlideDown ${snap.dur}ms var(--ease-drawer) both` }}
            onAnimationEnd={(e) => { if (e.animationName === "hkSlideDown") setSnap(null); }}
            dangerouslySetInnerHTML={{ __html: snap.html }} />
        </>
      )}
    </div>
  );
}
