# Feature Specification: Security & Maintainability Hardening

**Feature Branch**: `005-security-maintainability-hardening`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Make sure everything in the main app uses
best practices for security and maintainability. There are hardcoded
string checks that shouldn't be there — e.g. `role === \"ADMIN\"` is
duplicated across many files instead of going through the existing
`isAdmin()` helper. This also needs to set up a clean seam for the
upcoming IAM/RBAC module (specs/006) so that work doesn't require another
sweep of these same call sites."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One place decides "can this user moderate?" (Priority: P1)

As a developer working on any page or component that needs to show
admin-only UI or gate an admin-only action, I want a single, obviously
correct function to call, so a typo or missed call site can never silently
under- or over-grant admin capability.

**Why this priority**: This is the actual defect being fixed — 10+
independent `role === "ADMIN"` comparisons across pages and components
mean a future role model change (specs/006) requires finding and fixing
every one of them individually, and any one missed site is a latent
authorization bug.

**Independent Test**: Search the codebase for the literal string
`"ADMIN"` outside of the authorization module itself and the Prisma
schema/generated client — it should not appear as an inline comparison in
any page or component.

**Acceptance Scenarios**:

1. **Given** any page or component that currently writes
   `user.role === "ADMIN"` inline, **When** the hardening is complete,
   **Then** it instead calls a shared authorization helper that returns
   the same boolean for the same input.
2. **Given** a component receives `canModerate` as a prop computed by a
   parent server component, **When** the hardening is complete, **Then**
   that computation happens via the shared helper in exactly one place per
   page (not duplicated inline).
3. **Given** an admin user viewing any page that previously showed
   moderation controls, **When** the hardening is complete, **Then** they
   still see exactly the same moderation controls as before (no
   behavior change, only a change in how the check is expressed).

---

### User Story 2 - Consistent auth-check style across server actions (Priority: P2)

As a developer adding a new server action, I want every action to check
the caller the same way (via the shared session helpers), so reviewing an
action for "does this check auth correctly?" doesn't require remembering
multiple equivalent-but-different patterns.

**Why this priority**: Lower risk than Story 1 (no scattered duplication
across the codebase — it's one file), but it's the same underlying
principle and is cheap to fix alongside Story 1.

**Independent Test**: `src/actions/preferences.ts`'s `updatePreferencesAction`
calls the same session-resolution helper (`getCurrentUser()`) that every
other action uses, instead of calling `auth()` directly.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor calls `updatePreferencesAction`, **When**
   the hardening is complete, **Then** the action still no-ops exactly as
   it does today (no behavior change).
2. **Given** a signed-in user updates their appearance preferences,
   **When** the hardening is complete, **Then** their preferences are
   still saved exactly as before.

### Edge Cases

- What happens to the many places that pass `canModerate` down as a prop
  (not compute it inline)? Those are unaffected — only the *computation*
  of the boolean moves behind the shared helper; the prop-drilling pattern
  itself is unchanged (out of scope, not a defect).
- What happens if a future PR reintroduces an inline `role === "ADMIN"`
  check? Out of scope for this spec to prevent via tooling (e.g. an ESLint
  rule) — that's a reasonable follow-up, not required here.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The codebase MUST expose exactly one function that answers
  "can this user moderate?" and every page/component that currently
  computes this inline MUST call it instead.
- **FR-002**: The shared function from FR-001 MUST be usable both from a
  session (`user.role`) already in hand and from the existing
  `isAdmin()`/`requireAdmin()` session-fetching helpers, so call sites that
  already have a `user` object don't need an extra database round-trip.
- **FR-003**: `updatePreferencesAction` MUST resolve the current user via
  the same shared helper (`getCurrentUser()`) every other action uses,
  instead of calling `auth()` directly.
- **FR-004**: No exported function's observable behavior may change for
  existing callers — this is a pure internal consolidation.
- **FR-005**: The shared function from FR-001 MUST be structured so that
  specs/006 (the IAM/RBAC module) can extend it to check granular
  permissions instead of just the binary admin flag, without requiring
  another sweep of the call sites this spec fixes.

### Key Entities

- **Moderation check**: The single boolean "can this user perform
  moderation actions" — currently equivalent to `role === "ADMIN"`,
  computed in one place after this spec instead of 10+.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero inline `=== "ADMIN"` comparisons remain outside the
  authorization helper module itself (down from 10+ call sites).
- **SC-002**: `npx tsc --noEmit` and `npm run lint` both pass with no new
  errors or warnings.
- **SC-003**: Manual verification shows identical moderation UI (delete
  buttons, admin badges) for an admin user and identical absence of them
  for a regular user, on every affected page.
- **SC-004**: `updatePreferencesAction` behaves identically for signed-in
  and signed-out callers before and after the change.

## Assumptions

- This spec does not introduce new roles or permissions — it only
  consolidates the *existing* binary admin check into one place, in
  preparation for specs/006 replacing that one place with something
  richer.
- No new dependencies are needed; this is a refactor of existing,
  already-imported helpers (`src/lib/session.ts`).
