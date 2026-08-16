import React from "react";
import { registerSW } from "virtual:pwa-register";

// Registers the service worker and checks for a newer build on launch, when the
// app returns to the foreground, and hourly. A new build installs in the
// background and WAITS (no skipWaiting), so it applies automatically on the next
// cold launch — the app is never swapped out mid-session, and there's no update
// prompt. (Owner call: the prompt only ever triggered a reload; letting the
// waiting worker take over on next launch does the same thing invisibly.)
export default function UpdatePrompt() {
  React.useEffect(() => {
    registerSW({
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
  return null;
}
