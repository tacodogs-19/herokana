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
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        // Dialogue clips (public/audio/*.mp3, ~1.3MB) must precache so
        // Conversations keep their audio offline.
        globPatterns: ["**/*.{js,css,html,svg,png,mp3}"],
        // Don't intercept /.well-known/ — Android's asset link verifier fetches
        // assetlinks.json as a plain HTTP request (not via the SW), but excluding
        // it here also lets the file load correctly in a browser for verification.
        navigateFallbackDenylist: [/^\/.well-known\//, /^\/privacy/],
      },
      manifest: {
        id: "/",
        name: "HeroKana",
        short_name: "HeroKana",
        description: "Learn Japanese kana, one focused unit at a time",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        dir: "ltr",
        lang: "en",
        categories: ["education"],
        prefer_related_applications: false,
        background_color: "#F3F5FA",
        // Light default; the runtime swaps the live theme-color meta per theme so
        // the standalone status bar matches the app in both light and dark.
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
  test: { environment: "node" },
});
