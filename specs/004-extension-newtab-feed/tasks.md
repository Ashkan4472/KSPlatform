---

description: "Task list for feature implementation"
---

# Tasks: Browser Extension New-Tab Subscribed-Tags Feed

**Input**: Design documents from `/specs/004-extension-newtab-feed/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/,
quickstart.md, AND specs/003 fully implemented (T001-T016 there)

**Tests**: No unit test tasks generated; verification is the manual
cross-browser quickstart (SC-003 explicitly requires manual testing in both
browsers) plus the standard type-check/lint gate.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The server-side feed endpoint and the extension project
scaffold that every user story needs.

- [ ] T001 Create `src/lib/extensionFeed.ts`: a thin wrapper around
  `loadTimeline`'s merge/pagination logic (`src/actions/timeline.ts`) that
  scopes the query to the caller's `Subscription` tag ids (equivalent to
  today's `filter: "subscribed"` path, but driven by a userId resolved from
  a bearer token instead of a session)
- [ ] T002 Create `GET /api/v1/feed` in `src/app/api/v1/feed/route.ts`:
  verify the bearer token via specs/003's helper (`401
  reauthenticate_required` on failure), call T001, return the
  `contracts/feed-api.md` shape
- [ ] T003 [P] Scaffold `extension/` sub-project: `package.json`
  (react, react-dom, webextension-polyfill, vite, @crxjs/vite-plugin,
  typescript), `tsconfig.json`, `vite.config.ts`
- [ ] T004 [P] Create `extension/manifest.config.ts` generating both the
  Chrome manifest and the Firefox variant (`browser_specific_settings.gecko.id`)
  from one source object (FR-008)

---

## Phase 2: Foundational

**Purpose**: The extension's background service worker and API client that
every UI state (connect/feed/offline) depends on.

- [ ] T005 Create `extension/src/lib/api.ts`: fetch wrapper using
  `webextension-polyfill`'s `browser` namespace, attaches the stored bearer
  token, calls `/api/v1/device/*` (specs/003) and `/api/v1/feed`; maps a
  `401 reauthenticate_required` response to a typed "needs reconnect" result
  so callers don't hand-parse error bodies
- [ ] T006 Create `extension/src/background.ts`: service worker owning the
  specs/003 device-flow polling loop and `browser.storage.local` read/write
  for `accessToken` (depends on T005)

**Checkpoint**: Extension can obtain and store a token; server can serve a
filtered feed. Both sides of the contract exist.

---

## Phase 3: User Story 1 - See subscribed-tag content on every new tab (Priority: P1) 🎯 MVP

**Goal**: The core feed renders on new tab, paginates, and links out.

**Independent Test**: quickstart.md steps 1-6 (assuming already connected).

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create `extension/src/newtab/index.html` +
  `extension/src/newtab/main.tsx` (React root mount)
- [ ] T008 [P] [US1] Create `extension/src/newtab/FeedItem.tsx`: compact
  card rendering a post or tweet (discriminate on `kind`), opens the
  corresponding KSPlatform URL in a new tab on click (FR-006)
- [ ] T009 [US1] Create `extension/src/newtab/App.tsx`: fetches the feed via
  T005, renders the list with infinite scroll (IntersectionObserver,
  consistent with the web app's `InfiniteList` pattern conceptually — not a
  shared component, separate build target), renders T008's `FeedItem` per
  entry, and the FR-007 empty state when `items` is empty with no
  `nextCursor` (depends on T005, T008)
- [ ] T010 [US1] Wire the Tailwind v4 minimal config for `extension/`
  (own `@theme`, not shared tokens with `src/app/globals.css` per plan.md)
  so `FeedItem`/`App` have consistent, non-default styling

**Checkpoint**: quickstart.md steps 3-6 pass for an already-connected user.

---

## Phase 4: User Story 2 - Not connected yet (Priority: P2)

**Goal**: Fresh installs get a clear connect path, not a broken feed.

**Independent Test**: quickstart.md steps 1-2.

### Implementation for User Story 2

- [ ] T011 [US2] Extend `extension/src/newtab/App.tsx` (from T009): when
  `browser.storage.local` has no `accessToken`, render a "Connect your
  KSPlatform account" call-to-action instead of attempting a feed fetch
  (depends on T009)
- [ ] T012 [US2] Wire the connect CTA to trigger T006's device-flow polling
  loop (open `verification_uri_complete` in a new browser tab, start
  polling, update `App.tsx`'s state to the feed view once a token is stored)

**Checkpoint**: quickstart.md steps 1-2 pass.

---

## Phase 5: User Story 3 - Graceful fallback when disconnected/offline (Priority: P3)

**Goal**: Revoked tokens and offline conditions degrade to a clear state,
never a blank page or crash.

**Independent Test**: quickstart.md steps 7-8.

### Implementation for User Story 3

- [ ] T013 [US3] In `extension/src/newtab/App.tsx`: on a `401
  reauthenticate_required` result from T005, clear the stored token and
  fall back to T011's connect prompt (not a raw error) — depends on T005,
  T011
- [ ] T014 [US3] In `extension/src/newtab/App.tsx`: on a network failure
  (fetch rejects/times out), render a distinct offline state with a retry
  button, distinguishable from the "not connected" state — depends on T009

**Checkpoint**: quickstart.md steps 7-8 pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T015 Run `npx tsc --noEmit` + `npm run lint` at repo root
- [ ] T016 Run `cd extension && npx tsc --noEmit && npm run lint`
- [ ] T017 Run the full `quickstart.md` manual smoke test in Chrome
- [ ] T018 Run the full `quickstart.md` manual smoke test in Firefox
  (SC-003 requires both, not just Chrome)
- [ ] T019 Update `README.md` with an "Extension" section (build/load
  instructions) once verified in both browsers

---

## Dependencies & Execution Order

- **Setup (T001-T004)**: T001→T002 sequential (same feature, T002 calls
  T001); T003, T004 parallel (different files), independent of T001/T002.
- **Foundational (T005-T006)**: Depends on Setup (T005 calls the
  `/api/v1/*` contracts T002 and specs/003 already define); T006 depends on
  T005.
- **User Story 1 (T007-T010)**: Depends on Foundational. T007, T008
  parallel; T009 depends on both; T010 depends on T009 existing (styles
  target real markup).
- **User Story 2 (T011-T012)**: Depends on User Story 1's `App.tsx` (T009)
  and Foundational's T006.
- **User Story 3 (T013-T014)**: Depends on User Story 2 (T011) for the
  fallback target and User Story 1 (T009) for the feed-fetch path it
  intercepts.
- **Polish (T015-T019)**: Depends on all user stories.

## Parallel Example: Setup

```bash
Task: "Scaffold extension/ package.json, tsconfig.json, vite.config.ts"
Task: "Create extension/manifest.config.ts for Chrome + Firefox manifests"
```

## Implementation Strategy

### MVP First (User Story 1 Only, assuming manual token injection for testing)

1. Setup + Foundational (T001-T006)
2. User Story 1 (T007-T010)
3. **STOP and VALIDATE**: quickstart.md steps 3-6, with a token manually
   placed in `storage.local` for testing (User Story 2's real connect UI
   isn't built yet at this checkpoint)

### Incremental Delivery

1. Setup + Foundational → contract satisfied both sides
2. US1 → feed renders, paginates, links out
3. US2 → real connect flow replaces the manual-token testing shortcut
4. US3 → graceful degradation
5. Polish → cross-browser verification + docs

## Notes

- Hard prerequisite: specs/003 must be implemented first — T002 and T005
  call helpers/contracts that don't exist until that feature ships.
- Per user instruction, implementation (`/speckit-implement`) is paused
  after this tasks.md until the plan is reviewed — do not run T001+ without
  explicit go-ahead, and do not start this feature's tasks before specs/003
  is actually done (not just planned).
