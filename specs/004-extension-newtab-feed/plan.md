# Implementation Plan: Browser Extension New-Tab Subscribed-Tags Feed

**Branch**: `004-extension-newtab-feed` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-extension-newtab-feed/spec.md`

## Summary

A Manifest V3 WebExtension in a new top-level `extension/` directory
overrides the new-tab page with a React new-tab app. It uses the specs/003
device flow to obtain a bearer token (stored in `browser.storage.local`),
calls one new endpoint (`GET /api/v1/feed`) for a subscribed-tags-filtered,
paginated, unified posts+tweets feed, and falls back to a connect/offline
state per FR-004/FR-005. One codebase targets both Chrome and Firefox
(FR-008); only the manifest and a thin browser-API shim differ.

## Technical Context

**Language/Version**: TypeScript + React 19 (same major as the web app, for
familiarity — this is a separate build target, not a shared Next.js bundle)

**Primary Dependencies**:
- `webextension-polyfill` — unifies the `chrome.*`/`browser.*` API surface
  so the feed/connect logic is written once for both browsers (directly
  serves FR-008; this is the standard, minimal solution for this exact
  problem, not a speculative abstraction).
- Vite + `@crxjs/vite-plugin` — MV3-aware bundler with HMR for extension
  dev; Next.js's own toolchain cannot produce a service-worker + new-tab-page
  extension bundle, so a small dedicated bundler is required here, not
  optional convenience.
- Tailwind v4 (already a project dependency) — reused for the new-tab UI's
  own minimal config; not literally sharing `globals.css`'s compiled tokens
  across build pipelines in v1 (spec Assumptions: "consistent but not
  pixel-identical").

**Storage**: `browser.storage.local` for the bearer token (never
`storage.sync` — a credential shouldn't silently propagate to every synced
browser profile); no other client-side persistence.

**Testing**: `npx tsc --noEmit` (extension has its own `tsconfig.json`
extending the repo's conventions) + `npm run lint` scoped to `extension/`;
manual verification in both Chrome and Firefox per SC-003 (no automated
cross-browser test harness introduced for a first version — Principle VI).

**Target Platform**: Chrome/Chromium (MV3) and Firefox 109+ (MV3) new-tab
override.

**Project Type**: Adds a second, independently-built sub-project
(`extension/`) alongside the existing single Next.js `src/` app — the two
share no build step, only the HTTP contract in specs/003's
`contracts/device-flow-api.md` and this feature's `GET /api/v1/feed`.

**Performance Goals**: New-tab feed visibly renders within 2s on broadband
(SC-001) — achieved by rendering cached/last-known feed data immediately
(if present in `storage.local`) while a background refresh completes.

**Constraints**: No write/interaction endpoints (FR read-only per
Assumptions); must degrade to a clear state (not a blank page or crash) on
disconnect (FR-004) or offline (FR-005) — required, not optional, polish.

**Scale/Scope**: 1 new Route Handler (`GET /api/v1/feed`), 1 new
`extension/` sub-project (manifest + new-tab React app + background service
worker for token storage/polling), no new Prisma models (reuses
`Subscription`/`Post`/`Tweet` as-is).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Reuse Before Reinvention**: PASS — the feed endpoint reuses
  `loadTimeline`'s merge/pagination logic (`src/actions/timeline.ts`,
  `src/lib/pagination.ts`'s `Page<T>`) rather than reimplementing unified
  post+tweet pagination a second time; auth reuses specs/003's bearer-token
  verification helper.
- **II. Mutations Are Server Actions (Web App)**: N/A for this feature — no
  new web-app mutation; the new endpoint is read-only (`GET`) and lives
  under the Principle VII exception, not the web app's own action surface.
- **III. Version-Pinned Correctness**: PASS — no framework-version-sensitive
  shortcuts; the extension is a separate build target and doesn't touch
  Next 16/Prisma 7/Tailwind v4 conventions beyond reusing Tailwind's utility
  classes in its own config.
- **IV. Composable, Disjoint Design Tokens**: N/A — the extension UI is
  explicitly out of scope for the 9-axis appearance system (spec
  Assumptions: not pixel-identical to the web app).
- **V. Evidence-Driven Refactoring**: N/A — new functionality.
- **VI. No Speculative Abstraction**: PASS — one bundler (Vite), one
  cross-browser shim (`webextension-polyfill`), one new read endpoint; no
  generic "extension framework," no premature multi-browser-store publishing
  automation.
- **VII. External-Client API Is a Deliberate, Scoped Exception**: PASS — the
  new `GET /api/v1/feed` endpoint sits under the same versioned surface as
  specs/003, authenticated the same way, read-only as required by default
  under this principle.

No unjustified violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-extension-newtab-feed/
├── plan.md              # This file
├── data-model.md         # Phase 1 output (no new persisted entities — documents the response shape instead)
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output — GET /api/v1/feed contract
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

research.md is omitted: the browser/auth/scope decisions were resolved via
the clarifying-question round before this plan was written; no unknowns
remain in Technical Context.

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── v1/
│           └── feed/
│               └── route.ts          # NEW: GET /api/v1/feed (bearer-token
│                                     # auth via specs/003 helper, reuses
│                                     # loadTimeline's merge logic scoped to
│                                     # the caller's subscribed tags)
└── lib/
    └── extensionFeed.ts               # NEW: subscribed-tags-filtered variant
                                       # of the timeline query (thin wrapper,
                                       # not a duplicate of timeline.ts)

extension/
├── package.json                       # own deps: react, react-dom,
│                                      # webextension-polyfill, vite,
│                                      # @crxjs/vite-plugin, typescript
├── tsconfig.json
├── vite.config.ts
├── manifest.config.ts                 # generates manifest.json (Chrome)
│                                      # and the Firefox variant
│                                      # (browser_specific_settings) from
│                                      # one source object — FR-008
├── src/
│   ├── background.ts                  # service worker: holds/polls the
│                                      # specs/003 device flow, stores the
│                                      # token in storage.local
│   ├── newtab/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                    # connect prompt / offline state /
│                                      # feed list (User Stories 1-3)
│   │   └── FeedItem.tsx               # compact post/tweet card, links out
│   └── lib/
│       └── api.ts                     # fetch wrapper: attaches bearer
│                                      # token, calls /api/v1/device/* and
│                                      # /api/v1/feed, maps
│                                      # reauthenticate_required → connect
│                                      # state
└── icons/
```

**Structure Decision**: New top-level `extension/` sub-project (per the
clarifying-question answer), independently built, consuming the main app's
API over HTTP only — no shared build step or direct source import between
`extension/` and `src/`, matching how a genuinely different runtime target
should be isolated.

## Complexity Tracking

No constitution violations — table not needed.
