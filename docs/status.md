# HeroKana — Status & Baseline

Snapshot of what exists so a fresh session can resume without re-deriving the baseline.
**As of:** 2026-06-20 · **App version:** `1.5.0` (see [`src/release.js`](../src/release.js)).

> Update this file when the baseline changes — it is the "where are we" anchor after a `/clear`.

## Built and working

The app is a complete, shippable PWA. All core flows are implemented:

- **Onboarding** — 6-step skippable wizard; saves a profile that personalises Sentences.
- **Home (Learn)** — chapter rail (map), focus card with progress ring, Continue / unit-jump,
  expandable "what's in this chapter", per-chapter lock/current/done states. Sentences chapter shows a
  "sentence basics" entry point. Hard-mode pill appears once the track is complete.
- **Lesson engine** — multiple-choice and typed questions, kana / phrase / concept types, hints &
  meaning reveal, TTS ("Hear it" + listening mode), speed-round timer, segmented progress, correct/wrong
  feedback, confirm-before-exit. Fixed-height layout slots prevent shift.
- **Result** — pass/fail (cat mascot), XP/accuracy/correct tiles, chapter progress bar, contextual
  next actions (try again / continue / keep going / finish).
- **Practice** — build-a-custom-set (Alphabet / Words / Numbers tabs, theme picker, difficulty,
  answer language, round size) + four practice modes (Quick review, Weak spots, Speed, Listening) +
  Sentence foundations and a basics overview.
- **Profile** — overall %, level/XP, accuracy, weekly activity bars, per-chapter progress, hard-mode
  toggle (when unlocked), edit details, reset progress (keeps XP) with confirm dialog.
- **Theming** — hand-tuned light/dark, pre-paint resolution, live `theme-color` updates.
- **PWA** — installable, offline via service worker, prompt-based updates (`UpdatePrompt`), one-time
  "What's new" after an update (`WhatsNew`), branded splash (static HTML + React handoff).
- **Content** — Hiragana, Katakana, voiced, combination kana; 14 word/phrase themes; 11 sentence
  themes; 4 complex-sentence themes; number ranges; grammar foundations. Every banked theme has 25+ items.

## In progress

- Nothing actively mid-change in code as of this snapshot. (When you start a task, note it here.)

## Known issues / risks

- **Design rule drift — mascot.** The cat appears in onboarding and on the splash, contradicting the
  "icon + results only" rule. See the divergence list in [design-system.md](design-system.md#divergences-from-intended-design-flagged).
  Needs an owner decision (expand the rule, or remove the cats).
- **No automated tests, linter, or type checking.** Nothing guards regressions; all verification is
  manual in the browser. Positional chapter/unit indexing (see [content-model.md](content-model.md))
  is the highest-risk area to change without tests.
- **TTS quality is device-dependent.** Pronunciation relies on the OS Japanese voice; devices without
  one get poor or no audio, with no bundled fallback.
- **`manifest.theme_color` hardcoded to light bg** — cosmetic; runtime overrides it after launch.
- **Dead keyframe** `hkBreathe` in `styles.css`.
- **Build path quirk on this machine** — the project path has a space; `vite.config.js` sets
  `server.fs.strict: false` and `dev.cmd` shims the preview launcher. Don't "tidy" these away
  (see [decisions.md](decisions.md)).

## Planned / likely next (not committed)

No formal roadmap file exists. Candidate work, inferred from structure — confirm with the owner before
building:

- Resolve the mascot divergence.
- Introduce a lightweight test setup before any change to the content/indexing model.
- Possible SRS / spaced-repetition scheduling (currently practice is random/weakness-weighted only).
- Extending weak-spots to include banked (phrase/sentence) misses, which are already recorded.

## Release procedure (reminder)

Bump `VERSION` and edit `RELEASE_NOTES` in [`src/release.js`](../src/release.js) → `npm run build` →
deploy `dist/`. Installed clients see the update prompt; on accept they get the new build and the
"What's new" dialog once. See [decisions.md](decisions.md) for why updates are prompt-gated.
