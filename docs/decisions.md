# HeroKana — Decision Log

A running record of significant choices and *why*, including approaches tried and ruled out, so they
are not relitigated. Newest at the top. When you make a non-obvious call, add an entry.

---

## Pricing

### One-time $0.99, paid-upfront on Play (2026-07-05)
HeroKana ships as a **paid app** on Play — pay $0.99 once, own it forever. No ads, no subscription,
no in-app purchases. Chosen over free and over freemium-unlock:
- **Paid-upfront over in-app unlock (Digital Goods API / Play Billing):** for $0.99 net (~$0.84, or
  ~$0.90 under Play's 15% small-business tier), wiring Play Billing into the TWA is real, fragile
  code for a coffee. Paid-upfront is a Console price setting — zero code, and Google handles billing,
  refunds, restore-on-reinstall, and family sharing. No backend/accounts, so it keeps the hard
  constraints intact.
- **Cost accepted:** paywalling before the try removes the zero-friction install that was the app's
  main conversion edge. The free web PWA at herokana.netlify.app is left free deliberately — it's a
  de-facto web trial / funnel, not worth gating.
- **Blocker that forced the timing:** Play does not allow free→paid conversion after publish. The
  price must be set on the existing `app.netlify.herokana.twa` package **before first production
  release** (it had not gone live free yet). If it ever ships free by accident, charging later means
  a new package ID and losing the listing.

Listing copy updated (`store/play-listing.md` "pay once, yours forever" line; screenshot caption 08
in `scripts/store-assets.mjs` — re-run `npm run store-assets` to bake it).

## Product / UX

### Verbs chapter — a mid-spine insert, positional progress reset accepted (v1.22.0)
A recognition chapter (Japanese verb → English meaning), inserted **before Sentences** (id `verb`,
chapter index 5). This **deliberately reverses** the reasoning in "Particles taught as a pre-sentence
drill, not a chapter" below: that entry ruled out a real chapter between `phrase` and `sentence`
*because* the positional-index model corrupts saved progress on insert. The owner accepted the
progress reset for existing learners (sentence/complex/kanji shift one index) — verbs belong before
sentence-building pedagogically, and it's pre-launch. Key calls:
- **Reused the banked engine end to end** — no new question type, screen, or content file. The verb
  data already lived in [`verbs.js`](../src/verbs.js) (`GROUPS`) for the Verb *list* reference screen;
  `data.js` now imports it and derives a `VERBS` bank (3 units = ru / u / irregular). One source of
  truth for both the chapter and the reference chart.
- **Prompt is the kana reading by default, kanji on medium/hard** — mapped `jp: v.r` (kana),
  `kanji: v.jp` (form). Learnable straight after the kana chapters; the kanji surfaces with furigana
  at higher difficulty, same as other banks.
- **Answers behave exactly like other banked chapters — romaji default, English on hard.** First
  build forced English answers via an `enOnly` item flag (reasoning: romaji *is* a verb's reading, so
  a romaji answer tests spelling not meaning). **Reversed before shipping** on owner review: learners
  meeting these verbs cold know neither the reading nor the meaning, so a cold English-answer prompt
  is a blind guess. The gentler on-ramp is the app's standard banked model — **romaji answer with the
  English meaning as the easy-mode hint** (read it, absorb the meaning), with **hard mode flipping to
  English answers** (`startUnit` already sets `difficulty: "medium", dir: "en"` for banked chapters).
  So `enOnly` was deleted and verbs are now a plain banked chapter: no special-casing in `bankQuestion`,
  and the Practice custom-set Verbs tab shows the normal Romaji/English answer toggle. Meaning-recall
  therefore lives in hard mode + English-answer custom sets, same as phrases/sentences — acceptable,
  and a medium-default or dedicated "test meaning" toggle can come later if evidence wants it earlier.
- **Answered in the dictionary (plain) form, not the polite ます form.** Owner raised that polite is
  more common in sentences. Kept plain as the answer because it's the verb's *identity* — the citation
  form every other form derives from, and the basis of the ru/u/irregular grouping the chapter is built
  on (those groups are a plain-form concept; quizzing ます would obscure them). Instead the polite form
  is **surfaced, not quizzed**: on answering, a PLAIN/POLITE chip pair is revealed
  ([`Lesson.jsx`](../src/screens/Lesson.jsx), reusing the `q.parts` reveal pattern) — plain in kana
  (matches the prompt) + polite in its standard written form (`v.masu`, e.g. 出来ます) with romaji under
  each, meaning already on the card. Data rides on a `forms` field on the verb bank items (no new
  content — `verbs.js` already had every conjugation). Producing the ます form is the natural future
  drill this leaves room for.

### Voiced / combination lead with a one-time modifier intro (v1.22.0)
These chapters quizzed が/きゃ etc. with no explanation of the *system* (the dakuten/handakuten marks,
the small ゃゅょ). Added a single unscored `intro` card at the head of the first unit, first time
through — same "teach before you test" principle as the hira/kata teach cards, but one chapter-level
concept card rather than per-kana. Kept it a new lightweight card type (title + hero + body, one-tap
"Got it →", excluded from scoring) rather than reusing `concept` (which needs options) or the Basics
screen (a separate opt-in surface, easy to miss). Gated on `progress.done[chapter]===0` so it shows
once and never nags on replays. Verb "Hear it" audio was wired the same session by routing verb
questions through the existing bundled-clip path (`speakVerb`), matching kana/dialogue — the clips
already existed for the Verb chart, they just weren't used in lessons.
- **Scope: recognition only (v1).** Conjugation drilling (masu/ta/te/nai) is a genuinely different
  question type and stays deferred — the `VerbChart` reference already shows the forms.

### Kana tile pad: distinct ん + syllable highlight (v1.22.0)
Two production-question ([`Lesson.jsx`](../src/screens/Lesson.jsx)) fixes: the standalone ん button was
labelled "n", a confusing duplicate of the `n` consonant key (which builds na/ni/nu/ne/no) — now
labelled with the kana ん itself (in the JP font) so it reads as one complete sound. And the
vowel/syllable tiles never showed a selected state (`tile(false, …)`), so after arming a consonant only
the consonant lit up — now the picked syllable highlights alongside it (`tile(sel === val, …)`).

### Kana lessons: teach → recognise → produce (v1.21.0, council-reviewed)
A council review of "how do learners actually commit kana to memory?" converged on: recognition
(multiple choice) doesn't transfer; memory forms during *effortful retrieval*; and mnemonics are
encoding scaffolds that must come *before* first exposure, not after answering. The loop for
Hiragana/Katakana row lessons:
- **Teach cards** (unscored: glyph + auto-spoken sound + mnemonic) in pairs before each pair's
  first questions — never quiz a kana the learner hasn't met. Shown only until the unit is first
  completed (`progress.done` gate in `unitQuestions`).
- **Production round** — every kana re-asked with no options: the learner builds the romaji on a
  **consonant+vowel tile pad** (`KANA_COMPOSE`). Chosen over the OS keyboard deliberately: no
  autocorrect/layout jank, and compose yields canonical romaji (s+i = shi), so romanisation
  variants (si/tu/hu) can't be marked wrong — the trap peer review caught in "just use typed input".
- **Miss requeue** — a wrong kana answer appends one retry at the lesson's end (production when
  composable, same MC otherwise). Same-session second retrieval is where encoding happens.
