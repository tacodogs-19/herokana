# HeroKana — Decision Log

A running record of significant choices and *why*, including approaches tried and ruled out, so they
are not relitigated. Newest at the top. When you make a non-obvious call, add an entry.

---

## Product / UX

### First kanji is a post-graduation bonus chapter, not a course extension (v1.20.0)
Appended as chapter 8 (`kanji` — append-only per the positional-identity rule). Key calls:
- **`jp` is the kanji itself** in the `KANJI` bank, unlike other banks where `jp` is kana. The kanji
  must be the prompt at *every* difficulty (it's the thing being learned), and `bankQuestion` prompts
  `p.jp` on easy — so the glyph goes in `jp`, one common standalone reading in `romaji`, meaning in
  `en`. No engine changes; SRS/weak-spots/hard-mode/Practice-builder support came free via
  `bankFor`/`itemIndex`/generic `BANKS` checks.
- **One reading per kanji, deliberately.** Multiple readings (音/訓) are real but out of scope for a
  "first kanji" chapter; we teach the reading you'd use seeing the word alone (ひと for 人, えき for
  駅). Full readings belong to a future kanji-proper treatment, if ever.
- **Graduation stays at Complex Sentences** — `isGraduation` in
  [`Result.jsx`](../src/screens/Result.jsx) is pinned to `chapter.id === "complex"` instead of "last
  chapter", so appended chapters never move the "You can read Japanese" moment. Kanji completion is a
  normal chapter finish.
- **Appending un-completes the track for finished learners** (accepted): `trackComplete` (hard-mode
  gate) now includes kanji, so completers see new content and the hard pill returns only after it.
  The one sharp edge — being *stuck* in hard mode with the toggle hidden — is guarded: Profile shows
  the toggle while `hard` is on even if the track is no longer complete.
- **Small units on purpose** (5–6 glyphs): matches kana-row lesson length; distractors draw from the
  whole 23-kanji bank.

### Kana stroke order is a passive reference, not a writing drill (v1.20.0)
The chart's card view gained a "Show stroke order" toggle: KanjiVG path data (bundled
`src/strokes.json` via `scripts/make-strokes.mjs`, CC BY-SA — credited on-screen) animates each
stroke with a faint full-glyph guide. **No canvas tracing, no grading** — the app's read-first stance
(see `KANA_BASICS`) holds; this answers "how is that written?" curiosity without adding a writing
skill tree. Combination kana are two glyphs and hide the toggle (their components have entries).
Reduced motion collapses to the finished glyph. Upgrade path if users ask to *write*: tracing on a
canvas over these same paths.

