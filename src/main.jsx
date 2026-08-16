import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./theme.jsx";
import { ProgressProvider } from "./store.jsx";
import App from "./App.jsx";
import UpdatePrompt from "./UpdatePrompt.jsx";
import WhatsNew from "./WhatsNew.jsx";
import { initAnalytics } from "./analytics.js";
import "./styles.css";

initAnalytics();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <ProgressProvider>
        <App />
        <UpdatePrompt />
        <WhatsNew />
      </ProgressProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// Fade out the in-page splash once React has painted, but keep it up for at
// least a second so the settle animation reads and it doesn't flash on fast
// loads. performance.now() here is ms since navigation start.
const splash = document.getElementById("splash");
if (splash) {
  const wait = Math.max(0, 1000 - performance.now());
  setTimeout(() => {
    splash.classList.add("hk-splash-hide");
    setTimeout(() => splash.remove(), 450);
  }, wait);
}
