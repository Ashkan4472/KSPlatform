# Implementation Plan: IAM Module with Per-User Permission Overrides

**Branch**: `006-iam-rbac` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-iam-rbac/spec.md`

## Summary

Add a fixed, code-defined permission catalog (`posts:moderate`,
`tweets:moderate`, `comments:moderate`, `users:manage`, `tags:manage`) and
one new `UserPermission` grant table. `ADMIN`-role users implicitly hold
every permission (unchanged behavior); a `USER`-role account can be
individually granted or revoked any specific permission by an admin. Two
new async helpers (`hasPermission`, `listEffectivePermissions`) sit
alongside specs/005's `canModerate` — `canModerate` stays as the "is this
person an admin" role check (used for role badges and admin-surface
access), while the new helpers gate the *specific* moderation actions that
should now be individually delegable. A new `/admin/permissions` screen
lets an admin search a user, see their effective permissions with source
and grant metadata, and grant/revoke individual permissions.

## Technical Context

**Language/Version**: TypeScript (Next.js 16 Server Actions + React 19 UI)

**Primary Dependencies**: None new — reuses Prisma 7, `zod`, existing
shadcn/ui components (`Select`, `Table`/`div`-based rows, `Badge`,
`ConfirmDialog`).

**Storage**: PostgreSQL via Prisma — one new table: `UserPermission`.

**Testing**: `npx tsc --noEmit` + `npm run lint`; manual quickstart
covering grant, revoke, and the three integration points (comment
moderation, and the `/admin` Users/Posts/Tweets tabs individually gated).

**Target Platform**: Existing KSPlatform web app (new page + actions only)

**Project Type**: Web application (single Next.js project)

**Performance Goals**: Permission checks are single-row lookups by a
unique `(userId, permission)` index — negligible cost, no caching layer
needed for this scale (Principle VI).

**Constraints**: MUST NOT change behavior for existing `ADMIN` users
(FR-003 — role continues to imply every permission). MUST NOT require
re-login for a grant/revoke to take effect (FR-007 — no session-embedded
permission cache).

**Scale/Scope**: 1 new Prisma model, 1 new code-level permission catalog
module, 2 new helpers in `src/lib/session.ts`, 1 new actions file
(~4 functions), 1 new admin page + 1 component, and edits to 3-4 existing
moderation-gate call sites (comment delete, and the `/admin` tabs) to use
the new granular checks instead of the coarser `canModerate`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Reuse Before Reinvention**: PASS — builds directly on specs/005's
  `canModerate`/session-helper consolidation instead of introducing a
  parallel authorization pathway; reuses `ConfirmDialog`, existing admin
  page conventions, existing zod validation pattern.
- **II. Mutations Are Server Actions (Web App)**: PASS — grant/revoke are
  `"use server"` actions in a new `src/actions/iam.ts`, following the same
  `requireAdmin()` + zod + `revalidatePath` pattern as `admin.ts`.
- **III. Version-Pinned Correctness**: PASS — new Prisma model follows
  existing `cuid()`/relation conventions; no framework-version-sensitive
  shortcuts.
- **IV. Composable, Disjoint Design Tokens**: N/A.
- **V. Evidence-Driven Refactoring**: N/A — new functionality, driven by
  explicit user requirement, not a graphify finding.
- **VI. No Speculative Abstraction**: PASS — the permission catalog is a
  fixed, small, code-level list (not a user-editable/dynamic permission
  registry, not a generic policy-rule engine); no caching layer added
  ahead of a demonstrated need.
- **VII. External-Client API Is a Deliberate, Scoped Exception**: N/A — no
  `/api/v1/*` surface touched; this is entirely web-app-internal.

No unjustified violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/006-iam-rbac/
├── plan.md              # This file
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

research.md and contracts/ are omitted: no NEEDS CLARIFICATION unknowns
remain, and this feature has no external-facing API — only server actions
and pages internal to the web app.

### Source Code (repository root)

```text
prisma/
└── schema.prisma                       # + UserPermission model

src/
├── lib/
│   ├── permissions.ts                  # NEW: PERMISSIONS catalog + labels
│   └── session.ts                      # + hasPermission(), + listEffectivePermissions()
├── actions/
│   └── iam.ts                          # NEW: grantPermissionAction,
│                                       # revokePermissionAction,
│                                       # listEffectivePermissionsAction,
│                                       # searchUsersForIamAction
├── app/
│   └── admin/
│       └── permissions/
│           └── page.tsx                # NEW: search a user, view + grant/revoke
├── components/
│   ├── admin/
│   │   └── AdminTabs.tsx               # each tab's delete action uses its
│   │                                   # own hasPermission() instead of canModerate()
│   └── iam/
│       └── PermissionsEditor.tsx       # NEW: user search + effective-permission list + grant/revoke UI
└── components/comments/
    └── (comment delete control)        # uses hasPermission(user, "comments:moderate")
                                        # instead of the generic canModerate()
```

**Structure Decision**: Existing single Next.js project. New IAM surface
lives under `/admin/permissions` (admin-only, consistent with the existing
`/admin` area) rather than a new top-level route group.

## Complexity Tracking

No constitution violations — table not needed.
