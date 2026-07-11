# Feature Specification: IAM Module with Per-User Permission Overrides

**Feature Branch**: `006-iam-rbac`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Create a sophisticated IAM module so a
super admin can determine, per user, specific RBAC access to each feature
and section — not just the existing binary USER/ADMIN role. Clarified:
per-user permission overrides (beyond role-based defaults, the super admin
can grant or revoke individual permissions for a specific user as
exceptions to their role)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Grant one user a specific capability without making them a full admin (Priority: P1)

As a super admin, I want to give a trusted regular user the ability to
moderate comments (or any single specific capability) without promoting
them to full ADMIN, so I can delegate narrow responsibilities without
handing over the whole admin surface.

**Why this priority**: This is the entire point of the feature — without
per-user overrides, the only lever is the existing binary role, which is
what the user explicitly said isn't granular enough.

**Independent Test**: As a super admin, open a specific user's permissions
page, grant them "moderate comments," and confirm that user (still role
`USER`) can now moderate comments but sees no other admin-only UI or
capability.

**Acceptance Scenarios**:

1. **Given** a regular user with no overrides, **When** a super admin
   grants them the "moderate comments" permission, **Then** that user can
   moderate comments but cannot delete posts, manage users, or access any
   other admin-only capability they weren't separately granted.
2. **Given** a user with a granted permission, **When** the super admin
   revokes it, **Then** that user immediately loses that specific
   capability on their next action/page load — no other capability is
   affected.
3. **Given** an existing `ADMIN`-role user, **When** viewing their
   permissions, **Then** they show as having every permission (their role
   already grants everything) — overrides are additive for `USER`-role
   accounts, not a replacement mechanism for the admin role.

---

### User Story 2 - See and audit who has what access (Priority: P2)

As a super admin, I want to see, for any user, exactly which permissions
they hold and where each came from (their role, or a specific grant), and
who granted it and when, so access can be reviewed and cleaned up over
time instead of accumulating invisibly.

**Why this priority**: A permission system without visibility becomes
unauditable and untrustworthy — this is what makes the module
"sophisticated" rather than a blind on/off switch, but it depends on User
Story 1's grant/revoke mechanism existing first.

**Independent Test**: As a super admin, open any user's permissions page
and see a list of their effective permissions, each labeled with its
source (role default vs. explicit grant) and, for explicit grants, who
granted it and when.

**Acceptance Scenarios**:

1. **Given** a user with two explicitly granted permissions, **When** a
   super admin views that user's permissions page, **Then** both appear,
   each showing the granting admin's name and the grant date.
2. **Given** an `ADMIN`-role user, **When** viewing their permissions
   page, **Then** it's visually clear their access comes from their role,
   not from individual grants.

---

### User Story 3 - Every admin-gated feature checks the real permission, not just the role (Priority: P3)

As a super admin, once I've granted a user a specific permission, I want
every relevant page and action to actually respect it — not just the
permissions-management page itself — so a granted capability is real, not
cosmetic.

**Why this priority**: Depends on User Stories 1-2 existing; this is the
integration work that makes the granted permissions actually take effect
across the app, building on specs/005's consolidation of the admin check
into one place.

**Independent Test**: Grant a regular user the "moderate comments"
permission, sign in as that user, and confirm they see comment-delete
controls (and can use them) on post/tweet pages, while still not seeing
post/tweet-delete controls they weren't granted.

**Acceptance Scenarios**:

1. **Given** a user granted only "moderate comments," **When** they view
   a post with comments, **Then** they see delete controls on comments but
   not on the post itself.
2. **Given** a user granted only "manage tags," **When** they visit the
   tag-search/management surface, **Then** they can perform tag management
   actions without seeing any other admin-only UI.

### Edge Cases

