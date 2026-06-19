# HeroKana — Content & Data Model

The course content, question generation, and persisted learner state. Most of this lives in
[`src/data.js`](../src/data.js) (~1100 lines, mostly content arrays), with generation in
[`src/questions.js`](../src/questions.js) and persistence in [`src/store.jsx`](../src/store.jsx).

## Chapters

`CHAPTERS` (in `data.js`) is the ordered course spine. Each chapter: `{ id, name, caption, units[] }`.
There are **two kinds**, distinguished by whether the chapter `id` is a key in `BANKS`:

### Kana chapters (`hira`, `kata`, `voiced`, `combo`)
- Each unit has a `romaji` array (e.g. `["ka","ki","ku","ke","ko"]`) and a representative `jp` glyph + `label`.
- A unit with `romaji: []` and `label: "Review"` is a **review unit** — it samples across the whole
  chapter rather than one row.
- Glyphs are rendered by looking up romaji in the `HIRA` / `KATA` maps. `mapFor(chapter, unit)` picks
  the map (katakana when `chapter.id === "kata"` or the unit label contains "Katakana", else hiragana).

### Banked chapters (`phrase`, `sentence`, `complex` — listed in `BANKS`)
- Units are **themes**; the actual items live in parallel arrays keyed by unit index:
  `PHRASES` (14 themes), `SENTENCES` (11 themes), `COMPLEX` (4 themes). Each item is
  `{ jp, romaji, en }`. Every theme holds **25+ items**.
- `BANKS = { phrase: PHRASES, sentence: SENTENCES, complex: COMPLEX }`.
- **Always read banks through `bankFor(chapterId)`, never `BANKS[id]` directly** — `bankFor` swaps in
  the personalised Sentences units (see below). `poolFor(chapterId)` flattens a bank for distractors.

> ⚠️ Chapter/unit identity is **positional**. Progress is stored as index-based arrays, so inserting,
> removing, or reordering chapters or units shifts existing learners' progress. `store.jsx`'s `fitLen`
> tolerates length changes on load (new chapters start at 0, removed ones are trimmed) but cannot
> detect reordering. Append rather than reorder when possible.

## Profile & personalised sentences

Onboarding ([`Onboarding.jsx`](../src/screens/Onboarding.jsx)) collects a profile saved under
`localStorage["hk-profile-v1"]` via `saveProfile` / `loadProfile`:
`{ name, dob, country, pets, occupation, hobbies[], skipped }`. The wizard is one-question-per-page,
skippable per-step or all at once (`skipped: true` if nothing answered).

`bankFor("sentence")` rebuilds two units from the profile:
- **Unit 0 "About me"** (`aboutMeSentences()`) — generates lines from name, age (computed from `dob`
  via `ageFromDob` → `ageWords`, which applies the さい counter sound-changes いっ/はっ/じゅっ), country
  (`COUNTRIES` map), pets, and occupation, then pads to 25 with generic `SENTENCES[0]` lines.
- **Unit 4 "Likes"** (`likesSentences()`) — leads with the learner's chosen hobbies (`HOBBIES` map),
  then appends the rest of the generic Likes bank.

If no profile / `skipped`, both fall back to the static banks. `COUNTRIES` and `HOBBIES` carry
`{ kana, roma, en }` for each option.

## Question generation

`buildQuestions(session, progress)` in `questions.js` is the single entry point; it dispatches on
`session.kind`. Question objects come in a few shapes consumed by [`Lesson.jsx`](../src/screens/Lesson.jsx):

| `type` | Source | Answer mode |
|---|---|---|
| `kana` | kana chapters | multiple choice (`options`) |
| `phrase` | banked chapters / numbers | multiple choice, or typed (`input`) on hard |
| `concept` | `FOUNDATIONS` (grammar) | multiple choice |

Common fields: `prompt`, `answer`, `options[]` or (`input: true` + `answers[]`), optional `hint`
(easy), `meaning` (revealed after answering on medium/hard), `listen` (TTS).

### Session kinds
- **`unit`** — `unitQuestions(chapterIdx, unitIdx, difficulty, dir)`. Started from Home. Kana units
  build from the row (or sample the chapter for Review); banked units draw from the theme. Capped at
  `UNIT_MAX = 15`.
- **`custom`** — `customQuestions({ chapters, themes, difficulty, count })`. Practice "build a set".
  `themes` maps banked chapter id → selected theme indices. Mixes kana + banked, targeting ~40% banked
  when both are present, backfilling if one pool is short.
