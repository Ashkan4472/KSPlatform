# Implementation Plan: Security & Maintainability Hardening

**Branch**: `005-security-maintainability-hardening` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-security-maintainability-hardening/spec.md`

## Summary

Add one synchronous helper, `canModerate(user)`, to `src/lib/session.ts`
that takes an already-fetched user/session object and returns the same
boolean every scattered `user?.role === "ADMIN"` check computes today.
Replace all 10 inline call sites with calls to this helper. Align
`updatePreferencesAction` to resolve its caller via `getCurrentUser()`
instead of calling `auth()` directly. Pure refactor — no behavior change.

## Technical Context

**Language/Version**: TypeScript (Next.js 16 / React 19 project)

**Primary Dependencies**: None new — reuses `src/lib/session.ts`, already
imported everywhere this touches.

**Storage**: N/A (no schema/data changes)

**Testing**: `npx tsc --noEmit` + `npm run lint`; manual verification that
moderation UI (admin badges, delete buttons) is unchanged for both an
admin and a regular user across every affected page.

**Target Platform**: Existing KSPlatform web app (unchanged)

**Project Type**: Web application (single Next.js project)

**Performance Goals**: N/A — pure refactor, no runtime cost difference.

**Constraints**: MUST NOT change any page's rendered output for either an
admin or non-admin viewer (FR-004).

**Scale/Scope**: 10 files touched to replace the inline check
(`src/app/page.tsx`, `posts/[slug]/page.tsx`, `u/[id]/page.tsx`,
`search/page.tsx`, `tweets/page.tsx`, `tweets/[id]/page.tsx`,
`UserMenu.tsx`, `AdminTabs.tsx`, `UserCard.tsx`, and `session.ts`'s own
`isAdmin()` which is refactored to call the new helper instead of
duplicating the comparison) + 1 file for the `preferences.ts` alignment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Reuse Before Reinvention**: PASS — this feature *is* the reuse fix;
  `isAdmin()` itself is refactored to call the new synchronous helper
  rather than duplicating its own comparison, so there is exactly one
  implementation of "is this an admin" left in the codebase.
- **II. Mutations Are Server Actions (Web App)**: PASS — no new mutation
  pathway; `updatePreferencesAction` remains a server action, only its
  session-resolution call changes.
- **III. Version-Pinned Correctness**: PASS — no framework-version-
  sensitive code touched.
- **IV. Composable, Disjoint Design Tokens**: N/A.
- **V. Evidence-Driven Refactoring**: PASS — target chosen from an actual
  codebase search (10 files, documented in spec.md's Input/Notes), not
  general instinct.
- **VI. No Speculative Abstraction**: PASS — `canModerate(user)` takes and
  returns exactly what's needed today (a user-shaped object in, a boolean
  out). It deliberately does NOT forward-guess specs/006's future
  permission-check API shape (e.g. resource:action parameters) — FR-005 is
  satisfied by having one call site to update later, not by speculatively
  designing that API now.
- **VII. External-Client API Is a Deliberate, Scoped Exception**: N/A — no
  `/api/v1/*` surface touched.

No violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-security-maintainability-hardening/
├── plan.md              # This file
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

research.md and contracts/ are omitted: no NEEDS CLARIFICATION unknowns,
and this is a purely internal refactor with no external interface.

### Source Code (repository root)

```text
src/
├── lib/
│   └── session.ts                   # + canModerate(user), isAdmin() calls it
├── actions/
│   └── preferences.ts                # use getCurrentUser() instead of auth()
├── app/
│   ├── page.tsx                      # use canModerate(user)
│   ├── posts/[slug]/page.tsx         # use canModerate(user)
│   ├── u/[id]/page.tsx               # use canModerate(user) (both call sites)
│   ├── search/page.tsx               # use canModerate(user)
│   ├── tweets/page.tsx                # use canModerate(user)
│   └── tweets/[id]/page.tsx           # use canModerate(user)
└── components/
    ├── layout/UserMenu.tsx            # use canModerate({ role })
    ├── admin/AdminTabs.tsx            # use canModerate({ role: u.role })
    └── people/UserCard.tsx            # use canModerate({ role: user.role })
```

**Structure Decision**: No new files, no new directories — every change is
an edit to an existing file, consistent with this being a pure
consolidation refactor.

## Complexity Tracking

No constitution violations — table not needed.