- **MC stays the floor**: SRS review and practice modes remain easy multiple-choice (calm), and
  voiced/combination chapters keep MC until the tile pad grows their rows (g/z/d/b/p, ya/yu/yo).
- Deferred from the verdict: reversed-direction questions (sound → pick glyph), katakana
  cross-script drills (か→カ). Evidence first.

### Mnemonics are per-script, format-fixed (v1.21.0)
The single shared mnemonic table described hiragana shapes under katakana glyphs (あ "open mouth"
makes no sense for ア). Now `HIRA_MN` + `KATA_MN` (46 hand-written each) with voiced/combination
entries **generated** from each script's own glyphs (か+dashes vs カ+dashes) — consistent by
construction. Wording rule for all entries: `"<shape image> — '<romaji>'"` — no caps-shouting, the
romaji always present and always in quotes. Use `mnemonicFor(romaji, script)`; there is no shared
table export anymore.

### No loading screen, at all (v1.21.0)
The static HTML splash (cat video + wordmark + "Loading…") kept appearing on update reloads and
occasionally on slow launches, reading as the "forced" splash v1.17 was supposed to have killed.
Owner call: remove it entirely — `index.html` now shows only the pre-paint themed background until
React mounts; the TWA/OS splash covers cold launches. `cat-loading.mp4` (1MB) deleted from
`public/assets` (git history has it). The mascot's sanctioned surfaces are now icon + onboarding +
results (+ reading mode per its brief).

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

