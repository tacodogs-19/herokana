import React from "react";
import { useProgress } from "./store.jsx";
import { CHAPTERS, BANKS, loadProfile } from "./data";
import Home from "./screens/Home.jsx";
import Lesson from "./screens/Lesson.jsx";
import Result from "./screens/Result.jsx";
import Profile from "./screens/Profile.jsx";
import Practice from "./screens/Practice.jsx";
import Onboarding from "./screens/Onboarding.jsx";

export default function App() {
  const progress = useProgress();
  const [scr, setScr] = React.useState({ name: "home" });
  const [profile, setProfile] = React.useState(loadProfile);
  const [editing, setEditing] = React.useState(false);
  const onboardingVisible = !profile || editing;

  // Onboarding registers its step-back function so the Android back button can
  // walk back through the wizard rather than leaving it.
  const obBack = React.useRef(null);

  // ---- Android hardware back / swipe ----
  // A single buffered history entry is consumed on each back gesture; we decide
  // whether to navigate within the app (and re-arm) or let the app close.
  const back = React.useRef(() => false);
  back.current = () => {
    if (onboardingVisible) {
      if (obBack.current && obBack.current()) return true; // stepped back in wizard
      if (editing) { setEditing(false); return true; }     // close the editor
      return false;                                        // first-run, step 0 → exit
    }
    if (scr.name === "lesson" || scr.name === "result") { setScr({ name: scr.from || "home" }); return true; }
    if (scr.name === "practice" || scr.name === "profile") { setScr({ name: "home" }); return true; }
    return false; // already home → allow exit
  };

  React.useEffect(() => {
    window.history.pushState(null, ""); // arm the buffer
    const onPop = () => {
      if (back.current()) window.history.pushState(null, ""); // stayed in app → re-arm
      else window.history.back();                             // nothing to go back to → exit
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

  const nav = (tab) => setScr({ name: tab === "Profile" ? "profile" : tab === "Practice" ? "practice" : "home" });

  const startUnit = (ci, ui) => {
    // hard mode applies to banked chapters (words/sentences), not the alphabets
    const hard = progress.hard && !!BANKS[CHAPTERS[ci].id];
    const prog = hard ? progress.hardDone[ci] : progress.done[ci];
    const unitIdx = ui ?? Math.min(prog, CHAPTERS[ci].units.length - 1);
    const session = { kind: "unit", chapterIdx: ci, unitIdx };
    // hard mode = medium difficulty (multiple choice, no hints) answered in English
    if (hard) { session.difficulty = "medium"; session.dir = "en"; session.hard = true; }
    setScr({ name: "lesson", session, from: "home" });
  };
  const startPractice = (session) => setScr({ name: "lesson", session, from: "practice" });

  if (scr.name === "lesson")
    return (
      <Lesson key={JSON.stringify(scr.session) + (scr.attempt || 0)} session={scr.session}
        onExit={() => setScr({ name: scr.from || "home" })}
        onComplete={(r) => {
          const isUnit = scr.session.kind === "unit";
          progress.completeLesson({
            chapterIdx: isUnit ? scr.session.chapterIdx : null,
            unitIdx: isUnit ? scr.session.unitIdx : null,
            correct: r.correct, total: r.total, missed: r.missed, hard: scr.session.hard,
          });
          // finishing a chapter's last unit moves Home's focus to the next chapter
          if (isUnit && r.correct >= Math.ceil(r.total * 0.8)
            && scr.session.unitIdx + 1 >= CHAPTERS[scr.session.chapterIdx].units.length) {
            const next = Math.min(scr.session.chapterIdx + 1, CHAPTERS.length - 1);
            try { localStorage.setItem("hk-home-sel", String(next)); } catch (e) {}
          }
          setScr({ name: "result", session: scr.session, correct: r.correct, total: r.total, from: scr.from });
        }} />
    );
  if (scr.name === "result")
    return (
      <Result session={scr.session} correct={scr.correct} total={scr.total}
        onDone={() => setScr({ name: scr.from || "home" })}
        onReview={() => setScr({ name: "lesson", session: scr.session, from: scr.from, attempt: Date.now() })}
        onKeepGoing={() => setScr({ name: "lesson", session: scr.session, from: scr.from, attempt: Date.now() })}
        onFinish={() => setScr({ name: "practice" })} />
    );
  if (scr.name === "profile")
    return <Profile onNav={nav} onEditProfile={() => setEditing(true)} onReset={() => progress.resetProgress()} />;
  if (scr.name === "practice")
    return <Practice onNav={nav} onStart={startPractice} />;
  return <Home onNav={nav} onStart={startUnit} />;
}
