# HeroKana — Status & Baseline

Snapshot of what exists so a fresh session can resume without re-deriving the baseline.
**As of:** 2026-06-28 · **App version:** `1.15.0` (see [`src/release.js`](../src/release.js)).

> Update this file when the baseline changes — it is the "where are we" anchor after a `/clear`.

## Built and working

The app is a complete, shippable PWA. All core flows are implemented:

- **Onboarding** — 6-step skippable wizard; saves a profile that personalises Sentences.
- **Home (Learn)** — chapter rail (map), focus card with progress ring, Continue / unit-jump,
  expandable "what's in this chapter", per-chapter lock/current/done states. Hiragana chapter shows a
  "Read the basics" pill (Kana basics explainer; label becomes "New to Japanese? Start here" on first
  run). Sentences chapter shows a paired secondary row under the CTA — "Read the basics" (the explainer)
  + "Practice particles" (launches the `foundations` grammar quiz). Hard-mode pill (rail kana collapse)
  only while hard mode is *on*; the pill itself appears once the track is complete.
- **Lesson engine** — multiple-choice and typed questions, kana / phrase / concept types, hints &
  meaning reveal, TTS ("Hear it" + listening mode), speed-round timer, segmented progress, correct/wrong
  feedback, confirm-before-exit. Fixed-height layout slots prevent shift.
- **Result** — pass/fail (cat mascot), XP/accuracy/correct tiles, chapter progress bar, contextual
  next actions (try again / continue / keep going / finish).
- **Practice** — build-a-custom-set (Alphabet / Words / Numbers tabs, theme picker, difficulty,
  answer language, round size) + four practice modes (Quick review, Weak spots, Speed, Listening) +
  Sentence foundations and a basics overview.
- **Kana chart** (v1.9.0) — passive reference (not a drill) opened from a card at the top of Practice.
  Full-screen screen ([`KanaChart.jsx`](../src/screens/KanaChart.jsx)): gojūon grid built from
  `HIRA`/`KATA` (46 base + voiced + combinations — only kana the app teaches), hiragana/katakana toggle,
  tap a cell to highlight + hear it. Routed via `App.jsx` (`kanaChart`) like other screens — so hardware
  back returns to Practice and the predictive-back preview snapshots it. The basics explainer was moved
  to the same routed model at the same time, for the same back-gesture reason (was previously a
  state-driven overlay the back stack skipped past). It is now the generic `Basics.jsx` screen, driven by
  props, serving both `kanaBasics` (Kana basics) and `sentenceBasics` (Sentence basics) routes.
- **Speaking practice** (v1.10.0) — production beat on every YOU line in Conversations
  ([`Dialogue.jsx`](../src/screens/Dialogue.jsx) `SpeakBeat`), activating the respond/role-play beat
  deferred in v1.7.0. Shadow-first (hear model → say it), with a capability ladder in
  [`speech.js`](../src/speech.js): native `useSpeechRecognition` (ja-JP) shows a gentle "we heard…"
  mirror via `looseMatch` (never a graded ✗) when present; else `useRecorder` (MediaRecorder) for
  record + play-back self-check; else shadow by ear. Always non-blocking — Next is always available.
  Zero backend, offline-first. Not yet added to Lesson (the optional "say it" word mode is deferred).
- **Portable backup + durable storage** (v1.10.0) — non-local data the client-only way, no account.
  [`backup.js`](../src/backup.js) exports/imports a JSON file (`exportData`/`downloadBackup` +
  `inspectBackup`/`applyBackup`) covering `hk-progress-v2` / `hk-profile-v1` / `hk-theme`, with a
  schema stamp (`BACKUP_SCHEMA`) guarding future-version files and the store's `fitLen` absorbing
  chapter drift. Backup/Restore live in Profile → Settings (restore confirms before overwriting).
  [`store.jsx`](../src/store.jsx) also requests `navigator.storage.persist()` for eviction resistance.
  Cloud/sync (rungs 3–4) deliberately deferred until multi-device demand appears.
