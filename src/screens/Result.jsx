import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { CHAPTERS } from "../data";
import { READING_UNLOCK } from "../reading.js";
import { Shell, Cat, Card, Button } from "../components/chrome.jsx";

function ResultBody({ session, correct, total, onDone, onReview, onKeepGoing, onFinish, onReadingGrad }) {
  const { t } = useTheme();
  const progress = useProgress();
  const acc = Math.round((correct / total) * 100);
  const passed = correct >= Math.ceil(total * 0.8);
  const xp = correct * 6 + (passed ? 8 : 0);

  const isUnit = session.kind === "unit";
  const chapter = isUnit ? CHAPTERS[session.chapterIdx] : null;
  const unit = isUnit ? chapter.units[session.unitIdx] : null;
  // store is already updated by the time this renders; hard lessons track hardDone
  const newDone = isUnit ? (session.hard ? progress.hardDone : progress.done)[session.chapterIdx] : 0;
  const cpct = isUnit ? Math.round((newDone / chapter.units.length) * 100) : 0;
  // Pinned to the Complex Sentences chapter (not the last chapter) so appended
  // bonus chapters — First kanji onward — never move the graduation moment.
  const isGraduation = isUnit && passed && chapter.id === "complex" && newDone >= chapter.units.length;
  // Completing the READING_UNLOCK chapter opens the Scenes tab — announce it here,
  // since the unlock otherwise happens silently mid-course. Like isGraduation, this
  // also shows on replays of a completed chapter's units; accepted for simplicity.
  const isScenesUnlock = isUnit && passed && !isGraduation && chapter.id === READING_UNLOCK && newDone >= chapter.units.length;

  const Tile = ({ label, value, color, i }) => (
    <Card className="hk-tile-enter" style={{ '--i': i, flex: 1, borderRadius: 16, padding: "13px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || t.ink, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginTop: 4 }}>{label}</div>
    </Card>
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "18px 22px 22px", textAlign: "center", overflowY: "auto" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Cat mood={passed ? "celebrate" : "sad"} size={150} style={{ marginBottom: 2 }} className="hk-scale-in" />
        <p style={{ margin: "6px 0 0", fontSize: 12.5, letterSpacing: "0.14em", fontWeight: 900, color: passed ? t.done : t.primary }}>
          {passed ? (isGraduation ? "COURSE COMPLETE" : isScenesUnlock ? "SCENES UNLOCKED" : isUnit ? "UNIT COMPLETE" : "PRACTICE COMPLETE") : "KEEP PRACTISING"}
        </p>
        <h1 style={{ margin: "2px 0 0", fontSize: 27, fontWeight: 800, color: t.ink, letterSpacing: "-0.02em" }}>
          {isGraduation ? "You can read Japanese." : (passed ? "You nailed it!" : "Almost there!")}
        </h1>
        <p style={{ margin: "5px 0 0", fontSize: 14.5, color: t.sub, fontWeight: 600 }}>
          {isUnit
            ? (isGraduation
                ? "The whole course, done. First kanji await."
                : <><span style={{ fontFamily: JP, fontWeight: 700 }}>{unit.jp}</span> &nbsp;{chapter.name} · {unit.label}</>)
            : `Practice session · ${total} questions`}
        </p>

        <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 18 }}>
          <Tile label="XP earned" value={`+${xp}`} color={t.gold} i={0} />
          <Tile label="Accuracy" value={`${acc}%`} color={passed ? t.done : t.wrong} i={1} />
          <Tile label="Correct" value={`${correct}/${total}`} i={2} />
        </div>

        {isUnit && (
          <Card style={{ width: "100%", marginTop: 16, borderRadius: 16, padding: "14px 16px", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{chapter.name} progress</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.done }}>{newDone}/{chapter.units.length}</span>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: t.sunk, overflow: "hidden" }}>
              <div className="hk-grow" style={{ "--to": `${cpct}%`, height: "100%", borderRadius: 5, background: t.done }} />
            </div>
          </Card>
        )}
      </div>

      <div style={{ display: "grid", gap: 10, flexShrink: 0, marginTop: 16 }}>
        {isUnit ? (
          isGraduation ? (
            <>
              <Button color={t.done} onClick={onReadingGrad} style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16.5 }}>
                Explore Scenes →
              </Button>
              <Button variant="soft" color={t.ink} onClick={onDone} style={{ width: "100%", padding: "15px", borderRadius: 16, fontSize: 15.5 }}>
                Back to home
              </Button>
            </>
          ) : (
            <>
              {!passed && (
                <Button variant="soft" color={t.ink} onClick={onReview} style={{ width: "100%", padding: "15px", borderRadius: 16, fontSize: 15.5 }}>
                  Try again
                </Button>
              )}
              <Button color={passed ? t.done : t.primary} onClick={onDone} style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16.5 }}>
                {passed ? "Continue →" : "Back to home"}
              </Button>
              {isScenesUnlock && (
                <Button variant="soft" color={t.ink} onClick={onReadingGrad} style={{ width: "100%", padding: "15px", borderRadius: 16, fontSize: 15.5 }}>
                  Explore Scenes →
                </Button>
              )}
            </>
          )
        ) : (
          <>
            {/* practice rounds: another round with the same settings, or finish */}
            <Button onClick={onKeepGoing} style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16.5 }}>
              Keep going →
            </Button>
            <Button variant="soft" color={t.ink} onClick={onFinish} style={{ width: "100%", padding: "15px", borderRadius: 16, fontSize: 15.5 }}>
              Finish
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Result(props) {
  return <Shell nav={false}><ResultBody {...props} /></Shell>;
}

