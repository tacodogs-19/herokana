import React from "react";

// Branded launch screen, held for a minimum ~2.2s so it always shows even when
// the app loads instantly. Mirrors the static splash in index.html (off-white
// to match the loading video) so the hand-off from HTML to React is seamless.
export default function Splash() {
  const [show, setShow] = React.useState(true);
  const [fading, setFading] = React.useState(false);

  React.useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1800);
    const t2 = setTimeout(() => setShow(false), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, height: "100dvh", zIndex: 3000, background: "#f7f7f7",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
      opacity: fading ? 0 : 1, transition: "opacity 380ms ease", pointerEvents: fading ? "none" : "auto" }}>
      <video src="/assets/cat-loading.mp4" autoPlay loop muted playsInline
        style={{ width: 200, height: 200, objectFit: "contain" }} />
      <span style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 21, fontWeight: 800,
        letterSpacing: "-0.02em", color: "#1e2540" }}>HeroKana</span>
      <span style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 13, fontWeight: 600,
        letterSpacing: "0.04em", color: "#71789a" }}>Loading…</span>
    </div>
  );
}
