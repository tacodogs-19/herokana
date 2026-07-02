import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./theme.jsx";
import { ProgressProvider } from "./store.jsx";
import App from "./App.jsx";
import UpdatePrompt from "./UpdatePrompt.jsx";
import WhatsNew from "./WhatsNew.jsx";
import "./styles.css";

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
