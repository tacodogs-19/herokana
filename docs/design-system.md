# HeroKana — Design System

The single source of truth for HeroKana's visual language. All tokens live in code at
[`src/theme.jsx`](../src/theme.jsx) (colour + fonts + shadow helper) and
[`src/styles.css`](../src/styles.css) (the few global classes/keyframes). There is **no CSS
framework and no design-token build step** — styling is inline `style={}` objects pulling
from the theme context (`useTheme()`), so this document and `theme.jsx` must be kept in sync.

## Look and feel

Soft, rounded, "calm app" aesthetic. A single phone-width column on any screen. Generous
border-radii, hairline `1.5px` borders rather than heavy shadows, one confident blue accent,
and restrained motion. Friendly but not childish: the cat mascot is deliberately rationed
(see [Mascot rules](#mascot-rules)). Light and dark are first-class equals, both hand-tuned.

## Colour tokens

Two palettes, selected by `mode` (`light`/`dark`) and exposed as `t` from `useTheme()`.
Never hardcode a hex in a component — read from `t`. The only sanctioned literal is `#fff`
for text/icons on a filled accent button.

| Token | Role | Light | Dark |
|---|---|---|---|
| `bg` | app background | `#F3F5FA` | `#0E1322` |
| `surface` | cards, sheets, buttons | `#FFFFFF` | `#1A2138` |
| `sunk` | inset wells, tracks, segmented bg | `#EEF1F7` | `#141A2C` |
| `raise` | raised surface (rarely used) | `#FFFFFF` | `#222B45` |
| `ink` | primary text | `#1E2540` | `#F0F2F8` |
| `sub` | secondary text | `#71789A` | `#9098B8` |
| `faint` | tertiary text, inactive icons | `#AAB0C6` | `#5A6286` |
| `line` | borders/dividers (the signature `1.5px`) | `#E6E9F2` | `#27304C` |
| `primary` | brand blue — primary actions, "current" | `#1D4FD7` | `#5A85FF` |
| `primaryDark` | pressed/darker blue | `#1740B0` | `#3D63D8` |
| `primarySoft` | blue tint fill | `#E9EEFC` | `#1E2A4A` |
| `done` | green — success, completed | `#27A567` | `#34C07C` |
| `doneSoft` | green tint fill | `#E4F5EC` | `#16301F` |
| `doneMid` | mid-green (rail fill, done dots) | `#C5EBD5` | `#234C35` |
| `gold` | XP, speed, level | `#F5B225` | `#FFCB57` |
| `goldSoft` | gold tint fill | `#FCF1D8` | `#2A2410` |
| `wrong` | red — errors, hard mode, destructive | `#E5484D` | `#FF6166` |
| `wrongSoft` | red tint fill | `#FBE7E8` | `#34191B` |
| `lock` | locked state | `#C3C8D8` | `#4A5378` |
| `shadow` | shadow colour (used in `rgba`) | `rgba(30,37,64,0.10)` | `rgba(0,0,0,0.4)` |

**Semantic pairing convention:** every accent has a `*Soft` companion used as a low-emphasis
fill (e.g. an icon chip is `primarySoft` background + `primary` glyph). State colour mapping is
consistent app-wide: **current → `primary`, done → `done`, locked → `lock`/`faint`, hard mode →
`wrong`, XP/speed → `gold`.**

### Pre-paint colour resolution
[`index.html`](../index.html) contains an inline script that resolves the theme from
`localStorage["hk-theme"]` (falling back to `prefers-color-scheme`) and sets `--hk-bg`/`--hk-ink`
+ `colorScheme` **before first paint**, so the Android status-bar inset and `<html>` background
never flash the wrong colour. `theme.jsx` then takes over on mount and, on every theme change,
**replaces** (not mutates) the `<meta name="theme-color">` node so Chrome recolours the installed
PWA's status bar live. Keep these two in sync if palette `bg` values change.

## Typography

Loaded from Google Fonts in `index.html`.

- **Display / UI** — `DISPLAY` = `'Outfit', system-ui, sans-serif` (weights 400–800). Used for
  everything that isn't Japanese.
- **Japanese** — `JP` = `'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', serif` (weights 500/700).
  Used for all kana/kanji glyphs. The rounded "Maru" gothic matches the soft aesthetic.

There is no rigid modular scale; sizes are chosen per role (values in px). Representative roles:

| Role | Size / weight |
|---|---|
| Screen title (HeroKana / Practice / Profile) | 19 / 800, `letterSpacing -0.02em` |
| Result headline | 27 / 800 |
| Card heading (`h2`) | 20–25 / 800 |
| Section eyebrow label | 11–11.5 / 700, `letterSpacing 0.12–0.14em`, `sub`/`faint`, UPPERCASE |
| Body / secondary | 13–14.5 / 600, `sub` |
| Button label | 15–16.5 / 800 |
| Tiny meta / captions | 9.5–11.5 / 600–700, `faint` |
| Kana prompt (lesson) | 44–96 / 700 `JP`, scaled by prompt length |
| Hero glyph in progress Ring | 68 / 700 `JP` |

Body copy weight is **600 minimum** — there is effectively no 400 text in the UI. Headings are
800. Eyebrow labels carry positive letter-spacing; large headings carry `-0.02em`.

## Spacing, radius, borders, shadows

- **Spacing** — informal 3/4-based rhythm. Common gaps 6–14; screen padding `14px 20px` (top/sides)
  with extra bottom (22–24); cards pad `12–20`. No spacing scale constant exists.
- **Radius** — small tags/segmented items `7–13`, inputs/answer options/buttons `14–16`,
  cards/sheets `16–26`, pills/toggles `999`, circular (rings, dots, mascot) `50%`. Bigger surfaces
  get bigger radii; the home "focus card" is the largest at `26`.
- **Borders** — the signature is **`1.5px solid t.line`** on virtually every card, button, and
  input. Selected/active state swaps the border to the relevant accent (`2px` on answer options).
- **Shadows** — kept subtle by design (see [decisions](decisions.md)). Two patterns:
  - Button glow: `t.glow(color)` → `0 3px 8px -3px {color}73` (the `73` is ~45% alpha hex).
    Applied to filled primary/accent buttons.
  - Card lift: `0 16–18px 34–40px -16…-26px {t.shadow}` — large blur, large negative spread, so
    it reads as a soft ambient lift rather than a drop shadow.

## Motion

Defined in [`src/styles.css`](../src/styles.css). All of it respects
`@media (prefers-reduced-motion: reduce)` (animations disabled; grow bars jump to final width).

- `.hk-press` — `scale(0.97)` on `:active`, 120ms. Applied to **every** interactive element.
- `.hk-reveal` — fade + 5px rise, 240ms. For content appearing in place (expanders, hints).
- `.hk-grow` — width 0 → `var(--to)`, 750ms ease-out. Progress bars on the Result screen.
- `.hk-pop` — springy scale-in (`cubic-bezier(.2,1.5,.4,1)`), 340ms. The correct/wrong badge.
- `hkFade` (160ms) — modal backdrops. `hkBreathe` — defined but currently unused.
- Standard easing for transitions is `cubic-bezier(.3,.8,.3,1)` (rings, grow).

## Layout conventions

- **App frame** — `Shell` (in [`chrome.jsx`](../src/components/chrome.jsx)) is the only layout
  primitive: `max-width: 430px`, centered, `height: 100dvh`, column flex, `overflow: hidden`.
  Content scrolls in an inner region; `BottomNav` is a fixed-height sibling (hidden via `nav={false}`
  on lesson/result/onboarding).
- **Safe areas** — `env(safe-area-inset-top/bottom)` is honoured in `Shell` and `BottomNav` for
  notched Android/iOS PWA installs.
- **Scrolled shadow** — `Shell` listens to inner scroll (capture phase) and fades in a 12px
  gradient under the status bar only once scrolled.
- **Stable layouts** — lesson/result screens reserve fixed-height slots for hints, feedback, and
  "up next" rows so the primary action button never shifts as state changes. Preserve this when
  editing those screens.

## Component patterns

- **Card** — `surface` bg, `1.5px solid line` border, radius 16–26, optional soft lift shadow.
- **Primary button** — filled `primary` (or contextual accent), white text, radius 14–16,
  weight 800, `t.glow(accent)`, `.hk-press`. Disabled → `sunk` bg + `faint` text, no shadow.
- **Secondary button** — `surface` bg, `1.5px line` border, `ink` text. Destructive variant uses
  `wrong` text on the same surface.
- **Segmented control** — `sunk` track, radius 12, 3px padding; the active segment is a `surface`
  pill with a tiny `rgba(0,0,0,0.12)` shadow. Used for difficulty, answer-language, round size, tabs.
- **Selectable chip / list row** — `surface`→`primarySoft` bg and `line`→`primary` border on select,
  with a square check box or filled state. Onboarding uses pill chips (single/multi-select).
- **Ring** — SVG progress ring (`Ring`), `stroke-dasharray` animated; centred content slot.
- **Toggle switch** — 44×26 pill, `line`→`primary` track, white knob sliding 3↔21px.
- **Modal** — `Modal` dims with `rgba(8,12,24,0.25)`, `center` or `bottom` docking, max-width 402.
- **Icons** — inline SVG, `currentColor` or a theme token as `stroke`, `strokeWidth` ~1.8–2.4,
  rounded line caps/joins. No icon library.

## Mascot rules

The cat sticker set lives in `public/assets/cat-*.svg` plus `cat-loading.mp4`. The product owner's
rule (and the comment in `chrome.jsx`) is: **the cat appears only on the app icon and the result
screen.** Moods are addressed via `<Cat mood="…">` → `general`/`celebrate`/`sad`/`load`/`run`/
`smash`/`point`/`crossed`.

## Divergences from intended design (flagged)

These are places where the shipped code does not match the stated design intent. Decide
deliberately before "fixing" — they may be intentional drift.

1. **Cat appears beyond icon + results.** Despite the "icon and results only" rule, the cat is also
   used in [`Onboarding.jsx`](../src/screens/Onboarding.jsx) (a different mood per wizard step) and as
   the `cat-loading.mp4` video on the splash ([`Splash.jsx`](../src/Splash.jsx) and the static splash
   in [`index.html`](../index.html)). The `chrome.jsx` comment still asserts results-only. Either the
   rule has informally expanded to "onboarding + splash + results" or these are violations — confirm
   with the owner and update the rule or the screens.
2. **`manifest.theme_color` is hardcoded to the light `bg` (`#F3F5FA`).** The runtime overrides the
   live `theme-color` meta per theme, so an installed dark-mode user still gets a correct status bar
   after launch, but the manifest value itself doesn't reflect dark mode. Cosmetic; noted for accuracy.
3. **`hkBreathe` keyframe is defined but unused** in `styles.css` — dead token, harmless.
4. **Practice "Weak spots" subtitle says "tricky kana".** Weak-spots practice (`modeQuestions`) only
   ever draws kana items, so the copy is accurate today — but the `wrong` misses map also records
   phrase/sentence misses that this mode never surfaces. Not a visual issue; relevant if weak-spots is
   ever extended to banked content.
