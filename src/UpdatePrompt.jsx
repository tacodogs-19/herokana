import React from "react";
import { registerSW } from "virtual:pwa-register";
import { useTheme, DISPLAY } from "./theme.jsx";
import { Modal } from "./components/chrome.jsx";

// Watches for a newer deployed build and offers a one-tap update. Checks on
// launch, whenever the (installed) app is brought back to the foreground, and
// hourly — so an updated source reaches installed Android PWAs.
export default function UpdatePrompt() {
  const { t } = useTheme();
  const [show, setShow] = React.useState(false);
  const update = React.useRef(() => {});

  React.useEffect(() => {
    update.current = registerSW({
      onNeedRefresh() { setShow(true); },
      onRegisteredSW(_url, r) {
        if (!r) return;
        const check = () => r.update().catch(() => {});
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
        setInterval(check, 60 * 60 * 1000);
      },
    });
  }, []);

  if (!show) return null;
  return (
    <Modal position="bottom" onDismiss={() => setShow(false)}>
      <div style={{ background: t.surface, color: t.ink, border: "none", borderRadius: 20,
        padding: "16px 18px", fontFamily: DISPLAY, boxShadow: t.cardShadow }}>
        <div style={{ fontSize: 15.5, fontWeight: 800 }}>A new version is available</div>
        <div style={{ fontSize: 13, color: t.sub, fontWeight: 600, margin: "4px 0 14px" }}>
          Update now to get the latest HeroKana.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShow(false)} className="hk-press"
            style={{ flex: 1, padding: "12px", borderRadius: 13, border: `1.5px solid ${t.line}`, background: t.surface,
              color: t.ink, fontFamily: DISPLAY, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
            Not now
          </button>
          <button onClick={() => { setShow(false); update.current(true); }} className="hk-press"
            style={{ flex: 1, padding: "12px", borderRadius: 13, border: "none", background: t.primary,
              color: "#fff", fontFamily: DISPLAY, fontSize: 14, fontWeight: 800, cursor: "pointer",
              boxShadow: t.glow(t.primary) }}>
            Update now
          </button>
        </div>
      </div>
    </Modal>
  );
}
