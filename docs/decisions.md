# HeroKana — Decision Log

A running record of significant choices and *why*, including approaches tried and ruled out, so they
are not relitigated. Newest at the top. When you make a non-obvious call, add an entry.

---

## Product / UX

### Kana intro — an on-ramp on the first chapter, not an onboarding lecture
The app dropped brand-new learners straight into "which sound is あ?" with no frame for *what kana is*
(sounds not letters, two sets, recognition not handwriting) — the most-exposed gap, since Hiragana is
the unskippable first chapter and Sentences had just gained its own "Read the basics" on-ramp.
- **Reused the existing pattern, didn't invent one.** A `KANA_BASICS` array ([`data.js`](../src/data.js))
  + a "Read the basics" soft pill on the Hiragana card, mirroring Sentences. The four cards map onto the
  kana chapters (kana=sounds / hira+kata / voiced+combos / read-don't-write).
- **Generalised the screen instead of duplicating it.** `SentenceBasics.jsx` became the prop-driven
  [`Basics.jsx`](../src/screens/Basics.jsx) (`title`/`intro`/`cards`), routed as both `kanaBasics` and
  `sentenceBasics` from [`App.jsx`](../src/App.jsx). One screen, two contents.
- **Discoverable, not forced.** Many learners already know what kana is, so it's a skippable pill, not an
  onboarding step or a popup. The one nudge: on first run (`firstUse`) the label reads "New to Japanese?
  Start here", reverting to "Read the basics" after. Reference (the Kana chart) still lives in Practice.

### Rail kana collapse follows hard mode on/off, not just unlock
The chapter rail hid the four kana chapters whenever hard mode was *unlocked* (`trackComplete`), even
with hard mode off — so a learner who finished the track lost kana from the rail permanently. Fixed to
key on `hard` (actively on) instead of `hardUnlocked`: kana stay on the rail when hard mode is off, and
collapse only while it's on (hard mode replays banked content only). The Hard-mode toggle pill still
appears on unlock regardless. Kana review otherwise lives in Practice (Quick review / custom / chart).

### Particles taught as a pre-sentence drill, not a chapter
"Add a particles lesson before Sentences" — shipped by **surfacing the existing `FOUNDATIONS` quiz**
(already ~70% particle questions, `kind: "foundations"`) as a "Practice particles" entry on the
Sentences card in [`Home.jsx`](../src/screens/Home.jsx), beside the existing "Read the basics".
- **No new chapter.** A real `particles` chapter would have to slot between `phrase` and `sentence`,
  but progress is positional index arrays (append-only) — inserting mid-spine corrupts saved progress
  (only fixable by hand-editing `hk-progress-v2`). A `foundations` session carries no positional
  progress, so it lives "before sentences" logically without touching the index arrays. Ruled out the
  chapter; reused the quiz.
- **IA: paired soft pills, not a second stacked bar.** The two warm-up entries (read + drill) share one
  `flex` row so the primary CTA stays the only anchor (see [design-system.md](design-system.md) "Soft
  entry pill"). Labels shortened to fit two-up at ~380px.
- **Wiring gotcha.** Home's `onStart` is `startUnit(ci, ui)` (chapter *indices*), not a session starter;
  the drill needed a new `onStartSession` prop wired to `App.jsx`'s `startPractice`. Passing a session
  object to `onStart` silently throws.

### Speaking practice — shadow-first, capability-gated (v1.10.0)
Bridges the "recognition-only" gap for *speaking* without a backend or shipped ASR model. Key calls:
- **It's the deferred Conversations beat, not new content.** Every YOU line becomes a "say it" beat,
  activating the respond/role-play beat deferred in v1.7.0 — reuses all eight packs' existing lines.
- **Shadow + self-check is the floor, scoring is not the goal.** Hear the model → say it. We chose
  *not* to build pronunciation grading: ja-JP matching is noisy, and a harsh "wrong" verdict fights the
  calm ethos. Native `SpeechRecognition` (when present) is a gentle **mirror** ("we heard…", `looseMatch`
  for a soft ✓ only — never a red ✗); without it, `MediaRecorder` gives record + play-back; without that,
  shadow by ear. Capability-gated like TTS (`useJaVoice`), so it degrades, never breaks. Always
  non-blocking. Cloud phoneme scoring (Azure/Google) is the deferred rung — only if evidence demands.

### Non-local data — portable backup, not a sync backend (v1.10.0)
Addresses the real fear behind "client-only = no sync": *losing weeks of progress*, not real-time
multi-device. Climbed the cheapest rungs that solve it while staying account-free and offline:
- **Export/import a JSON file** ([`backup.js`](../src/backup.js)) — the learner owns a portable backup,
  no server, no account. Schema-stamped so a future-version file is rejected cleanly; chapter drift is
  absorbed by the store's `fitLen`. This is exactly the scenario that makes the positional-index model
  risky, so the stamp + `fitLen` are the guard (and the long-deferred index test now earns its keep).
- **`navigator.storage.persist()`** for eviction resistance — the whole durability win for a few KB,
  so we **skipped the IndexedDB migration** (async complexity, no benefit at this size).
- **Cloud sync (rungs 3–4) deferred.** If multi-device demand appears, prefer the user's *own* cloud
  (Drive/Dropbox) or an account-less sync-code/encrypted BaaS over building auth — keeps the
  [CLAUDE.md](../CLAUDE.md) "no accounts" constraint intact.

### Spaced review — the calm retention loop (v1.8.0)
The app was forward-only: you advanced the track and earlier material quietly rotted, with no surface
to bring it back. Review closes that gap, deliberately as the *calm* alternative to streaks (the
substance streaks fake with pressure). Key calls:
- **Leitner-lite, not full SM-2.** Each item carries a box (0–3) and a `due` date (`STEP = [0,3,7,21]`
  days in [`store.jsx`](../src/store.jsx)). A miss drops the item into the pool at box 0 (due today); a
  first-time correct answer enters at box 1 (due in 3 days); subsequent correct reviews bump the box
  (7 → 21 days) until graduation. No scheduling library — ~30 lines over existing data. Upgrade to real
  SM-2 intervals only if evidence demands.
- **Pool seeds from all correct answers** (v1.11.0; previously miss-seeded only). Items answered
  correctly for the first time enter at box 1 so learners who ace a unit still get spaced reinforcement.
  Concept items are excluded (can't be rebuilt by `resolveKey`). The pool is still bounded — items
  graduate out after the 21-day box.
- **Additive persistence, no seed.** New `srs` key in `hk-progress-v2` via the existing `completeLesson`
  writer (no new writer, no migration beyond `srs: {}`). We **chose not to seed it from past `wrong`**:
  seeding both inflated the due count past what a session could resolve (old grammar-concept misses
  don't rebuild) and risked a huge first-run pile. The pool fills from new misses instead, so the due
  count always equals a real session.
- **Concept items excluded.** Grammar-foundation questions have no reviewable glyph/word identity, so
  [`Lesson.jsx`](../src/screens/Lesson.jsx) keeps them out of the `missed`/`solved` lists. Everything
  else (kana, banked, numbers) reconstructs in `reviewQuestions`.
- **Calm surface.** A “Ready to review” card on Learn ([`Home.jsx`](../src/screens/Home.jsx)) appears
  **only** when items are due (no zero-state nag), styled primary not alarm-red, and reuses the practice
  Result screen. Review is always easy multiple-choice.

### "Read the Real World" reading-fluency mode (v1.6.0)
A reading-speed mode drilling real Japan-trip vocabulary (station / konbini / restaurant), built to a
feature brief. Key calls:
- **A dedicated tab, unlocked after the words track** — *supersedes the brief's "not a new tab /
  reward node in the Track" model* after an owner review of the first build. It's positioned as a
  capstone: the 4th bottom-nav tab ([`Reading.jsx`](../src/screens/Reading.jsx)) is always visible but
  shows a locked state (with progress toward the gate) until the **Words and phrases** chapter is
  complete. Rationale: a single clean gate, a dedicated home with room to grow (audio / typing variants
  later), and a less cluttered Home. Trade-off accepted: later access than the original
  "help beginners read faster" framing — tune `READING_UNLOCK` in [`reading.js`](../src/reading.js) to
  an earlier chapter (e.g. `"kata"`) to loosen it. The earlier Home entry points (Track reward nodes +
  "Daily reading" card) were **removed**.
- **Gating reuses `progress.done`, not a parallel system.** `readingUnlocked(progress)` checks the
  `READING_UNLOCK` chapter is fully done. The locked tab is the only conditional-nav surface in the app
  (Hard mode, by contrast, appears as a pill) — a deliberate exception so the reward is discoverable.
- **Tab named "Scenes" (v1.7.0).** Renamed from "Reading" once conversations landed — "Reading" no
  longer covered the listening content. "Scenes" fits the place-based packs (station/konbini/…) and both
  skills, and is a clean single word beside Learn/Practice/Profile. The nav icon is a location pin
  (echoing the "where you'd see it" hint chips). Only the display label / nav key changed — internal
  screen and route names stay `reading*` to avoid a churny rename with no user benefit.
- **Hub is a 2-column tile grid (v1.7.0).** Once packs gained both a reading round and a conversation,
  the old full-width list (8 cards, long scroll, per-card stats) became heavy. The hub is now a compact
  grid of scene tiles (glyph + place + a one-glance New/In-progress/Done status); per-pack detail
  (best time, conversation status) lives on the pack detail screen, so the hub stays a clean
  "pick a scene" picker that scales as scenes are added.
- **Profile "by chapter" list removed (v1.7.0).** Redundant with Home's chapter track (owner call).
  Profile keeps the overall %/level/accuracy snapshot + weekly activity + settings. A richer progress
  snapshot, if wanted, belongs on a dedicated subpage rather than inline here.
- **Silent timing, speed as a reward.** No live ticking clock (that would be anxiety UI / streak-like).
  The time + band ("1.2s · Read it instantly") plus the romaji (to check you read the kana right) are
  revealed only after answering. Bands live in one config constant (`READING` in `reading.js`),
  **beginner-tuned**: ≤1.5s instant / 1.5–5s read / 5s+ slow.
- **No slow-word re-drill surface (owner decision).** The brief's "slow words come back" was trimmed in
  two steps after owner review: first the end-screen "3 slowest" list (a relative top-3 wasn't useful in
  an 8-word round), then the pack-card "Read N slow words again" action (it cluttered the hub). The end
  screen is now just the avg + Done (cat-run mascot), and each pack tile is a single button. Per-word
  times are still recorded in `reading` (the per-pack best average drives the "Best Xs / word" stat), so
  a re-drill surface can be reintroduced later without a data migration — `buildReadingSession` just
  needs its word filter back.
- **Mascot extended to this mode — sanctioned by the brief.** This overrides the "icon + results only"
  rule in [CLAUDE.md](../CLAUDE.md)/[design-system.md](design-system.md) for reading mode specifically.
  The maneki-neko hosts the per-word reveal and the results screen (reusing existing moods), kept to
  the reveal/results moments to stay closest to the sanctioned "results" use. If the owner reverses
  this, the cat is confined to [`ReadingMode.jsx`](../src/screens/ReadingMode.jsx) and easily removed.
- **Persistence is additive.** Per-word times live under a new `reading` key inside `hk-progress-v2`
  via a dedicated `recordReading` writer; the kana progress arrays are never touched, and pre-1.6
  saves get `reading: {}` on load. Reset clears it (fresh learner) but keeps XP, like everything else.
- **Real content, clean shape.** Word lists are real and curated (Konbini at reference depth, others
  at 8); each pack is `{ id, place, label, jp, blurb, words:[{ jp, romaji, en, where }] }` so new lists
  swap in without code changes. (Gating is global via `READING_UNLOCK`, not a per-pack field.)

### Audio dialogue "Conversations" (v1.7.0) — comprehension MVP
Audio dialogues live inside the reading packs (tapping a pack now opens a detail screen with the
reading round + a Conversations list — no 5th tab). Key calls:
- **The dialogue is the pack's capstone.** It recombines the pack's vocabulary into a real exchange, so
  the audio isn't cold: Read the words → Hear them in context. Soft-sequenced, not hard-gated.
- **Comprehension only for v1.** Staff lines flagged `check` become "What are they asking?" 4-choice
  beats; "you" lines are guided context (played/shown, not quizzed). The respond/role-play beat was
  deferred (owner call) — start simple, build from there.
- **Difficulty = fading scaffold, authored once.** One dialogue, three support levels (`SUPPORT` in
  [`dialogue.js`](../src/dialogue.js)): Guided (all text), Listen (questions audio-only until answered),
  Ear (audio-first). The UI hides more and TTS speeds up per level — no separate content per difficulty,
  mirroring the app's existing easy/medium/hard-from-one-set approach. `clearedLevel` (hardest level
  passed ≥80%) is the progression hook; a run opens one level past it. This is the "manual scale".
- **Not timed.** Listening is comprehension-paced; timing it would be anxiety UI. Scored on accuracy,
  ending with the full transcript revealed (doubles as reading reinforcement) + cat-run.
- **TTS, not recordings — with eyes open.** Spoken via Web Speech (`ja-JP`), two pitches for the two
  speakers, like the Listening practice mode. This keeps the app backend-free/offline but inherits the
  known device-dependent TTS-quality risk, which is sharper for multi-line dialogue. Mitigations: short
  lines, always-replayable, meaning never hinging on one mangled phoneme. If TTS proves too rough on
  real devices, the fallback is bundling recorded clips for a few hero dialogues — a later,
  evidence-driven call, not the MVP.
- **Additive persistence.** Results live under a new `dialogues` key in `hk-progress-v2`
  (`{ plays, bestPct, clearedLevel }`) via a dedicated `recordDialogue` writer; kana progress untouched.

### No streaks
Streak mechanics are deliberately excluded. The product favours low-pressure, calm learning over
daily-obligation loops. Progress is shown as completion %, XP/level, and a non-judgmental weekly
activity chart. **Do not add streaks, daily goals, or loss-aversion nudges.**

### Mascot is rationed
The cat appears on the app icon, splash, onboarding, and result screen — nowhere else. The splash
and onboarding uses are intentional: the loading video and per-step moods set tone without making
mid-flow UI feel toy-like. The line is drawn at lesson cards, the home screen, and settings — if
the cat starts appearing there, remove it.

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

### Practice modes are kana-only — except Weak spots (v1.8.0)
Quick review, Speed and Listening draw only from learned kana (banked chapters excluded), falling back
to the first hiragana row if nothing is learned. Custom sets and the Numbers tab cover deliberate
banked/number practice. **Weak spots is the exception:** it replays every recorded miss — kana *and*
banked (words/sentences/numbers) — ranked by miss count, then tops up with learned kana to fill the
round. The misses were always recorded in `progress.wrong`; before v1.8.0 the mode silently dropped the
banked ones (it reconstructed only from the kana pool). Reconstruction now goes through the shared
`itemIndex`/`resolveKey` helpers in [`questions.js`](../src/questions.js) (also used by Review).

**Weak spots vs Review** — both surface misses but answer different needs: Weak spots is on-demand
("drill what trips me up *now*", ranked by frequency, no scheduling); Review is calm spaced resurfacing
(only items whose wait has elapsed, graduating out as you re-learn them). Kept separate on purpose.

### Practice leads with modes (v1.8.0)
Practice used to open with a long config wall (tab → difficulty → answer-in → chapter/theme/range
selection → round size → start) and bury the four one-tap modes ~72px below it. The common intent
("just drill me on something") was the hardest thing to reach. Flipped: the **modes grid is now the
hero** at the top; **Build a custom set** sits below it under a plain section heading (matching
Profile's `SETTINGS` rhythm — preceding block `marginBottom: 72`, heading `margin: "0 0 11px"`).
- **A heading, not an accordion.** An initial build collapsed the builder behind a disclosure toggle;
  the owner found that too heavy for what's now a simple second section. It's a plain always-visible
  heading — no toggle, no persisted open-state.
- **Round size lives with the custom set; modes use a fixed count.** "Questions per round" sits inside
  the builder (it's a custom-set knob). The one-tap modes don't show a picker — they launch a fixed
  `MODE_COUNT` (10) for a quick round. Difficulty / answer-in likewise stay in the builder (they only
  apply to custom sets, not the fixed-difficulty modes).
Pure rearrange of existing components; no mechanics changed.

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