### Progress snapshot page: built, then deleted (v1.20.0, same day)
The v1.7-deferred "richer progress subpage" was built (`Stats.jsx`: per-chapter bars, SRS box
distribution, per-pack reading speeds), the owner didn't love it, and a five-advisor council review
concluded **delete, don't redesign**. Why it failed: it displayed the database, not the learning —
Leitner box counts are scheduler internals, per-pack reading speeds answer a question no learner
asks, and chapter bars duplicate Home's track. A stats dashboard is also quietly off-thesis for a
calm app (box/due counts are Anki's anxiety machinery in softer colours). The page's only
actionable number — reviews due — was already surfaced by Home's "Ready to review" card, so
deletion lost nothing actionable. **Do not rebuild a stats page.** The one idea shelved for
post-launch, if a progress surface ever returns: **"what you can read now"** — progress expressed
as capability (real words/sentences the learner has earned, content-as-hero), possibly with the
per-item wrong-answer data surfaced contextually ("your slippery kana") at the end of a review
round rather than on a page. The deleted screen is in git history (commit e95422f) if needed.

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

### Practice rounds use a session shuffle-bag, not independent re-sampling (2026-07)
Each mode round was `shuffle(pool).slice(0, count)` — sampled independently, so within a
session some items recurred while others never appeared. Replaced with `bagDraw(key, pool, count)`
([`questions.js`](../src/questions.js)): an in-memory, per-category **draw-without-replacement**
bag that works through the whole pool before anything repeats, then reshuffles. Chosen over a
"don't repeat for X rounds" cooldown — no X to tune, and it guarantees coverage rather than
approximating it. Applies to the non-weak pooled modes (Quick review / Speed / Listening) across
`alpha` / `words` / `sentences` / `verbs` / `numbers`; **Weak spots is untouched** (misses-first
by design). State is module-level and resets on reload (a fresh session) or when the pool size
changes (new content learned). Guarded by a test (one full cycle over a 100-item pool → 100
distinct, no repeat).

### Two phrase gloss collisions fixed (2026-07)
Two Words items shared an English gloss with a different item in the same theme, which breaks the
English-answer direction (the twin can appear as a distractor, giving two identical options):
Greetings よろしく was a second "nice to meet you" (now "please treat me well", distinct from
はじめまして), and Small talk ちょっと was a second "a little" (now "a bit", distinct from すこし).

### Food expanded, Body theme added (2026-07)
Actioned the content-audit recommendations. **Food** grew 25→40 (breakfast/lunch/dinner, beer,
juice, sugar, salt, soy sauce, cake, cheese, potato, onion, carrot, strawberry, ice cream) — items
added *within* the existing theme, so no positional/progress impact. **Body** is a new appended
theme (30 parts; unit `体`, index 15) — append-only per the positional rule, so it un-completes the
Words track for finished learners (accepted, pre-launch, same as Objects/kanji). はな (nose) and
かみ (hair) were deliberately omitted — they collide in kana with flower/paper elsewhere in the
bank. A whole-bank scan after the additions found one new same-English collision (Objects かばん
vs Shopping ふくろ, both "bag"); fixed by re-glossing かばん "bag / briefcase". Remaining same-kana
homographs (つき month/moon, げんき, すき, だいじょうぶ, でんわ) are pre-existing and synonymous or
low-harm — left as-is.

### Practice Words/Sentences/Verbs modes draw from the whole bank (2026-07)
Reverses the "use completed themes" scoping below for the **open** modes (Quick review,
Speed, Listening) in the banked categories. Owner call: Practice should be a genuine
**alternate learning path** — a way to *meet* vocabulary — not only a re-drill of what the
track already taught. `modeQuestions` now builds two pools ([`questions.js`](../src/questions.js)):
`allPool` (every word in the category's banks) feeds the open modes; `learnedPool` (completed
themes, whole-bank fallback) still scopes **Weak spots**, which stays about your actual misses,
not new words. Distractors were already drawn from the whole `flat` bank, so nothing else
changed. Guarded by a test (partial `done` → open mode still fills `count` past one theme).
Kana (`alpha`) modes keep their learned-only behaviour — you can't meet a kana you haven't been
shown a glyph for the same way. Added alongside a broader **Objects & things** phrase theme
(40 items vs the uniform 25 — banked lessons sample 15 so a bigger pool costs no lesson length,
it just deepens Practice/SRS variety).

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
