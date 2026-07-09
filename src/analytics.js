// Privacy-first funnel analytics — FREE WEB build only.
//
// Cookieless, no accounts, no PII: just anonymous milestone counts so we can
// finally see WHERE learners stall (which chapter they quit at) instead of
// guessing. The installed paid Android app stays completely dark — we never
// load the script in standalone / TWA mode, so the Play "no data collected"
// declaration is untouched.
//
// No-op unless VITE_PLAUSIBLE_DOMAIN is set at build time, so dev and any
// un-configured build send nothing. Default endpoint is Plausible Cloud;
// point VITE_PLAUSIBLE_SRC at a self-hosted Plausible/Umami to swap vendor.
//
// ponytail: a 3rd-party cookieless beacon, not a backend. No SW caching, no
// consent banner (nothing personal stored). Upgrade path if we ever want
// self-hosted: change the two env vars, no code.

const DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
const SRC = import.meta.env.VITE_PLAUSIBLE_SRC
  || "https://plausible.io/js/script.tagged-events.js";

// True inside an installed PWA / Android TWA — where we must NOT track.
const installed = () =>
  (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
  window.navigator.standalone === true ||
  document.referrer.startsWith("android-app://");

let ready = false;

export function initAnalytics() {
  if (ready || !DOMAIN || installed()) return; // web build only, once
  ready = true;
  // Plausible stub: queues events fired before the script finishes loading.
  window.plausible = window.plausible
    || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  const s = document.createElement("script");
  s.defer = true;
  s.dataset.domain = DOMAIN;
  s.src = SRC;
  document.head.appendChild(s); // auto-fires the pageview = "visited"
}

export function track(event, props) {
  if (ready) window.plausible && window.plausible(event, props ? { props } : undefined);
}
