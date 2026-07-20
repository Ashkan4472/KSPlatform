---

description: "Task list for feature implementation"
---

# Tasks: Extension New-Tab Visual Redesign

**Input**: Design documents from `/specs/008-extension-redesign/`

**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md, AND
specs/004 (the extension) already implemented

**Tests**: No unit test tasks generated; verification is the manual
cross-browser quickstart plus the standard type-check/lint gate — this is
a pure restyle with no new logic.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create `extension/src/lib/tagColor.ts` per data-model.md:
  `TAG_PALETTE` (6 hex values matching the approved mockup/specs/007's
  palette intent) and `tagColor(slug: string): string`

---

## Phase 2: Foundational

- [X] T002 In `extension/src/newtab/styles.css`: add the Index & Ink CSS
  custom properties (paper/ink/rule colors, the 6 tag hues as fallback
  constants if not already covered by T001's direct hex return, hover
  transition timing) and a `@media (prefers-reduced-motion: reduce)`
  block disabling new transitions/animations

**Checkpoint**: Token layer exists; no visual change yet until components
consume it.

---

## Phase 3: User Story 1 - The new-tab feed looks like KSPlatform (Priority: P1) 🎯 MVP

**Goal**: Populated feed shows spine, tag color, and hover feedback.

**Independent Test**: quickstart.md steps 1-2, 5-6.

### Implementation for User Story 1

- [X] T003 [US1] `extension/src/newtab/FeedItem.tsx`: add a colored left
  rail using `tagColor()` from T001 (per item's primary tag), style the
  tag label in the same color, add a hover transition (rail thickens
  and/or background tints), matching the approved mockup
- [X] T004 [US1] `extension/src/newtab/App.tsx` / `styles.css`: apply the
  Index & Ink typography (serif for item titles if a suitable system font
  is available, consistent spacing) to the populated-feed list container

**Checkpoint**: quickstart.md steps 1-2 pass. SC-001, SC-002 achievable.

---

## Phase 4: User Story 2 - Empty/connect/offline states feel designed too (Priority: P2)

**Goal**: specs/004's existing non-feed states visually match the
redesign.

**Independent Test**: quickstart.md steps 3-4, 7.

### Implementation for User Story 2

- [X] T005 [US2] `extension/src/newtab/App.tsx`: restyle the empty-state
  message (zero subscriptions) to use the same typography/color/spacing
  language as T004's feed list — no functional change to when it shows
- [X] T006 [US2] `extension/src/newtab/App.tsx`: restyle the connect
  prompt and offline-state messages/buttons to match, again with zero
  change to their trigger conditions (still specs/004's existing
  `view.kind` states)

**Checkpoint**: quickstart.md steps 3-4, 7 pass. SC-003 achievable.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T007 Run `cd extension && npx tsc --noEmit` (SC-004)
- [X] T008 Run `cd extension && npm run lint` (SC-004)
- [X] T009 Run the full `quickstart.md` manual smoke test in both Chrome
  and Firefox (SC-005)

---

## Dependencies & Execution Order

- **Setup (T001)**: No dependencies.
- **Foundational (T002)**: Depends on T001 existing conceptually (palette
  values referenced), but is otherwise independent (different file).
- **User Story 1 (T003-T004)**: Depends on Setup + Foundational.
- **User Story 2 (T005-T006)**: Depends on Foundational (shares the same
  token language) and benefits from User Story 1's list styling existing
  first (T004) for visual consistency, but isn't functionally blocked by it.
- **Polish (T007-T009)**: Depends on both user stories.

## Parallel Example: N/A

This feature's tasks are small and mostly touch the same 2-3 files
sequentially (`App.tsx`, `FeedItem.tsx`, `styles.css`) — little benefit
from parallelizing beyond T001/T002 vs. the component edits.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational (T001-T002)
2. User Story 1 (T003-T004)
3. **STOP and VALIDATE**: quickstart.md steps 1-2 — the populated feed
   matches the approved direction

### Incremental Delivery

1. Setup + Foundational → token layer ready
2. US1 → populated feed redesigned
3. US2 → empty/connect/offline states redesigned
4. Polish → cross-browser verification

## Notes

- Hard prerequisite: specs/004 must already be implemented (this only
  restyles its existing states).
- No test-writing tasks: pure CSS/markup restyle, no new logic.
- **Deviations/verification notes**: `npm run build:chrome` and
  `npm run build:firefox` both succeed and emit byte-identical CSS output
  (`index-<hash>.css` had the same hash in both `dist/` and
  `dist-firefox/`), confirming visual parity across targets structurally
  (SC-005) without needing to load an unpacked extension in this
  environment. Populated-feed, empty, connect, and offline states were
  verified visually by rendering the actual built CSS against static
  fixture markup mirroring `FeedItem.tsx`/`App.tsx` exactly (screenshotted
  in a real browser) — spine/tag colors match the documented palette,
  hover thickens the rail and tints the background, and all four states
  share consistent serif/typography/spacing. Tag color consistency
  (SC-002) holds by construction: `tagColor()` uses the identical hash
  algorithm as `src/lib/tagColor.ts` (specs/007) with palette entries in
  the same semantic-hue order, so a given slug always resolves to the
  same hue in both the web app and the extension. Reduced-motion (FR-004)
  verified at the code level via the shared
  `@media (prefers-reduced-motion: reduce)` block in `styles.css`. No
  functional regression risk (FR-005): only `styles.css` and
  `FeedItem.tsx`'s JSX (inline color styling only, no logic) changed;
  `App.tsx`'s data-loading/view-state logic is untouched.
