---
description: Cut a HeroKana release — bump version + notes, commit, push (Netlify auto-deploys)
argument-hint: "[optional: target version e.g. 1.24.0]"
---

You are cutting a release of HeroKana. Deploys are Git-based: pushing to `main`
makes Netlify build and publish. Installed clients then see an update prompt,
and the in-app "What's New" dialog shows **only when `VERSION` changes**.

First gather context yourself (run these): the current `VERSION` in
`src/release.js`, `git status -s`, `git log --oneline origin/main..HEAD`, and
the working-tree diff.

Then run this process:

1. **Summarise what changed** since the last release — read the working-tree
   diff and any unpushed commits. If the tree is clean AND nothing is unpushed,
   say "nothing to release" and stop.
2. **Propose the next `VERSION`** (default: bump the minor for features/content,
   the patch for fixes only) — or use the version in `$ARGUMENTS` if I gave one.
   Ask me to confirm or override. Also ask whether it needs the "What's New"
   popup at all: for a trivial fix I may want **no version bump** (it still
   ships and shows the update prompt, just no notes dialog).
3. **Draft `RELEASE_NOTES`**: one friendly, second-person line per *user-facing*
   change, matching the tone already in `src/release.js`. Exclude anything
   invisible to users (analytics, refactors, docs, tests). Show me the draft and
   let me edit before proceeding. This is your one confirmation gate — wait here.
4. On my approval, edit `src/release.js`: set `VERSION` (skip if I chose no bump)
   and replace `RELEASE_NOTES`.
5. Run `npm run build` as a safety check. **If it fails, stop and report — never
   push a broken `main`.**
6. `git add -A`, commit as `Release vX.Y.Z: <short summary>` (plain message if no
   bump), then push to `origin main`.
7. Confirm the push landed and remind me: Netlify is now building; installed
   users will get the update prompt, plus "What's New" if `VERSION` changed.
   Point me at the Netlify **Deploys** tab to watch it go green, and note that a
   bad release can be rolled back there in one click.

Keep it tight. The only thing you need from me is step 2–3 (version + notes);
everything after is yours to run.