### Progress snapshot returns as a subpage, not inline Profile rows (v1.20.0)
The per-chapter list removed in v1.7 (redundant with Home's track) returns as the dedicated subpage
that removal note anticipated: [`Stats.jsx`](../src/screens/Stats.jsx) (route `stats`, entry
Profile → "See the full picture"). It earns its place by showing what Home *doesn't*: all chapters
at once, the review pool's box distribution (the SRS is otherwise invisible until items are due),
and per-pack reading speeds. Read-only and calm: no goals, no comparisons, no red.

### Dialogue audio is bundled neural clips, not live TTS (v1.20.0)
The known "TTS quality is device-dependent" risk was sharpest in Conversations (multi-line dialogue,
our differentiator), so the long-deferred "B-part-2" shipped as: pre-generate every dialogue line
with Microsoft Edge neural voices (`msedge-tts`, dev-dependency) via `scripts/make-audio.mjs`, bundle
the mp3s (~1.3MB, 81 lines, deduped across variants, keyed by speaker+text hash), and play them via
`speakLine()` in [`speech.js`](../src/speech.js) with device TTS as the fallback for any line not in
the manifest. Key calls:
- **Two real voices** (Nanami=staff, Keita=you) replace the pitch trick — speaker separation for free.
- **Clips are build inputs, committed** — generation needs network; the app stays offline-first
  because the service worker precaches mp3s (`globPatterns` gained `mp3`).
- **SUPPORT levels map to `playbackRate`** (TTS rate + 0.15 → 0.9/1.0/1.1); one recording, three speeds,
  same fading-scaffold model as before.
- **The ReadingPack "no Japanese voice" gate was removed** — dialogues are fully clip-covered, so a
  device without a ja-JP voice can now play Conversations (it was the only surface hard-gated on the
  voice). Lesson/Practice/charts still gate on `useJaVoice` since they speak arbitrary content.
- **Scope: dialogues only.** Lesson words and Scenes reading words stay on device TTS — hundreds of
  items, and single-word utterances survive poor voices far better than sentences. Extend only if
  evidence demands.
- **Regeneration is a manual step**: after editing `dialogue.js`, run `npm run audio` and commit the
  new mp3s + `src/audio-manifest.json`. Unmanifested lines fall back to TTS, so a missed run degrades
  instead of breaking.

### Scenes unlocks after the kana chapters, not after Words & phrases (v1.19.0)
`READING_UNLOCK` moved from `"phrase"` to `"combo"` — the Scenes tab now opens when all four kana
chapters are done instead of after the 14-unit Words chapter. Rationale: content analysis showed
every pack needs voiced + combination kana and most lean on katakana, so "all kana done" is the
first moment every scene word is readable — and at that moment *all eight* packs are readable.
**Per-pack incremental gating was considered and ruled out:** it would collapse to the same single
unlock moment in practice, add a parallel unlock system, and contradict the logged "itinerary
suggests an order, it doesn't gate one" call. Scenes' framing shifts slightly from capstone reward
to reading-practice ground; the existing untimed reveal (romaji + meaning) already supports
first-encounter words, so no UI change was needed. One-line change, gate hint updates itself.
**The unlock moment is announced on the result screen** — mid-course the unlock would otherwise be
silent (the graduation CTA and Complex Sentences teaser only cover late-course discovery), so
[`Result.jsx`](../src/screens/Result.jsx) shows a "SCENES UNLOCKED" label + secondary
"Explore Scenes →" CTA when a passed unit completes the `READING_UNLOCK` chapter, mirroring the
graduation idiom (including its accepted quirk: it re-shows on replays of the completed chapter).
Watch items, deliberately not pre-tuned: speed bands may read harsh for post-kana learners
(raise `READ_MS` if evidence says so), and Conversations are now reachable pre-grammar (Guided
support + soft read-first sequencing carry it for now).
**The slow-word re-drill returned (owner call, reversing the v1.6 trims):** with Scenes now a
mid-course surface, slow reads need somewhere to resurface (reading times aren't in Review/SRS).
It lives on the **pack detail screen** ([`ReadingPack.jsx`](../src/screens/ReadingPack.jsx)) — a
"Read N slow words again →" pill under the reading card, shown only when a word's *last* read was
in the slow band — not the hub or end screen, whose versions were trimmed as clutter.
`slowWords(pack, rec)` + an optional `only` filter on `buildReadingSession` in
[`reading.js`](../src/reading.js); distractors still draw from the whole pack. A fast re-read
updates `last`, so the pill clears itself.

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
  needs its word filter back. **Reintroduced in v1.19.0** on the pack detail screen (a surface that
  didn't exist when the old versions were trimmed) — see the Scenes-unlock entry.
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

### Scenes hub is a trip itinerary, not a tile grid (2026-07)
The Scenes hub ([`Reading.jsx`](../src/screens/Reading.jsx)) renders the eight packs as one vertical
journey — airport → station → signs → konbini → café → restaurant → paying → hotel — on a rail, with
the "current" stop (a tapped scene — remembered per session in `hk-scenes-sel` — else the first
started-but-unfinished pack, else the first fresh one) expanded into a focus card (glyph, blurb,
words-read bar, Start/Continue/Revisit CTA). Replaced the uniform 2-column tile grid, which was the
one hub with no hierarchy or focal point. **Tapping a stop expands it in place** (animated morph,
320ms ease-out-quart, per-property transitions, per-stop rail segments so the line never overshoots
the end nodes); only the focus card's CTA navigates to the pack. Untouched scenes carry no status
label — absence means "not started"; only In progress/Done are labelled. `TRIP_ORDER` is **display
order only** — progress stays keyed by pack id, so reordering it is safe (unlike `CHAPTERS`). The
itinerary suggests an order, it doesn't gate one (calm-over-urgency applies).

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
multiple-choice (`bankQuestion`) does the same since 2026-07: up to two of the three distractors share
the answer's first letter (in whichever language is being answered), falling back to plain same-bank
sampling when the bank lacks same-letter items. Don't replace either with random sampling.

### Lenient typed answers
Hard/typed questions normalise case, spacing, and punctuation and accept **either** romaji or English.
Rationale: test recall of meaning, not exact transcription or input-method quirks.

### Practice modes are category-scoped (v1.8.0, categories extended 2026-07)
The one-tap modes run within a category tab — **Alphabet / Words / Sentences / Numbers**
(`modeQuestions` in [`questions.js`](../src/questions.js)). Words draws from the `phrase` bank only;
Sentences from the `sentence` + `complex` banks — split so learners can drill vocabulary and full
sentences separately. Alphabet draws from learned kana, falling back to the first hiragana row if
nothing is learned. **Weak spots is scoped to the active category:** it replays recorded misses
belonging to that category's pool, ranked by miss count, topped up from the pool to fill the round
(reconstruction via the shared `itemIndex`/`resolveKey` helpers, also used by Review). The custom-set
builder keeps its own three tabs (Alphabet / Words / Numbers) — the words-vs-sentences split is a
modes-section concern only; the builder already separates banked chapters explicitly.

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