- **Graceful audio fallback** (v1.9.0) — shared [`speech.js`](../src/speech.js) (`speak()` +
  `useJaVoice()`) replaces the three duplicated inline TTS helpers. The whole app now degrades when the
  device has no `ja-JP` voice instead of failing silently: Lesson hides "Hear it" and turns listening
  questions into readable ones; Practice's Listening mode tile is disabled ("Needs a Japanese voice");
  Conversations show a notice in [`ReadingPack.jsx`](../src/screens/ReadingPack.jsx); the Kana chart
  shows a "no sound" hint. (Recorded-clip fallback for hero content — "B-part-2" — still deferred.)
- **Profile** — overall %, level/XP, accuracy, weekly activity bars, hard-mode toggle (when unlocked),
  edit details, reset progress (keeps XP) with confirm dialog. (The per-chapter progress list was
  removed in v1.7.0 as redundant with Home's track — a richer progress snapshot may return on a subpage.)
- **Theming** — hand-tuned light/dark, pre-paint resolution, live `theme-color` updates.
- **PWA** — installable, offline via service worker, prompt-based updates (`UpdatePrompt`), one-time
  "What's new" after an update (`WhatsNew`), branded splash (static HTML + React handoff).
- **Content** — Hiragana, Katakana, voiced, combination kana; 14 word/phrase themes; 11 sentence
  themes; 4 complex-sentence themes; number ranges; grammar foundations. Every banked theme has 25+ items.
- **Read the Real World** (v1.6.0) — reading-fluency mode in the **Scenes tab** (4th bottom-nav
  tab, renamed from "Reading" in v1.7.0 once it grew to include conversations; internal screen/route
  names are still `reading*`). [`Reading.jsx`](../src/screens/Reading.jsx) hub +
  [`ReadingMode.jsx`](../src/screens/ReadingMode.jsx) drill, [`reading.js`](../src/reading.js). The tab
  is locked (with progress toward the gate) until the
  Words & phrases chapter is done, then lists eight packs across trip contexts (station, konbini,
  restaurant, signs, paying, café, hotel, airport). Silent timing → per-word speed reveal (with the
  romaji shown so you can check your reading) and mascot reaction → results (avg s/word + Done; the
  cat-run mascot). Speed bands are beginner-tuned (≤1.5s instant / 1.5–5s read / 5s+ slow). The hub is a
  **2-column grid of scene tiles** (glyph + place + New/In-progress/Done status); tapping one opens a
  **pack detail** ([`ReadingPack.jsx`](../src/screens/ReadingPack.jsx)) with the reading round + a
  Conversations list. Per-word times persist under `reading` in
  `hk-progress-v2`. Content is **real and curated** across all eight packs; new word lists swap into
  `READING_PACKS` without code changes. See [decisions.md](decisions.md).
- **Conversations** (v1.7.0) — audio dialogue comprehension inside reading packs
  ([`Dialogue.jsx`](../src/screens/Dialogue.jsx), [`dialogue.js`](../src/dialogue.js)). A near-scripted
  staff/you exchange plays as a building chat transcript via Web Speech TTS (two pitches for the two
  speakers); staff lines flagged `check` become "What are they asking?" 4-choice beats. **Comprehension
  only** for now — no respond/role-play beat. Difficulty is a **fading-scaffold dial** (Guided → Listen
  → Ear): one authored dialogue, the UI hides more text and speeds up TTS per level; the saved
  `clearedLevel` is the hardest level passed at ≥80%, and a run starts one level past it. Not timed
  (comprehension-paced); ends on accuracy + full transcript (reading reinforcement) + cat-run. **One
  dialogue per scene** (all 8 packs). Results persist under a new additive `dialogues` key. TTS quality
  is the known risk (device-dependent — see decisions).

- **Review** (v1.8.0, extended v1.11.0) — the calm retention loop (no streaks). A Leitner-lite
  scheduler in [`store.jsx`](../src/store.jsx) (`srs` key in `hk-progress-v2`,
  `STEP = [0, 3, 7, 21]` days): a miss in any lesson drops an item into the pool at box 0 (due today);
  a first-time correct answer enters the pool at box 1 (due in 3 days); subsequent correct reviews bump
  the box (7 → 21 days) until the item graduates out. `reviewQuestions` in
  [`questions.js`](../src/questions.js) rebuilds due items (kana / banked / numbers — concept items
  excluded) as easy multiple-choice. A “Ready to review” card on [`Home.jsx`](../src/screens/Home.jsx)
  shows only when items are due. See [decisions.md](decisions.md).
- **Weak spots now covers banked misses** (v1.8.0) — Practice's "Weak spots" mode replays every recorded
  miss (kana, words, sentences, numbers) ranked by frequency, not just kana; the misses were always in
  `progress.wrong` but the mode used to drop the banked ones. Shares `itemIndex`/`resolveKey` in
  [`questions.js`](../src/questions.js) with Review. Other modes stay kana-only (see
  [decisions.md](decisions.md)).
- **Practice leads with modes** (v1.8.0) — [`Practice.jsx`](../src/screens/Practice.jsx) now opens with
  the four one-tap modes (fixed `MODE_COUNT`, no picker); "Build a custom set" sits below under a plain
  section heading (no accordion), with its own "Questions per round" picker. Closes the three-item
  critique batch (Review, Weak-spots-banked, Practice flip).

- **Verb list** (v1.15.0) — passive reference screen opened from a card in Practice (alongside Kana chart). Lists 29 common N5/N4 verbs across three groups: RU verbs (ichidan), U verbs (godan), and Irregular. Tap any verb row to expand 4 conjugation tiles (Polite / Past / Te-form / Negative) and hear it via TTS. Implemented as [`VerbChart.jsx`](../src/screens/VerbChart.jsx), routed via `App.jsx` (`verbChart`), with the entry point in [`Practice.jsx`](../src/screens/Practice.jsx) using an `onOpenVerbChart` prop.
- **Kana row word reveal** (v1.14.0) — after each kana row lesson (all non-Review units in Hiragana, Katakana, Voiced, and Combination chapters), an unscored bonus card appears at the end of the lesson showing one real Japanese word the learner can already sound out. The card shows the word large (JP font), its reading broken into syllables, the English meaning, and a "Got it →" / "Finish →" button. Implemented as a `word_reveal` question type appended in `unitQuestions()` via a `KANA_ROW_WORDS` lookup table in [`questions.js`](../src/questions.js). The card is excluded from scoring and SRS pool — `correct/total` in the result screen reflect only the drilled kana questions.
- **Scenes teaser on Complex Sentences card** (v1.13.0) — when the learner reaches Complex Sentences (chapter 6) and Reading is already unlocked, a full-width "Explore Scenes →" soft-pill appears beneath the main CTA in the focus card. Updates to "Scenes · N of 8 done" once packs have been played. Implemented as a third conditional strip in [`Home.jsx`](../src/screens/Home.jsx), following the hira and sentence strip patterns. Uses `readingUnlocked` + `READING_PACKS` from [`reading.js`](../src/reading.js).
- **Graduation result screen** (v1.13.0) — completing the final unit of Complex Sentences with a passing score now triggers a dedicated graduation state in [`Result.jsx`](../src/screens/Result.jsx): "COURSE COMPLETE" label, "You can read Japanese." title, "All 7 chapters done. Time to use it." subline, green "Explore Scenes →" primary CTA, "Back to home" secondary. Wired via `onReadingGrad` prop → `replace({ name: "reading" })` in [`App.jsx`](../src/App.jsx) so Back from Scenes skips the result card.

## In progress

- **Play Store launch prep** (2026-07-02) — listing assets ready, awaiting Console setup:
  - `store/play-listing.md` — all listing copy + Console form answers (data safety, rating, target audience).
  - `store/feature-graphic.png` (1024×500) + `store/marketing/*.jpg` (captioned 1080×1920 frames of
    each screenshot — upload these to Play, not the raw shots) via `scripts/store-assets.mjs`
    (`npm run store-assets`; needs dev server + fresh `screenshots/`).
  - `npm run shots` regenerates screenshots **and asserts each captured state** (per-shot
    must/not text markers; exits non-zero on a wrong screen — this caught a real capture bug on
    first run).
  - `screenshots/` regenerated at 1080×1920 (exactly 9:16 — Play rejects >2:1; don't revert the
    360×640@3x viewport in `scripts/screenshots.mjs`). Script now clears `hk-home-sel` on load
    (v1.16 persistence was pinning the focus card to chapter 0) and solves the vowels lesson for a
    genuine pass on the results shot.
  - `public/privacy.html` — required-by-Play privacy policy (no-data-collected), served at
    `/privacy.html`; added to the SW `navigateFallbackDenylist`. **Not yet deployed** — needs a
    Netlify deploy before the URL goes into the Console.
  - **Signing keys (2026-07-02, confirmed against Play Console):**
    - **Upload keystore of record:** `Documents\HeroKana-play-signing-v2\HeroKana - Google Play
      package (1)\signing.keystore` (upload cert SHA-256 starts `AE:DE`). Every future AAB must be
      signed with this key ("Use mine" on pwabuilder.com; passwords in the adjacent
      `signing-key-info.txt`). Back it up off-machine. **Never commit it** — keystores live outside
      the repo.
    - The June keystore in `Documents\HeroKana-play-signing` / `Downloads` (cert `BB:9D…`) is
      **obsolete** — it never signed anything Play accepted.
    - Play App Signing re-signs releases with Google's key (`0B:0D…`); both `0B:0D` and `BB:9D`
      fingerprints are in `public/assetlinks.json` + `public/.well-known/assetlinks.json`. The
      `0B:0D` entry is the one that makes installed TWAs verify (full-screen, no URL bar).
    - Play package id: `app.netlify.herokana.twa`. Version code must increase each upload
      (v1 used code 1; next is 2).

## Known issues / risks

- **TWA system-bar seams — external, do not re-investigate (confirmed on-device 2026-07-02).**
  Two related behaviours, both outside our control:
  1. *Launch bars on Android 15+*: SDK 35+ apps are forced edge-to-edge and baked bar colours are
     ignored. Chrome 135+ draws the page under transparent bars (our `viewport-fit=cover` +
     safe-area padding already support it) but ships via gradual server-side rollout — devices it
     hasn't reached show black fallback bars. Verified: enabling the edge-to-edge entries in
     `chrome://flags` makes launch bars blend perfectly. Android ≤14 honours the baked colours
     (package v2: light `#F3F5FA`, dark `#0E1322`).
  2. *In-session theme toggle*: a TWA's bar treatment is set once at launch. Any mid-session
     theme-color change makes Chrome paint a protective status-bar strip that persists until the
     activity relaunches (verified: strip stays regardless of theme; relaunching in a
     system-matching theme clears it). No web/wrapper-side fix exists. Impact: only users who
     toggle theme mid-session, only until next launch. `theme.jsx` still replaces (not mutates)
     the meta node per design-system.md — correct for browser/PWA contexts even though TWAs
     ignore it.

- **Reading mode uses the cat** (per-word reveal + results) — sanctioned by the feature brief (see
  [decisions.md](decisions.md)). The rule now covers icon + splash + onboarding + results; reading
  mode's reveal moment sits closest to the sanctioned "results" use.
- **All eight reading packs are now at 14 words** (verified in `reading.js` — Station, Restaurant,
  Signs, Paying, Café, Hotel, and Airport all brought up to match Konbini). Reading rounds now draw a
  varying subset rather than always showing the whole list. Speed bands (`READING` constant) are
  beginner-tuned, not yet validated against real learner times.
- **No automated tests, linter, or type checking.** Nothing guards regressions; all verification is
  manual in the browser. Positional chapter/unit indexing (see [content-model.md](content-model.md))
  is the highest-risk area to change without tests.
- **TTS quality is device-dependent.** Pronunciation relies on the OS Japanese voice. As of v1.9.0 a
  *missing* voice degrades gracefully (see "Graceful audio fallback"), but a present-but-*poor* voice
  still sounds bad, and there's no bundled recorded fallback yet ("B-part-2").
- **`manifest.theme_color` hardcoded to light bg** — cosmetic; runtime overrides it after launch.
- **Dead keyframe** `hkBreathe` in `styles.css`.
- **Build path quirk on this machine** — the project path has a space; `vite.config.js` sets
  `server.fs.strict: false` and `dev.cmd` shims the preview launcher. Don't "tidy" these away
  (see [decisions.md](decisions.md)).

## Planned / likely next (not committed)

No formal roadmap file exists. No current candidates — confirm with the owner before starting new work.

## Release procedure (reminder)

Bump `VERSION` and edit `RELEASE_NOTES` in [`src/release.js`](../src/release.js) → `npm run build` →
deploy `dist/`. Installed clients see the update prompt; on accept they get the new build and the
"What's new" dialog once. See [decisions.md](decisions.md) for why updates are prompt-gated.
