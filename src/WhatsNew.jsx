import React from "react";
import { useTheme, DISPLAY } from "./theme.jsx";
import { Modal } from "./components/chrome.jsx";
import { VERSION, RELEASE_NOTES } from "./release.js";

// Shows release notes once after the app updates to a new version. Silent on a
// fresh install (records the version without showing anything).
export default function WhatsNew() {
  const { t } = useTheme();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    let last = null;
    try { last = localStorage.getItem("hk-version"); } catch (e) {}
    if (last && last !== VERSION) setShow(true);
    try { localStorage.setItem("hk-version", VERSION); } catch (e) {}
  }, []);

  if (!show) return null;
  return (
    <Modal onDismiss={() => setShow(false)}>
      <div style={{ background: t.surface, border: "none", borderRadius: 20, padding: "20px 20px 18px",
        fontFamily: DISPLAY, boxShadow: "none" }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.14em", fontWeight: 800, color: t.primary }}>WHAT'S NEW</p>
        <h2 style={{ margin: "6px 0 14px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>Fresh in HeroKana</h2>
        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          {RELEASE_NOTES.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.primary, marginTop: 7, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: t.sub, fontWeight: 600, lineHeight: 1.45 }}>{n}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setShow(false)} className="hk-press"
          style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: t.primary,
            color: "#fff", fontFamily: DISPLAY, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: t.glow(t.primary) }}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
