# Implementation Plan: Visual Redesign & Settings Completeness ("Index & Ink")

**Branch**: `007-app-redesign` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-app-redesign/spec.md`

## Summary

Reskins the default appearance to the approved "Index & Ink" direction by
changing *default values* of already-existing, already-customizable
appearance-axis presets (accent → `violet`, radius → `small`, card style →
`elevated`, all pre-existing options in `src/lib/fonts.ts`) plus one new,
non-customizable heading-font default (reusing the already-loaded Source
Serif font). Adds a computed (never stored) tag-color function and new
disjoint `--tag-1..6` CSS tokens. Adds three missing settings features
(change password, a single notifications on/off toggle, account
deletion). Adds interaction polish (animated like, expandable comments,
loading shimmer, toast, pulsing indicators) and a View-Transitions-based
feed→post navigation animation.

## Technical Context

**Language/Version**: TypeScript (Next.js 16 App Router, React 19)

**Primary Dependencies**: None new. Reuses: `tw-animate-css` (already
imported in `globals.css`) for animation utilities where they fit;
`next/font/google`'s already-loaded `sourceSerif` export; existing
`bcryptjs` for password verification/hashing; existing `zod` validation
pattern; React's `<ViewTransition>` (stable under Next 16's
`experimental.viewTransition` config flag — confirmed present in this
Next.js version's docs).

**Storage**: One new `User` column: `notificationsEnabled Boolean
@default(true)`. No new table, no `Tag.color` column (spec FR-002).

**Testing**: `npx tsc --noEmit` + `npm run lint`; manual quickstart
covering redesigned surfaces, all three new settings features, motion
with and without `prefers-reduced-motion`, and the page transition with
and without View Transitions support.

**Target Platform**: Existing KSPlatform web app (styling + a few new
actions/pages; no new sub-project)

**Project Type**: Web application (single Next.js project)

**Performance Goals**: `tagColor()` is an O(slug length) string hash, called
per rendered tag — negligible; no memoization needed at this scale
(Principle VI).

**Constraints**: MUST NOT modify the 9-axis appearance system's mechanism
(picker UI, `data-*` attributes, stored `User` columns for existing axes)
— only their *default* values change, and only for axes where an
existing preset already matches the direction (no new preset values
invented). MUST NOT add a `color` column to `Tag` (FR-002). All new
animations MUST respect `prefers-reduced-motion` (FR-009).

**Scale/Scope**: ~10-12 files touched for the visual layer (globals.css
defaults, `fonts.ts` DEFAULT_* constants, a new `tagColor.ts`, `PostCard`/
`TweetCard`/`TagPill`-equivalent components, `InfiniteList`/feed
skeleton, `CommentItem` disclosure); 1 new Prisma column + migration;
1 new action file (`accountSettings.ts` covering change-password,
notification-toggle, delete-account) + 1 settings UI section; 2 files
touched for the View Transition (the layout/template boundary between
feed and post detail).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Reuse Before Reinvention**: PASS — reuses existing `violet` accent,
  `small` radius, `elevated` card style presets (all already implemented,
  just not the default), the already-loaded Source Serif font, existing
  `bcryptjs`/`zod` patterns, and existing `toggleLikeAction`/comment
  actions (only their UI gets an animated confirmation, not new mutation
  logic).
- **II. Mutations Are Server Actions (Web App)**: PASS — change-password,
  notification-toggle, and delete-account are all new `"use server"`
  functions following the `requireUserId()` + zod + `revalidatePath`/
  redirect pattern.
- **III. Version-Pinned Correctness**: PASS — `experimental.viewTransition`
  and React's `<ViewTransition>` are used exactly as documented in this
  repo's installed Next.js version's own docs (verified before writing
  this plan, not assumed from training data), consistent with AGENTS.md's
  instruction to check `node_modules/next/dist/docs` first.
- **IV. Composable, Disjoint Design Tokens**: PASS — the new `--tag-1..6`
  tokens are a disjoint set from the 9 existing axes (they're computed
  per-tag, not user-selected), and the heading-font change reuses the
  existing `--font-heading` variable slot (already independent of the
  user-facing `font` axis's `--font-sans`) rather than inventing a new
  token.
- **V. Evidence-Driven Refactoring**: N/A for the visual/feature work
  (new functionality, explicit user request); the tag-color storage
  decision (FR-002) IS evidence-driven — the user explicitly flagged
  per-tag storage as bloat risk before this plan was written, and a
  database check confirmed `Tag` has no color column today.
- **VI. No Speculative Abstraction**: PASS — notification preferences is
  scoped to the app's one actual notification-triggering event (verified
  by grepping for `prisma.notification.create*` call sites — there is
  exactly one, in `notifySubscribers`), not a speculative multi-type
  system. View Transitions is additive progressive enhancement, not a
  new animation framework.
- **VII. External-Client API Is a Deliberate, Scoped Exception**: N/A —
  no `/api/v1/*` surface touched.

No unjustified violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-app-redesign/
├── plan.md              # This file
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

research.md and contracts/ are omitted: the version-specific unknown
(does View Transitions work in this Next.js install?) was already
resolved by reading this repo's own `node_modules/next/dist/docs` before
writing this plan; no external API surface is touched.

### Source Code (repository root)

```text
prisma/
└── schema.prisma                       # + User.notificationsEnabled

src/
├── lib/
│   ├── tagColor.ts                     # NEW: computed tag → color-index function
│   ├── fonts.ts                        # DEFAULT_ACCENT → "violet",
│   │                                   # DEFAULT_RADIUS → "small",
│   │                                   # DEFAULT_CARD_STYLE → "elevated"
│   └── validation.ts                   # + changePasswordSchema
├── app/
│   ├── globals.css                     # + --tag-1..6 tokens (light/dark),
│   │                                   # --font-heading default → source-serif,
│   │                                   # shimmer/marquee/pop keyframes
│   ├── layout.tsx                      # enable experimental.viewTransition
│   │                                   # usage boundary (ViewTransition wrap)
│   └── posts/[slug]/page.tsx           # wrap in <ViewTransition> for feed↔detail
├── actions/
│   └── accountSettings.ts              # NEW: changePasswordAction,
│                                       # toggleNotificationsAction,
│                                       # deleteAccountAction
├── components/
│   ├── feed/
│   │   ├── PostCard.tsx                # spine + filled tag pills + hover lift
│   │   └── TweetCard.tsx               # same treatment
│   ├── tags/
│   │   └── TagPill.tsx                 # (or equivalent) uses tagColor()
│   ├── InfiniteList.tsx                # loading-shimmer skeleton state
│   ├── comments/
│   │   └── CommentItem.tsx             # animated expand/collapse disclosure
│   ├── LikeButton.tsx                  # (wherever like UI lives) animated confirm
│   └── settings/
│       └── AccountSettings.tsx         # NEW: password change, notif toggle,
│                                       # delete-account UI
└── next.config.ts                      # experimental.viewTransition: true
```

**Structure Decision**: Existing single Next.js project, no new
directories beyond one small `components/settings/AccountSettings.tsx`
and `actions/accountSettings.ts`. Everything else is edits to existing
files, consistent with this being primarily a styling/default-value
change plus three additive settings features.

## Complexity Tracking

No constitution violations — table not needed.