- **`numbers`** — `numberQuestions({ groups, difficulty, count })` from `NUMBER_GROUPS`; distractors
  stay within the chosen ranges.
- **`foundations`** — `foundationsQuestions()` from `FOUNDATIONS` (grammar concepts, `type: "concept"`).
- **`mode`** — `modeQuestions(mode, progress, count)` for the four practice modes:
  `review` (mix of learned kana), `weak` (orders by the `wrong` map), `speed` (timed; 8s/question via
  `SPEED_MS`), `listen` (TTS prompt). **Modes draw only from learned _kana_** (banked chapters skipped);
  falls back to the first hiragana row if nothing is learned yet.

### Distractor design (intentional, don't naively simplify)
`withKanaOptions` builds kana multiple-choice so the answer **can't be guessed from the first letter**:
it prefers distractors sharing the answer's initial (e.g. for "ta" → ta/te/to), falling back to
row-mates for irregular romanisations (chi/tsu, the vowel row). `bankQuestion` pulls distractors from
the same bank's flattened pool so phrase questions get phrase-like wrong answers.

### Answer direction & difficulty
- `answerDir()` reads `localStorage["hk-prac-dir"]` (`romaji` | `en`); banked questions ask for that
  language and show the other as hint/reveal. Hard mode forces English (`dir: "en"`).
- Difficulty: `easy` = multiple choice with hint; `medium` = multiple choice, no hint;
  `hard` = typed input. Typed matching (`norm` in `Lesson.jsx`) is lenient: case, spacing, and
  punctuation are ignored, and **either romaji or English is accepted** (`q.answers = [romaji, en]`).

## Progress & XP (persisted state)

`store.jsx` owns all learner progress under `localStorage["hk-progress-v2"]` via `ProgressProvider` /
`useProgress()`. **`completeLesson` is the only write path.** Shape:

```
{ done: number[],      // per-chapter count of completed units (index-aligned to CHAPTERS)
  hardDone: number[],  // per-chapter completed units on the hard-mode replay track
  hard: boolean,       // hard mode on/off
  xp, answered, correctAns,
  week: { [iso-date]: lessonsCompleted },
  wrong: { "prompt|answer": missCount } }
```

- **Pass threshold:** a unit counts as complete at **≥80% correct** (`Math.ceil(total*0.8)`).
- **XP:** `(correct*6 + (passed ? 8 : 0))` × `1.5` hard-mode bonus. `XP_PER_LEVEL = 525`; level =
  `floor(xp/525)+1`.
- **Hard mode** applies only to banked chapters (kana are auto-complete in the hard view) and advances
  the separate `hardDone` track. It unlocks once `trackComplete` (every unit done). Hard sessions =
  medium difficulty + English answers, for extra XP.
- **Reset** (`resetProgress`) zeroes learning progress but **keeps XP and level** by design.
- The derived value from `useProgress()` also computes `currentChapterIdx`, per-chapter
  `chapterState(i)` (`done`/`current`/`locked`), `overallPct`, `accuracy`, `weekBars`, etc.

### Migration / versioning
On load, if no valid `hk-progress-v2` exists, the store clears legacy keys
(`hk-progress-v1`, `hk-home-sel`, `hk-home-exp`, `hk-prac-*`) and seeds a fresh learner. Bump the
`KEY` version (and add a migration) only if the schema changes incompatibly.

## localStorage / sessionStorage keys (full list)

| Key | Store | Meaning |
|---|---|---|
| `hk-progress-v2` | local | all learner progress (above) |
| `hk-profile-v1` | local | onboarding profile |
| `hk-theme` | local | `light` / `dark` |
| `hk-version` | local | last-seen app version (drives "What's new") |
| `hk-home-sel` | local | last-selected chapter on Home |
| `hk-home-exp` | local | Home "what's in this chapter" expanded flag |
| `hk-prac-diff` / `hk-prac-count` / `hk-prac-dir` / `hk-prac-tab` | local | Practice settings |
| `hk-prac-chapters` / `hk-prac-themes` / `hk-prac-numbers` | session | in-progress custom-set selection (per browser session) |

## Audio

Pronunciation uses the Web Speech API (`SpeechSynthesisUtterance`, `lang: "ja-JP"`, `rate: 0.8`) in
`Lesson.jsx` — no audio assets. Quality depends on the device's installed Japanese TTS voice; there's
no bundled fallback.
