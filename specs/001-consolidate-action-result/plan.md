# Implementation Plan: Consolidate Duplicate ActionResult Type

**Branch**: `001-consolidate-action-result` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-consolidate-action-result/spec.md`

## Summary

Five files under `src/actions/*` each locally redeclare an identical (or
near-identical) `ActionResult` mutation-result type. Replace all five with a
single shared type exported from `src/lib/actions.ts`, sized as the superset
`{ error?: string; ok?: boolean }` so `profile.ts`'s extra `ok` field is
preserved without forcing it on the other four call sites. Pure type-level
change — no server action logic, validation, or authorization changes.

## Technical Context

**Language/Version**: TypeScript (Next.js 16 / React 19 project)

**Primary Dependencies**: None new — reuses the existing `src/actions/*` /
`src/lib/*` module boundary already established in this project.

**Storage**: N/A (type-only change, no schema/data changes)

**Testing**: `npx tsc --noEmit` (type-check gate) + `npm run lint`; manual
smoke test of create/update/delete flows against the Docker stack per
Success Criteria SC-003.

**Target Platform**: Existing KSPlatform web app (unchanged)

**Project Type**: Web application (single Next.js project, no new project axis)

**Performance Goals**: N/A — type-only change has no runtime performance impact

**Constraints**: MUST NOT change any exported function's observable return
shape for existing callers (FR-005)

**Scale/Scope**: 5 files touched (`src/actions/posts.ts`, `admin.ts`,
`comments.ts`, `profile.ts`, `tweets.ts`) + 1 new export in `src/lib/actions.ts`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Reuse Before Reinvention**: PASS — this feature *is* the reuse fix;
  after this change there is one `ActionResult` to import, not five to copy.
- **II. Mutations Are Server Actions**: PASS — no change to the server-action
  boundary, validation, or auth-check pattern; only the result type's home
  changes.
- **III. Version-Pinned Correctness**: PASS — no framework-version-sensitive
  code is touched.
- **IV. Composable, Disjoint Design Tokens**: N/A — no design-token surface
  touched.
- **V. Evidence-Driven Refactoring**: PASS — target chosen directly from the
  graphify report's repeated-node-label signal (see spec Input), not general
  instinct.
- **VI. No Speculative Abstraction**: PASS — this consolidates an *existing*
  5x duplication into one type; it does not add a new abstraction layer,
  generic wrapper, or config surface beyond the single type export.

No violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-consolidate-action-result/
├── plan.md              # This file
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

research.md and contracts/ are omitted: there are no NEEDS CLARIFICATION
unknowns (Technical Context above is fully resolved from the existing
codebase), and this is a purely internal type change with no external
interface to contract.

### Source Code (repository root)

```text
src/
├── actions/
│   ├── posts.ts       # remove local ActionResult, import shared type
│   ├── admin.ts        # remove local ActionResult, import shared type
│   ├── comments.ts     # remove local ActionResult, import shared type
│   ├── profile.ts      # remove local ActionResult, import shared type
│   └── tweets.ts       # remove local ActionResult, import shared type
└── lib/
    └── actions.ts       # NEW: shared `ActionResult` type export
```

**Structure Decision**: Single Next.js project (existing structure, no new
directory). The shared type is added to a new small `src/lib/actions.ts`
module rather than an existing `lib/*` file, since none of the current
`lib/*` files (session, tagging, s3, comments, slug, markdown, format) are a
natural fit for a generic action-result contract, and `"use server"` files
may only export async functions so it cannot live in `src/actions/*` itself.

## Complexity Tracking

No constitution violations — table not needed.
