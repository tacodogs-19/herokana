import React from "react";
import { useTheme, DISPLAY } from "../theme.jsx";
import { useProgress } from "../store.jsx";
import { Shell, Ring, Modal, Text, Card, Button } from "../components/chrome.jsx";
import { downloadBackup, inspectBackup, applyBackup } from "../backup.js";

function ProfileBody({ onEditProfile, onReset }) {
  const { t, mode, setMode, followsSystem, followSystem } = useTheme();
  const p = useProgress();
  const xpPct = Math.min(100, Math.round((p.xp / p.xpToNext) * 100));
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const maxW = Math.max(...p.weekBars, 1);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [restore, setRestore] = React.useState(null); // { ok, parsed, exportedAt, version } | { ok:false, error }
  const fileRef = React.useRef(null);

  const onPickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    file.text().then((text) => setRestore(inspectBackup(text)))
      .catch(() => setRestore({ ok: false, error: "Couldn't read that file." }));
  };

  const SettingRow = ({ label, sub, danger, onClick }) => (
    <Card as="button" onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: danger ? t.wrong : t.ink, fontFamily: DISPLAY }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 600, fontFamily: DISPLAY, marginTop: 2 }}>{sub}</div>}
      </div>
      <span style={{ color: t.faint, fontSize: 18, flexShrink: 0 }}>›</span>
    </Card>
  );

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 20px calc(94px + env(safe-area-inset-bottom))" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <img src="/assets/cat-header.png" alt="" aria-hidden="true" style={{ width: 28, height: 28, flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>Profile</h1>
      </header>

      {/* overall + level */}
      <Text variant="eyebrow" color={t.ink} style={{ margin: "0 0 11px" }}>YOUR PROGRESS</Text>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, background: t.surface, border: "none", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: t.cardShadow }}>
          {(() => {
            const hardPct = p.bankedTotal > 0 ? Math.round((p.hardDoneTotal / p.bankedTotal) * 100) : 0;
            return (
              <Ring size={100} stroke={10} pct={p.overallPct} color={p.hard ? t.sunk : t.primary} track={t.sunk}
                pct2={p.hard ? hardPct : undefined} color2={t.gold}>
                <div style={{ textAlign: "center", lineHeight: 1 }}>
                  {p.hard ? (
                    <>
                      <div style={{ fontSize: 23, fontWeight: 800, color: t.gold }}>{hardPct}<span style={{ fontSize: 12 }}>%</span></div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: t.gold, letterSpacing: "0.06em", marginTop: 2 }}>HARD</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 23, fontWeight: 800, color: t.ink }}>{p.overallPct}<span style={{ fontSize: 12 }}>%</span></div>
                  )}
                </div>
              </Ring>
            );
          })()}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>{p.totalDone}/{p.totalUnits} units</div>
            {p.hard
              ? <div style={{ fontSize: 11.5, color: t.gold, fontWeight: 700 }}>hard {p.hardDoneTotal}/{p.bankedTotal} re-mastered</div>
              : <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 600 }}>syllabary mapped</div>}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: t.surface, border: "none", borderRadius: 20, padding: "14px 15px", flex: 1, boxShadow: t.cardShadow }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: t.sub }}>Level</span>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: t.goldSoft, color: t.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>{p.level}</span>
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, color: t.ink, margin: "4px 0 8px" }}>{p.xp} XP</div>
            <div style={{ height: 6, borderRadius: 4, background: t.sunk, overflow: "hidden" }}>
              <div style={{ width: `${xpPct}%`, height: "100%", borderRadius: 4, background: t.gold }} />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 10.5, color: t.faint }}>{p.xpToNext - p.xp} XP to Level {p.level + 1}</p>
          </div>
          <div style={{ background: t.surface, border: "none", borderRadius: 20, padding: "12px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: t.cardShadow }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.sub }}>Accuracy</span>
            <span style={{ fontSize: 19, fontWeight: 800, color: t.done }}>{p.accuracy}%</span>
          </div>
        </div>
      </div>

      {/* weekly activity */}
      <div style={{ background: t.surface, border: "none", borderRadius: 20, padding: "15px 17px 13px", marginBottom: 72, boxShadow: t.cardShadow }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: t.ink, whiteSpace: "nowrap" }}>This week</span>
          <span style={{ fontSize: 12, color: t.sub, fontWeight: 600, whiteSpace: "nowrap" }}>{p.weekBars.reduce((a, b) => a + b, 0)} lessons practised</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 9, height: 78 }}>
          {p.weekBars.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", height: `${(v / maxW) * 100}%`, minHeight: 6, borderRadius: 6,
                background: i === p.todayIdx ? t.primary : t.primarySoft }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: i === p.todayIdx ? t.primary : t.faint }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* settings */}
      <Text variant="eyebrow" color={t.ink} style={{ margin: "60px 0 11px" }}>SETTINGS</Text>
      <div style={{ display: "grid", gap: 10 }}>
        {/* Hard mode — unlocks once the whole track is complete. Also shown while
            hard is ON even if new appended chapters un-completed the track, so a
            learner is never stuck in hard mode with no way to toggle off. */}
        {(p.trackComplete || p.hard) ? (
          <button onClick={() => p.setHard(!p.hard)} className="hk-press"
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16, cursor: "pointer",
              background: p.hard ? t.primarySoft : t.surface, border: "none", boxShadow: t.cardShadow, textAlign: "left" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: t.ink, fontFamily: DISPLAY }}>Hard mode</div>
              <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 600, fontFamily: DISPLAY, marginTop: 2 }}>
                {p.hard ? `Words & sentences · ${p.hardDoneTotal}/${p.bankedTotal} re-mastered` : "Replay words & sentences — English answers, no hints"}
              </div>
            </div>
            <span style={{ width: 44, height: 26, borderRadius: 13, flexShrink: 0, position: "relative",
              background: p.hard ? t.primary : t.line, transition: "background 160ms" }}>
              <span style={{ position: "absolute", top: 3, left: p.hard ? 21 : 3, width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left 160ms", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
            </span>
          </button>
        ) : (
          <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16,
            background: t.surface, border: "none", boxShadow: t.cardShadow, opacity: 0.7 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: t.ink, fontFamily: DISPLAY }}>Hard mode</div>
              <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 600, fontFamily: DISPLAY, marginTop: 2 }}>Finish the whole track to unlock</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.faint} strokeWidth="2.2" style={{ flexShrink: 0 }}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          </div>
        )}
        {/* Theme: Auto follows the device; Light/Dark pins a manual choice */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16,
          background: t.surface, border: "none", boxShadow: t.cardShadow }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: t.ink, fontFamily: DISPLAY }}>Theme</div>
            <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 600, fontFamily: DISPLAY, marginTop: 2 }}>
              {followsSystem ? "Following your phone's setting" : `Pinned to ${mode}`}
            </div>
          </div>
          <div style={{ display: "flex", background: t.seg, borderRadius: 12, padding: 3, flexShrink: 0 }}>
            {[{ id: "auto", label: "Auto" }, { id: "light", label: "Light" }, { id: "dark", label: "Dark" }].map((o) => {
              const on = followsSystem ? o.id === "auto" : o.id === mode;
              return (
                <button key={o.id} onClick={() => (o.id === "auto" ? followSystem() : setMode(o.id))} className="hk-press"
                  style={{ padding: "7px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                    background: on ? t.surface : "transparent", color: on ? t.ink : t.sub,
                    boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                    fontSize: 12.5, fontWeight: on ? 800 : 600 }}>{o.label}</button>
              );
            })}
          </div>
        </div>
        <SettingRow label="Edit your details" sub="Personalise your experience" onClick={onEditProfile} />
        <SettingRow label="Back up progress" sub="Save a file you can keep or move to another device" onClick={downloadBackup} />
        <SettingRow label="Restore from backup" sub="Load progress from a backup file" onClick={() => fileRef.current && fileRef.current.click()} />
        <SettingRow label="Reset progress" sub="Clears chapter progress · keeps your XP and level" danger onClick={() => setConfirmReset(true)} />
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onPickFile} style={{ display: "none" }} />
      </div>

      {restore && (
        <Modal onDismiss={() => setRestore(null)}>
          <div style={{ background: t.surface, border: "none", borderRadius: 20, padding: "20px 20px 18px", boxShadow: t.cardShadow }}>
            {restore.ok ? (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>Restore this backup?</div>
                <div style={{ fontSize: 13.5, color: t.sub, fontWeight: 600, margin: "6px 0 16px", fontFamily: DISPLAY, lineHeight: 1.45 }}>
                  This replaces your current progress with the backup{restore.exportedAt ? ` from ${restore.exportedAt.slice(0, 10)}` : ""}. This can't be undone.
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <Button onClick={() => setRestore(null)} style={{ width: "100%", padding: "14px", borderRadius: 14, fontSize: 15 }}>Cancel</Button>
                  <Button variant="outline" color={t.ink} onClick={() => { applyBackup(restore.parsed); window.location.reload(); }}
                    style={{ width: "100%", padding: "13px", borderRadius: 14, fontSize: 14.5 }}>Restore &amp; reload</Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>Couldn't restore</div>
                <div style={{ fontSize: 13.5, color: t.sub, fontWeight: 600, margin: "6px 0 16px", fontFamily: DISPLAY, lineHeight: 1.45 }}>{restore.error}</div>
                <Button onClick={() => setRestore(null)} style={{ width: "100%", padding: "14px", borderRadius: 14, fontSize: 15 }}>OK</Button>
              </>
            )}
          </div>
        </Modal>
      )}

      {confirmReset && (
        <Modal onDismiss={() => setConfirmReset(false)}>
          <div style={{ background: t.surface, border: "none", borderRadius: 20, padding: "20px 20px 18px", boxShadow: t.cardShadow }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.ink, fontFamily: DISPLAY }}>Reset all progress?</div>
            <div style={{ fontSize: 13.5, color: t.sub, fontWeight: 600, margin: "6px 0 16px", fontFamily: DISPLAY, lineHeight: 1.45 }}>
              Every chapter goes back to zero. Your {p.xp} XP and Level {p.level} stay.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <Button onClick={() => setConfirmReset(false)} style={{ width: "100%", padding: "14px", borderRadius: 14, fontSize: 15 }}>Cancel</Button>
              <Button variant="outline" color={t.wrong} onClick={() => { onReset(); setConfirmReset(false); }}
                style={{ width: "100%", padding: "13px", borderRadius: 14, fontSize: 14.5 }}>Reset progress</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Profile({ onNav, onEditProfile, onReset }) {
  return <Shell active="Profile" onNav={onNav}><ProfileBody onEditProfile={onEditProfile} onReset={onReset} /></Shell>;
}
