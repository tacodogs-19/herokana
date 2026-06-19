# HeroKana — Decision Log

A running record of significant choices and *why*, including approaches tried and ruled out, so they
are not relitigated. Newest at the top. When you make a non-obvious call, add an entry.

---

## Product / UX

### No streaks
Streak mechanics are deliberately excluded. The product favours low-pressure, calm learning over
daily-obligation loops. Progress is shown as completion %, XP/level, and a non-judgmental weekly
activity chart. **Do not add streaks, daily goals, or loss-aversion nudges.**

### Mascot is rationed
The cat sticker set is intended to appear only on the app icon and the result screen, to keep the UI
from feeling toy-like. (Note: code currently also uses it in onboarding and the splash — see the
[design-system divergences](design-system.md#divergences-from-intended-design-flagged); this is an
open item, not an endorsed expansion.)

### Reset keeps XP
"Reset progress" clears chapter/unit completion but intentionally preserves XP and level, so a learner
restarting the syllabary doesn't feel they've lost everything.

### Hard mode is a second pass, gated on completion
Hard mode only unlocks after the whole track is complete, applies only to banked content
(words/sentences — kana are considered mastered), answers in English with no hints, and tracks
separately (`hardDone`) for bonus XP. Rationale: a meaningful "new game+" rather than a difficulty
toggle that fragments early progress.

### 80% pass threshold
A unit is marked complete at ≥80% correct, not 100% — enough to demonstrate competence without
punishing one slip.

### Personalised sentences from onboarding
Rather than only generic example sentences, the Sentences "About me" and "Likes" units are generated
from the onboarding profile (name, age, country, pets, occupation, hobbies). Onboarding is fully
skippable; skipping falls back to the static banks. Rationale: relevance aids retention; skippability
avoids a hard gate on first run.

## Question design

### Distractors can't be solved by first-letter spotting
Kana multiple-choice (`withKanaOptions`) deliberately seeds options that share the answer's initial
(or row, for irregular romaji like chi/tsu) so learners must actually recognise the glyph. Banked
distractors are drawn from the same bank so wrong answers are plausibly similar. Don't replace this
with random sampling.

### Lenient typed answers
Hard/typed questions normalise case, spacing, and punctuation and accept **either** romaji or English.
Rationale: test recall of meaning, not exact transcription or input-method quirks.

### Practice modes are kana-only
The four practice modes draw only from learned kana (banked chapters excluded), falling back to the
first hiragana row if nothing is learned. Custom sets and the Numbers tab cover banked/number practice.

## Architecture / tech

### No router, no state library, no CSS framework
Navigation is a `useState` screen object in [`App.jsx`](../src/App.jsx); shared state is two React
contexts (`ProgressProvider`, `ThemeProvider`); styling is inline `style={}` objects reading from the
theme, plus a tiny `styles.css`. Rationale: the app is small and single-window; pulling in
react-router / a store / Tailwind would add weight and indirection for no benefit. Keep new code in
this idiom unless the app grows materially.

### All state in localStorage, no backend
HeroKana is fully client-side; there is no server, account, or sync. Progress, profile, theme, and
settings live in `localStorage`/`sessionStorage` (keys catalogued in
[content-model.md](content-model.md)). Trade-off accepted: no cross-device sync, but zero infra and
full offline use.

### Positional chapter/unit identity
Progress is stored as index-aligned arrays rather than keyed by id. `fitLen` tolerates length changes
(append/remove) on load, but **reordering silently corrupts existing progress**. Chosen for simplicity;
the mitigation is to append, not reorder. Documented in [content-model.md](content-model.md).

### Android hardware-back handling
`App.jsx` buffers a `history.pushState` entry and an `onpopstate` handler decides whether a back
gesture navigates within the app (lesson→home, wizard step back, etc.) or lets the installed PWA close.
This is the standard way to make a single-page PWA respect the Android back button; onboarding registers
its own step-back via `registerBack`.

### Progress is provider-owned; `completeLesson` is the only writer
All mutations to learner progress go through `completeLesson` / `setHard` / `resetProgress` in
`store.jsx`, with a single `useEffect` persisting to localStorage. Keeps persistence and derivation in
one place; don't write progress keys from screens.

## PWA

### Updates are prompt-gated, never silent
`vite.config.js` uses `registerType: "prompt"` with `skipWaiting: false` / `clientsClaim: false`. A new
build installs in the background and **waits**; `UpdatePrompt` offers a one-tap update that the learner
must accept. Rationale: never swap the app out mid-lesson. `UpdatePrompt` also re-checks for updates on
launch, on foreground (`visibilitychange`), and hourly, so installed Android PWAs actually discover new
builds. Don't set `skipWaiting: true` without revisiting this.

### Pre-paint theme + live `theme-color` swap
The theme is resolved by an inline script in `index.html` before first paint (prevents a wrong-colour
status-bar flash), and `theme.jsx` *replaces* the `theme-color` meta node on every theme change so
Chrome recolours the installed status bar live (mutating it in place didn't trigger a re-read). Keep
the `index.html` fallback hexes in sync with the palette.

### Two-stage splash with min display time
A static `#hk-splash` in `index.html` shows instantly (before React), and `Splash.jsx` renders the same
visual after mount, held ~2.2s minimum so it never flickers on fast loads. Backgrounds use the loading
video's off-white (`#f7f7f7`) for a seamless HTML→React handoff.

## Local environment (this machine)

### Space-in-path workarounds for the preview launcher
The project path contains a space (`C:\Users\Nebula PC\herokana`). Two accommodations exist and should
**not** be removed:
- `vite.config.js` sets `server.fs.strict: false` because the Claude preview launcher starts Vite via
  an 8.3 short path (`C:\Users\NEBULA~1`) that Vite's strict fs allowlist rejects.
- `dev.cmd` `cd`s into the real long path before `npm run dev`, working around the launcher's inability
  to spawn executables from space-containing paths. `.claude/launch.json` points at it.

(Note: `dev.cmd` / `launch.json` reference the path as `HeroKana` while the folder is `herokana` —
harmless on case-insensitive Windows, intentionally left as-is.)

## Documentation

### Docs split: lean CLAUDE.md + topic files under docs/
[`CLAUDE.md`](../CLAUDE.md) is kept as a lean index (stack, architecture overview, commands,
conventions, hard rules) and links out to `docs/design-system.md`, `docs/content-model.md`,
`docs/status.md`, and this file. The content/data model was split out because `data.js`/`questions.js`
carry too much domain detail to inline. Rationale: keep the always-loaded context small while making
the full baseline resumable after a `/clear`.