- What happens if a super admin tries to revoke their own last remaining
  administrative access? Out of scope to prevent programmatically for
  v1 — the existing `ADMIN_EMAIL` bootstrap mechanism already provides a
  recovery path (restarting/re-logging-in re-promotes that configured
  email), so this isn't a lockout risk worth extra engineering yet.
- What happens to a granted permission if the underlying feature it
  governs is later removed from the app? Out of scope — the permission
  catalog is maintained by developers alongside the features it gates;
  removing a feature is expected to also remove its permission from the
  catalog.
- What happens when a non-admin user without any grants tries to access a
  permission-gated action directly (e.g. by calling a server action
  outside the UI)? MUST be rejected server-side the same way an
  unauthorized request is rejected today (ownership/role checks already
  happen in the action itself, per Constitution Principle II) — the
  permission check happens in the same place, not only in the UI.
- What happens if two super admins grant/revoke the same permission for
  the same user concurrently? Last write wins — no optimistic-locking
  requirement for v1 (matches the app's existing mutation patterns
  elsewhere, e.g. profile updates).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain a fixed catalog of permissions,
  each tied to a specific feature/section of the app (e.g. moderating
  posts, moderating tweets, moderating comments, managing users, managing
  tags).
- **FR-002**: A super admin MUST be able to grant any cataloged permission
  to any specific user, and revoke any permission they previously granted
  (or that any other super admin granted).
- **FR-003**: A user's effective permissions MUST be the union of their
  role's default permissions (an `ADMIN` implicitly has every permission,
  matching today's behavior) and any permissions individually granted to
  them.
- **FR-004**: Every existing admin-gated page/action MUST check the
  user's actual effective permission for that specific capability, not
  just their role — building on specs/005's centralization so this is a
  targeted extension, not a second sweep of the same call sites.
- **FR-005**: The system MUST show, for any user, their full list of
  effective permissions, each labeled with its source (role vs. explicit
  grant) and, for explicit grants, the granting admin and grant date.
- **FR-006**: Only a super admin (an `ADMIN`-role user, consistent with
  today's single admin tier) MUST be able to view or modify any other
  user's permissions.
- **FR-007**: Granting or revoking a permission MUST take effect
  immediately for that user (no caching delay, no re-login required).

### Key Entities

- **Permission**: A named, fixed capability tied to one feature/section
  (e.g. `posts:moderate`, `tweets:moderate`, `comments:moderate`,
  `users:manage`, `tags:manage`). Defined by the application, not
  user-created.
- **Permission Grant**: A record that a specific permission was given to a
  specific user, by a specific super admin, at a specific time. Revocable.
- **Effective Permissions**: The computed union of a user's role-implied
  permissions and their individual grants — what User Stories 2 and 3
  actually read from.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A super admin can grant a single specific permission to a
  regular user, and that user gains exactly that one capability — verified
  by the user having access to the granted feature and no others.
- **SC-002**: Revoking a permission takes effect on the very next
  request — no stale access window.
- **SC-003**: Every existing admin-gated page/action correctly reflects
  granted permissions, verified across posts, tweets, comments, users, and
  tags moderation/management surfaces.
- **SC-004**: A super admin can view any user's complete effective
  permission list, with source and grant metadata, in one page.
- **SC-005**: `npx tsc --noEmit` and `npm run lint` both pass with no new
  errors or warnings.

## Assumptions

- "Super admin" means the existing `ADMIN` role (including the
  `ADMIN_EMAIL`-bootstrapped account) — this spec does not introduce an
  additional role tier above `ADMIN`.
- The permission catalog is fixed and developer-maintained (a code-level
  list), not something admins can create or rename through the UI — only
  *who holds* each permission is admin-configurable, not the catalog
  itself.
- This builds directly on specs/005 (the `canModerate`/session-helper
  consolidation) — FR-004 extends that seam rather than re-touching the
  same 10 call sites a second time.
- No new UI framework or design system is introduced; the permissions
  management screen reuses existing shadcn/ui components and the existing
  `/admin` area's conventions.
