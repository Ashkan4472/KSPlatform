---

description: "Task list for feature implementation"
---

# Tasks: Consolidate Duplicate Cursor-Pagination Contract

**Input**: Design documents from `/specs/002-consolidate-pagination-contract/`

**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

**Tests**: Not requested beyond the manual quickstart smoke test (SC-004)
and the type-check/lint gate (SC-003) — no unit test tasks generated.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared type and helper all user stories depend on.

- [X] T001 Create `src/lib/pagination.ts` exporting
  `export type Page<T> = { items: T[]; nextCursor: string | null };` and
  `export function idCursorArgs(cursor?: string | null) { return cursor ? { skip: 1 as const, cursor: { id: cursor } } : {}; }`

---

## Phase 2: Foundational

No additional foundational work — T001 alone unblocks every user story.

**Checkpoint**: `src/lib/pagination.ts` exists and exports `Page<T>` and `idCursorArgs`.

---

## Phase 3: User Story 1 - One generic page-result contract (Priority: P1) 🎯 MVP

**Goal**: Every file that currently declares its own `{ items; nextCursor }`
type imports the shared `Page<T>` instead.

**Independent Test**: `npx tsc --noEmit` passes and none of the 7 files below
declares its own page type.

### Implementation for User Story 1

- [X] T002 [P] [US1] In `src/components/InfiniteList.tsx`: remove
  `type Page<T> = { items: T[]; nextCursor: string | null };` and import
  `import type { Page } from "@/lib/pagination";`
- [X] T003 [P] [US1] In `src/lib/users.ts`: remove
  `export type UserPage = { items: UserSummary[]; nextCursor: string | null };`,
  import `import type { Page } from "@/lib/pagination";`, and change the
  function signature that returned `UserPage` to return `Page<UserSummary>`
- [X] T004 [P] [US1] In `src/actions/admin.ts`: remove
  `type Page<T> = { items: T[]; nextCursor: string | null };` and import
  `import type { Page } from "@/lib/pagination";` (the three function
  signatures already reference `Page<T>` by name, so they resolve to the
  import unchanged)
- [X] T005 [P] [US1] In `src/actions/profileFeed.ts`: remove
  `ProfilePostPage`/`ProfileTweetPage`, import
  `import type { Page } from "@/lib/pagination";`, and change
  `loadUserPosts`/`loadUserTweets` signatures to return
  `Page<FeedPost>`/`Page<TweetView>`
- [X] T006 [P] [US1] In `src/actions/search.ts`: remove
  `PostSearchPage`/`TweetSearchPage`, import
  `import type { Page } from "@/lib/pagination";`, and change
  `searchPosts`/`searchTweets` signatures to return
  `Page<FeedPost>`/`Page<TweetView>` (offset-cursor body unchanged)
- [X] T007 [P] [US1] In `src/actions/tweets.ts`: remove
  `export type TweetPage = { items: TweetView[]; nextCursor: string | null };`,
  import `import type { Page } from "@/lib/pagination";`, and change the
  function signature that returned `TweetPage` to return `Page<TweetView>`
- [X] T008 [P] [US1] In `src/actions/timeline.ts`: remove
  `export type TimelinePage = { items: FeedItem[]; nextCursor: string | null };`,
  import `import type { Page } from "@/lib/pagination";`, and change
  `loadTimeline`'s signature to return `Page<FeedItem>` (timestamp-cursor
  body unchanged)

**Checkpoint**: Zero duplicate page-result type declarations remain (SC-001).
`npx tsc --noEmit` passes.

---

## Phase 4: User Story 2 - One shared id-cursor pagination helper (Priority: P2)

**Goal**: The 5 duplicated id-cursor Prisma spreads call the shared helper.

**Independent Test**: `npx tsc --noEmit` passes and no
`...(cursor ? { skip: 1, cursor: { id: cursor } } : {})` inline spread
remains in `admin.ts`/`profileFeed.ts`.

### Implementation for User Story 2

- [X] T009 [US2] In `src/actions/admin.ts`: replace all three
  `...(cursor ? { skip: 1, cursor: { id: cursor } } : {})` spreads
  (`adminListUsers`, `adminListPosts`, `adminListTweets`) with
  `...idCursorArgs(cursor)`, importing `idCursorArgs` from
  `@/lib/pagination` (depends on T004 already importing from that module)
- [X] T010 [US2] In `src/actions/profileFeed.ts`: replace both
  `...(cursor ? { skip: 1, cursor: { id: cursor } } : {})` spreads
  (`loadUserPosts`, `loadUserTweets`) with `...idCursorArgs(cursor)`,
  importing `idCursorArgs` from `@/lib/pagination` (depends on T005 already
  importing from that module)

**Checkpoint**: Zero duplicate id-cursor spreads remain (SC-002).

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T011 Run `npx tsc --noEmit` (final confirmation, SC-003)
- [X] T012 Run `npm run lint` (SC-003)
- [ ] T013 Run the manual quickstart smoke test in
  `specs/002-consolidate-pagination-contract/quickstart.md` against the
  Docker stack (SC-004)
  **DEFERRED**: Docker daemon was not running when this feature was
  implemented, so this step could not be executed. Start Docker and run this
  task before considering SC-004 verified.

---

## Dependencies & Execution Order

- **Setup (T001)**: No dependencies — must complete first.
- **User Story 1 (T002-T008)**: Depends on T001. All 7 tasks are parallel
  (different files).
- **User Story 2 (T009-T010)**: Depends on T004/T005 (US1) having already
  switched `admin.ts`/`profileFeed.ts` to import from `@/lib/pagination`.
  T009 and T010 are parallel (different files).
- **Polish (T011-T013)**: Depends on both user stories being complete.

## Parallel Example: User Story 1

```bash
Task: "Remove local Page<T> from InfiniteList.tsx, import shared type"
Task: "Remove UserPage from users.ts, use Page<UserSummary>"
Task: "Remove Page<T> from admin.ts, import shared type"
Task: "Remove Profile{Post,Tweet}Page from profileFeed.ts, use Page<T>"
Task: "Remove {Post,Tweet}SearchPage from search.ts, use Page<T>"
Task: "Remove TweetPage from tweets.ts, use Page<TweetView>"
Task: "Remove TimelinePage from timeline.ts, use Page<FeedItem>"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 (shared type + helper module)
2. T002-T008 (all 7 files migrated to the shared type)
3. **STOP and VALIDATE**: `npx tsc --noEmit` passes, zero duplicate types
   remain — this alone delivers SC-001

### Incremental Delivery

1. T001 → shared module exists
2. US1 (T002-T008) → type duplication eliminated, type-checks
3. US2 (T009-T010) → id-cursor spread duplication eliminated
4. Polish (T011-T013) → final gate + runtime verification

## Notes

- No test-writing tasks: no new business logic, only type/helper extraction
  around existing, unchanged query bodies.
- Commit after Phase 3 (US1) and again after Phase 4 (US2).
- Two deviations from the plan surfaced during implementation:
  1. `UserPage`'s only consumer (`loadMoreUsers`) actually lives in
     `src/actions/feed.ts`, not `src/lib/users.ts` — that file was updated
     too (not in the original 7-file list).
  2. `idCursorArgs`'s return type needed an explicit
     `{ skip?: 1; cursor?: { id: string } }` annotation — without it,
     TypeScript inferred a 2-branch union return type that didn't spread
     cleanly into Prisma's `findMany` argument types (`skip`/`cursor`
     resolved to `undefined` instead of "absent", which Prisma's strict
     optional-property typing rejected).
