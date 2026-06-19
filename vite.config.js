import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["assets/*.svg"],
      // A new build installs in the background and WAITS — it only activates
      // after the user accepts the "new version available" prompt. Without
      // skipWaiting the update is never applied silently.
      workbox: { skipWaiting: false, clientsClaim: false },
      manifest: {
        name: "HeroKana",
        short_name: "HeroKana",
        description: "Learn Japanese kana, one focused unit at a time",
        start_url: "/",
        display: "standalone",
        background_color: "#0b1121",
        // matches the app background so Chrome doesn't draw a divider
        // line under the status bar in the installed app
        theme_color: "#F3F5FA",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  // The preview launcher starts the dev server via an 8.3 short path
  // (C:\Users\NEBULA~1), which Vite's strict fs allowlist rejects.
  server: { fs: { strict: false } },
});
