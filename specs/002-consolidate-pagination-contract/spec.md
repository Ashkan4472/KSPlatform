# Feature Specification: Consolidate Duplicate Cursor-Pagination Contract

**Feature Branch**: `002-consolidate-pagination-contract`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "graphify's knowledge graph shows the identical
`{ items: T[]; nextCursor: string | null }` shape reimplemented under 9
different local names across 6 files (InfiniteList.tsx's `Page<T>`,
admin.ts's `Page<T>`, users.ts's `UserPage`, profileFeed.ts's
`ProfilePostPage`/`ProfileTweetPage`, search.ts's
`PostSearchPage`/`TweetSearchPage`, tweets.ts's `TweetPage`, timeline.ts's
`TimelinePage`), plus the identical Prisma `skip: 1, cursor: { id }` spread
copy-pasted 5 times across admin.ts and profileFeed.ts's id-cursor list
queries. Consolidate the type into one generic contract and the id-cursor
spread into one shared helper."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One generic page-result contract (Priority: P1)

As a developer adding a new paginated list (a new admin table, a new feed
type), I want to import one generic `Page<T>` type instead of writing a new
`XPage` alias, so the item-loading contract between server actions and
`InfiniteList` stays provably identical everywhere it's used.

**Why this priority**: This is the entire feature — every other benefit
(fewer files touched when the contract changes, no risk of two page types
silently drifting) depends on there being exactly one declaration.

**Independent Test**: Replace all 9 local declarations with imports of one
shared generic type; confirm the project still type-checks and every
paginated list (feed, profile posts/tweets, search results, admin
users/posts/tweets, timeline) still loads more items on scroll exactly as
before.

**Acceptance Scenarios**:

1. **Given** `InfiniteList.tsx`, `admin.ts`, `users.ts`, `profileFeed.ts`,
   `search.ts`, `tweets.ts`, and `timeline.ts` each declare their own
   `{ items; nextCursor }`-shaped type, **When** the consolidation is
   complete, **Then** none of these files declares its own page type — all
   import one shared generic type.
2. **Given** a component calls `<InfiniteList loadMore={someAction} ... />`
   for any existing entity (posts, tweets, users, admin rows, search
   results), **When** the consolidation is complete, **Then** that component
   compiles and infinite-scroll still works unchanged.

---

### User Story 2 - One shared id-cursor pagination helper (Priority: P2)

As a developer writing a new Prisma id-cursor query (like the existing admin
list queries), I want to reuse one small helper for the `skip`/`cursor`
argument spread, so the exact pagination semantics (skip the cursor row
itself, resume after it) can't accidentally diverge between list queries
that are supposed to behave identically.

**Why this priority**: Secondary to the type consolidation — this addresses
the second, smaller duplication (identical Prisma query-argument spread
copy-pasted 5 times), scoped only to the id-cursor style queries (admin.ts,
profileFeed.ts). It does not touch the offset/timestamp-cursor queries in
search.ts or timeline.ts, which use a genuinely different pagination scheme
and would be a wrong abstraction to force into the same helper.

**Independent Test**: Replace the 5 duplicated `...(cursor ? { skip: 1,
cursor: { id: cursor } } : {})` spreads with calls to one shared helper;
confirm the affected list queries (admin users/posts/tweets, profile
posts/tweets) return identical pages before and after.

**Acceptance Scenarios**:

1. **Given** `admin.ts`'s three list queries and `profileFeed.ts`'s two list
   queries each inline the same cursor-args spread, **When** the
   consolidation is complete, **Then** all five call one shared helper
   instead of repeating the inline object.
2. **Given** a caller requests a page with no cursor (first page), **When**
   the helper is used, **Then** the query behaves exactly as the inline
   version did (no `skip`/`cursor` args applied).

### Edge Cases

- What happens for pagination schemes that are NOT id-cursor-based (the
  offset-based search results, the ISO-timestamp-based timeline)? These are
  explicitly out of scope for the User Story 2 helper — they keep their own
  cursor construction, since forcing a shared helper across a different
  cursor semantic would be the wrong abstraction, not a fix.
- What happens if a future entity's page type needs an extra field beyond
  `items`/`nextCursor` (e.g. a total count)? Out of scope for this feature —
  the generic `Page<T>` covers today's exact 9 identical shapes only; a
  future differently-shaped page result simply doesn't use it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The codebase MUST define exactly one generic page-result type
  (`items` + `nextCursor`), shared by every list currently duplicating it.
- **FR-002**: `InfiniteList.tsx`, `src/lib/users.ts`, and
  `src/actions/{admin,profileFeed,search,tweets,timeline}.ts` MUST import the
  shared generic type instead of declaring their own.
- **FR-003**: The codebase MUST define exactly one helper for the Prisma
  id-cursor `skip`/`cursor` argument spread, used by every id-cursor query
  currently duplicating it (`admin.ts`'s 3 queries, `profileFeed.ts`'s 2
  queries).
- **FR-004**: Offset-based and timestamp-based cursor logic (`search.ts`,
  `timeline.ts`) MUST NOT be forced through the id-cursor helper — they are a
  different pagination scheme and stay as-is.
- **FR-005**: No exported function's observable return shape or any
  component's `loadMore` contract may change for existing callers.

### Key Entities

- **Page&lt;T&gt;**: The shared generic pagination-result contract — a list
  of items of type `T` plus an optional-if-exhausted `nextCursor` string,
  returned by every paginated server action and consumed by `InfiniteList`.
- **Id-cursor query args**: The shared Prisma argument fragment
  (`skip`/`cursor`) that resumes an id-ordered list query after a given row
  id, used only by the admin and profile list queries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero duplicate page-result type declarations remain across
  `InfiniteList.tsx` and `src/actions/*`/`src/lib/users.ts` (down from 9).
- **SC-002**: Zero duplicate inline id-cursor `skip`/`cursor` spreads remain
  in `admin.ts`/`profileFeed.ts` (down from 5).
- **SC-003**: `npx tsc --noEmit` and `npm run lint` both pass with no new
  errors or warnings introduced by this change.
- **SC-004**: Manual verification shows every infinite-scroll list (feed,
  profile posts/tweets, search results, admin users/posts/tweets) still
  loads additional pages identically to before the change.

## Assumptions

- This is a type- and helper-level change only — no query logic, ordering,
  or page size changes for any list.
- `src/lib/pagination.ts` (new file) is the correct home for both the shared
  type and the id-cursor helper, consistent with this project's convention of
  centralizing reusable cross-action helpers/types in `src/lib/*`.
- None of the 9 existing type aliases (`UserPage`, `ProfilePostPage`, etc.)
  are imported by name from outside their defining file (verified by
  search); removing them in favor of the generic type is safe for all
  current call sites.
