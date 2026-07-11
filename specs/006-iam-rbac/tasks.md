---

description: "Task list for feature implementation"
---

# Tasks: IAM Module with Per-User Permission Overrides

**Input**: Design documents from `/specs/006-iam-rbac/`

**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md, AND
specs/005 fully implemented (the `canModerate` seam this extends)

**Tests**: Not requested as unit tests; this is a security-sensitive
authorization feature, so verification tasks (grant, revoke, no-ADMIN-
regression) are first-class, not just polish.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Add `UserPermission` model to `prisma/schema.prisma` per
  `data-model.md` (with `PermissionHolder`/`PermissionGranter` relation
  names on `User` to disambiguate the two FKs to the same table); run
  `npm run db:migrate -- --name add_user_permissions` (check for spurious
  `pg_trgm` index drops per CLAUDE.md before applying); run
  `npx prisma generate`
- [X] T002 [P] Create `src/lib/permissions.ts`: `PERMISSIONS` const tuple
  (`posts:moderate`, `tweets:moderate`, `comments:moderate`,
  `users:manage`, `tags:manage`), `type Permission`, `PERMISSION_LABELS`
  record
- [X] T003 [P] Add a `permissionSchema = z.enum(PERMISSIONS)` (or
  equivalent) to `src/lib/validation.ts` for validating grant/revoke input

---

## Phase 2: Foundational

**Purpose**: The permission-check helpers every user story depends on.

