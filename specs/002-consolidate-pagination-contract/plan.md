# Implementation Plan: Consolidate Duplicate Cursor-Pagination Contract

**Branch**: `002-consolidate-pagination-contract` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-consolidate-pagination-contract/spec.md`

## Summary

Nine files declare an identical `{ items: T[]; nextCursor: string | null }`
type under nine different names, and two files repeat the same Prisma
id-cursor `skip`/`cursor` argument spread five times. Add one new
`src/lib/pagination.ts` exporting a generic `Page<T>` type and one
`idCursorArgs(cursor)` helper; point every existing declaration/spread at it.
Pure refactor — no query logic, ordering, or pagination behavior changes.

## Technical Context

**Language/Version**: TypeScript (Next.js 16 / React 19 project)

**Primary Dependencies**: None new — reuses the existing `src/lib/*` module
boundary; Prisma types only via the existing `@/generated/prisma/client`.

**Storage**: N/A (type/helper-only change, no schema or query-shape changes)

**Testing**: `npx tsc --noEmit` + `npm run lint` (SC-003); manual smoke test
of every infinite-scroll list against the Docker stack (SC-004).

**Target Platform**: Existing KSPlatform web app (unchanged)

**Project Type**: Web application (single Next.js project)

**Performance Goals**: N/A — type/helper consolidation has no runtime cost;
the id-cursor helper compiles to the same object shape as the inline spread.

**Constraints**: MUST NOT change any list query's ordering, page size, or
returned data (FR-005); MUST NOT force offset/timestamp-cursor code through
the id-cursor helper (FR-004).

**Scale/Scope**: 7 files touched (`InfiniteList.tsx`, `users.ts`, `admin.ts`,
`profileFeed.ts`, `search.ts`, `tweets.ts`, `timeline.ts`) + 1 new file
(`src/lib/pagination.ts`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Reuse Before Reinvention**: PASS — consolidates 9 duplicate types and
  5 duplicate query-arg spreads into one each.
- **II. Mutations Are Server Actions**: N/A — these are read/list actions,
  not mutations; no change to the server-action pattern itself.
- **III. Version-Pinned Correctness**: PASS — no framework-version-sensitive
  code touched; Prisma cursor pagination usage pattern is unchanged, only
  extracted.
- **IV. Composable, Disjoint Design Tokens**: N/A — no design-token surface.
- **V. Evidence-Driven Refactoring**: PASS — target chosen directly from the
  graphify report's repeated-shape signal (see spec Input).
- **VI. No Speculative Abstraction**: PASS — the helper is scoped to exactly
  the id-cursor case that's actually duplicated 5x today (FR-004 explicitly
  excludes forcing the different offset/timestamp cursor schemes through
  it, which would be speculative over-generalization).

No violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-consolidate-pagination-contract/
├── plan.md              # This file
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

research.md and contracts/ are omitted: no NEEDS CLARIFICATION unknowns, and
this is an internal type/helper change with no external interface to
contract.

### Source Code (repository root)

```text
src/
├── lib/
│   └── pagination.ts     # NEW: generic Page<T> type + idCursorArgs() helper
├── components/
│   └── InfiniteList.tsx  # remove local Page<T>, import shared type
├── lib/
│   └── users.ts          # remove UserPage, use Page<UserSummary>
└── actions/
    ├── admin.ts           # remove local Page<T>, use shared Page<T> + idCursorArgs()
    ├── profileFeed.ts     # remove Profile{Post,Tweet}Page, use shared Page<T> + idCursorArgs()
    ├── search.ts           # remove {Post,Tweet}SearchPage, use shared Page<T> (offset cursor unchanged)
    ├── tweets.ts           # remove TweetPage, use Page<TweetView>
    └── timeline.ts         # remove TimelinePage, use Page<FeedItem> (timestamp cursor unchanged)
```

**Structure Decision**: Single Next.js project, existing structure. The
shared type and helper live in a new `src/lib/pagination.ts` rather than an
existing `lib/*` file, since none of the current files (feed, tweets, users,
etc.) are a generic-enough home and `"use server"` files may only export
async functions.

## Complexity Tracking

No constitution violations — table not needed.
