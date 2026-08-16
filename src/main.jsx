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

// Fade out the in-page splash once React has painted the first screen.
// State is all synchronous (localStorage), so a short beat is enough.
const splash = document.getElementById("splash");
if (splash) {
  setTimeout(() => {
    splash.classList.add("hk-splash-hide");
    setTimeout(() => splash.remove(), 450);
  }, 200);
}