- [X] T004 Add `hasPermission(user: { id: string; role: Role } | null | undefined, permission: Permission): Promise<boolean>`
  to `src/lib/session.ts`: return `true` immediately if
  `canModerate(user)` (i.e. role is `ADMIN`); otherwise look up
  `UserPermission` by `(userId, permission)` and return whether it exists
  (depends on T001, T002, and specs/005's `canModerate`)
- [X] T005 Add `listEffectivePermissions(userId: string): Promise<{ permission: Permission; source: "role" | "grant"; grantedBy?: { name: string }; grantedAt?: Date }[]>`
  to `src/lib/session.ts`: if the user's role is `ADMIN`, return every
  catalog permission with `source: "role"`; otherwise return their
  `UserPermission` rows (with granter name) mapped to `source: "grant"`
  (depends on T001, T002)

**Checkpoint**: Both helpers exist and are unit-testable via manual
`tsx`/console checks if desired; no UI depends on them yet.

---

## Phase 3: User Story 1 - Grant one user a specific capability (Priority: P1) 🎯 MVP

**Goal**: An admin can grant/revoke a specific permission for a specific
user, and it takes effect where it matters (comment moderation as the
concrete first integration point).

**Independent Test**: quickstart.md steps 1-3.

### Implementation for User Story 1

- [X] T006 [US1] Create `src/actions/iam.ts`: `grantPermissionAction(userId, permission)`
  — `requireAdmin()`, validate `permission` with T003's schema, upsert a
  `UserPermission` row (no-op if it already exists per the unique
  constraint), `revalidatePath("/admin/permissions")`
- [X] T007 [US1] In `src/actions/iam.ts`: `revokePermissionAction(userId, permission)`
  — `requireAdmin()`, delete the matching `UserPermission` row if present,
  `revalidatePath("/admin/permissions")`
- [X] T008 [US1] In `src/actions/iam.ts`: `searchUsersForIamAction(query)`
  — `requireAdmin()`, reuse the existing user search pattern (name/email
  `ILIKE`) to find a target user, returning `{ id, name, email, role }[]`
- [X] T009 [US1] In `src/components/comments/CommentItem.tsx`: replace the
  existing moderation-gate check (from specs/005's `canModerate`) with
  `hasPermission(viewer, "comments:moderate")` for the comment's own
  delete control, leaving the post/tweet's own delete control
  untouched (still gated by its own, unrelated check)

**Checkpoint**: quickstart.md steps 1-3 pass. SC-001, SC-002 achievable.

---

## Phase 4: User Story 2 - See and audit who has what access (Priority: P2)

**Goal**: A super admin can view any user's effective permissions with
source and grant metadata, and grant/revoke from that same view.

**Independent Test**: quickstart.md step 4.

### Implementation for User Story 2

- [X] T010 [US2] Create `src/components/iam/PermissionsEditor.tsx`: a user
  search box (calls T008), then for the selected user, a list of every
  catalog permission with a toggle — checked + source label ("From ADMIN
  role" / "Granted by {name} on {date}") for held permissions, calling
  T006/T007 on toggle (depends on T006-T009)
- [X] T011 [US2] Create `src/app/admin/permissions/page.tsx`: `requireAdmin()`,
  render `PermissionsEditor` (depends on T010)

**Checkpoint**: quickstart.md step 4 passes. SC-004 achievable.

---

## Phase 5: User Story 3 - Every admin-gated feature checks the real permission (Priority: P3)

**Goal**: The `/admin` Users/Posts/Tweets tabs are individually accessible
by their respective permission, not gated as an all-or-nothing block.

**Independent Test**: quickstart.md step 5.

### Implementation for User Story 3

- [X] T012 [US3] In `src/app/admin/page.tsx` (or wherever `/admin` currently
  calls `requireAdmin()` wholesale): change the page-level gate to "user
  has at least one of `users:manage`/`posts:moderate`/`tweets:moderate`"
  instead of "user is ADMIN," using T004/T005
- [X] T013 [US3] In `src/components/admin/AdminTabs.tsx`: gate the Users
  tab's visibility and its delete action on `hasPermission(user,
  "users:manage")`, the Posts tab on `hasPermission(user,
  "posts:moderate")`, and the Tweets tab on `hasPermission(user,
  "tweets:moderate")` — each independently, instead of the current
  blanket `canModerate` (depends on T004, T012)

**Checkpoint**: quickstart.md step 5 passes. SC-003 achievable.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T014 Run `npx tsc --noEmit` (SC-005)
- [X] T015 Run `npm run lint` (SC-005)
- [X] T016 Run the full `quickstart.md` manual smoke test, including step 6
  (confirm zero regression for existing `ADMIN` users across every
  moderation surface)
- [X] T017 Update `README.md` with a short "Permissions (IAM)" section
  once verified end-to-end

---

## Dependencies & Execution Order

- **Setup (T001-T003)**: T001 first (schema); T002, T003 can follow in
  parallel with each other but T003 depends on T002's `PERMISSIONS` const.
- **Foundational (T004-T005)**: Depends on Setup. T004 also depends on
  specs/005's `canModerate` already existing.
- **User Story 1 (T006-T009)**: Depends on Foundational. T006, T007, T008
  are parallel (same file, but additive/non-conflicting functions — treat
  as sequential within `iam.ts` in practice); T009 depends on T004.
- **User Story 2 (T010-T011)**: Depends on User Story 1 (T006-T009).
- **User Story 3 (T012-T013)**: Depends on Foundational (T004/T005) only —
  not on User Stories 1-2, though it's naturally verified alongside them.
- **Polish (T014-T017)**: Depends on all user stories.

## Parallel Example: Setup

```bash
Task: "Add UserPermission model, migrate, generate client"
Task: "Create src/lib/permissions.ts catalog"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational (T001-T005)
2. User Story 1 (T006-T009)
3. **STOP and VALIDATE**: quickstart.md steps 1-3 — a specific permission
   can be granted, takes effect narrowly, and revocation is immediate

### Incremental Delivery

1. Setup + Foundational → schema + helpers ready
2. US1 → grant/revoke works, comment moderation is the first delegable capability
3. US2 → full audit/management UI
4. US3 → `/admin` tabs individually gated
5. Polish → full verification + docs

## Notes

- Builds on specs/005: `hasPermission()` calls `canModerate()` as its
  ADMIN shortcut rather than re-deriving the role check.
- Per user instruction, implementation (`/speckit-implement`) is paused
  after this tasks.md until reviewed — do not run T001+ without explicit
  go-ahead, and do not start before specs/005 is actually implemented (not
  just planned), since T004 depends on its `canModerate` helper existing.
- **Architecture pivot during implementation (before US2/US3)**: the flat
  ad-hoc permission list (`posts:moderate`, `tweets:moderate`,
  `comments:moderate`, `users:manage`, `tags:manage`) was replaced, at the
  user's direction, with a real taxonomy: `Feature` (`post`/`tweet`/
  `comment`/`user`) × `Group` (`self`/`all`) × `Action` (`read`/`create`/
  `update`/`delete`), composed via a `permission(feature, group, action)`
  helper into keys like `post:self:delete` / `user:all:delete`.
  - `DEFAULT_USER_PERMISSIONS` (all four `*:self:delete` keys) are now the
    formal representation of capabilities every signed-in user already
    had via ownership checks — no behavior change, just named.
  - `GRANTABLE_PERMISSIONS` (the four `*:all:delete` keys) are what
    User Story 1's grant/revoke actually operates on; grant/revoke reject
    an attempt to grant a `self`-scoped permission (it's already implicit,
    not something to hand out).
  - The dropped `tags:manage` had no real backing feature in the app (no
    tag CRUD admin surface exists) — including it would have been a
    speculative permission with nothing to gate (Constitution Principle
    VI).
  - `hasPermission()`/`listEffectivePermissions()` (T004/T005) were
    updated in place to check `DEFAULT_USER_PERMISSIONS` membership before
    falling through to an explicit `UserPermission` grant lookup.
  - The comment-moderation gate (T009) ended up implemented at the two
    call sites that already compute a `canModerate`-shaped prop for
    `CommentSection` (`src/app/posts/[slug]/page.tsx`,
    `src/app/tweets/[id]/page.tsx`) — each now computes a separate
    `canModerateComments = await hasPermission(user, "comment:all:delete")`
    and passes that to `CommentSection` specifically, leaving the
    post's/tweet's own moderation control on the unrelated,
    already-existing `canModerate` (role) check. No change needed inside
    `CommentItem.tsx` itself — it already just renders whatever boolean
    prop it's given.
  - **US3 (T012-T013)**: added a new `requirePermission(permission)`
    helper to `session.ts` (parallel to `requireAdmin()`, redirecting on
    missing session or missing permission instead of missing ADMIN role),
    used by all 6 functions in `src/actions/admin.ts` in place of the
    blanket `requireAdmin()`. `/admin/page.tsx` now computes all three
    `user:all:delete`/`post:all:delete`/`tweet:all:delete` checks up
    front, redirects only if none are held, and conditionally calls each
    `adminList*` action (calling one the viewer lacks permission for would
    itself redirect, since those actions now gate individually).
    `AdminTabs`'s `adminId` prop was renamed `viewerId` (a Users-tab
    viewer is no longer necessarily an ADMIN) and each tab
    (`TabsTrigger`/`TabsContent`) is now conditionally rendered on its own
    `can*` boolean, with the default tab picked from whichever permission
    the viewer actually has. `/admin/permissions` itself and its
    grant/revoke/search actions stay on `requireAdmin()` unchanged — per
    spec FR-006, only a full admin manages permissions.
