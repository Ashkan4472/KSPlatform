# Feature Specification: Consolidate Duplicate ActionResult Type

**Feature Branch**: `001-consolidate-action-result`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "graphify's knowledge graph shows the same `type ActionResult = { error?: string }` shape independently redeclared in src/actions/posts.ts, admin.ts, comments.ts, profile.ts, and tweets.ts (profile.ts's variant also adds `ok?: boolean`). Consolidate these into a single shared type so server actions share one mutation-result contract instead of five near-identical local ones."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single source of truth for action results (Priority: P1)

As a developer adding or modifying a server action, I want one shared
`ActionResult` type to import, so that every action's error/success contract
is guaranteed identical instead of drifting file-by-file.

**Why this priority**: This is the entire feature — without it there is no
consolidation, just five files that happen to look alike today and can
silently diverge tomorrow.

**Independent Test**: Delete the five local `type ActionResult` declarations,
import a single shared type in each file, and confirm the project still type-
checks and behaves identically (toasts still show the same error/success
states in the UI).

**Acceptance Scenarios**:

1. **Given** `src/actions/posts.ts`, `admin.ts`, `comments.ts`, `tweets.ts` each
   locally declare `type ActionResult = { error?: string }`, **When** the
   consolidation is complete, **Then** none of these files declares its own
   `ActionResult` — all import it from one shared location.
2. **Given** `src/actions/profile.ts` declares the extended
   `{ error?: string; ok?: boolean }` variant, **When** the consolidation is
   complete, **Then** the shared type accommodates this variant without
   forcing the other four files to carry an unused `ok` field they never set.
3. **Given** an existing caller destructures `{ error }` from any of these
   actions' return values, **When** the consolidation is complete, **Then**
   that caller compiles and behaves unchanged.

---

### User Story 2 - No behavior change in the running app (Priority: P2)

As a user of KSPlatform, I want post/comment/tweet/admin actions (create,
delete, update, moderate) to keep working exactly as before, so that a
type-level cleanup never becomes a user-visible regression.

**Why this priority**: A refactor with a subtle behavior change is worse than
no refactor — the whole point of doing this via a type consolidation (not a
logic rewrite) is that runtime behavior must be provably unaffected.

**Independent Test**: Exercise create/update/delete flows for a post, a
comment, a tweet, and an admin moderation action against the running Docker
stack and confirm success/error toasts appear exactly as they did before the
change.

**Acceptance Scenarios**:

1. **Given** a signed-in user submits an invalid post form, **When** the
   server action returns an error, **Then** the same error toast appears as
   before the refactor.
2. **Given** an admin deletes a post/tweet/user, **When** the action
   succeeds, **Then** the row disappears from the admin list exactly as
   before.

### Edge Cases

- What happens when a future action needs a result shape richer than
  `{ error?: string; ok?: boolean }` (e.g. returning created-entity data)?
  The shared type must not block that — actions with a genuinely different
  return shape simply don't use `ActionResult` (this is already true today:
  e.g. actions returning `Page<T>` or entity objects are unaffected).
- How does the system handle the two existing shapes (`{ error? }` vs
  `{ error?; ok? }`) colliding? The shared type is the superset
  (`{ error?: string; ok?: boolean }`); call sites that never set `ok` are
  unaffected since it's optional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The codebase MUST define exactly one `ActionResult` type,
  shared across all server actions that currently declare it locally.
- **FR-002**: The shared type MUST be a superset of every existing local
  variant (`{ error?: string }` and `{ error?: string; ok?: boolean }`) so no
  call site loses type information.
- **FR-003**: `src/actions/posts.ts`, `admin.ts`, `comments.ts`, `profile.ts`,
  and `tweets.ts` MUST import the shared type instead of declaring their own.
- **FR-004**: The shared type MUST live in a location already established for
  cross-action helpers/types (`src/lib/*`), consistent with this project's
  existing convention of centralizing shared action helpers there.
- **FR-005**: No exported function signature's observable return shape may
  change for existing callers (props/components destructuring `{ error }`
  continue to compile and behave identically).

### Key Entities

- **ActionResult**: The shared server-action result contract — an optional
  `error` message for the failure case and an optional `ok` flag for actions
  that report explicit success, used as the return type of mutation server
  actions across posts, comments, tweets, profile, and admin moderation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero duplicate `ActionResult` type declarations remain in
  `src/actions/*` (down from 5).
- **SC-002**: `npx tsc --noEmit` and `npm run lint` both pass with no new
  errors or warnings introduced by this change.
- **SC-003**: Manual verification of create/update/delete flows for posts,
  comments, tweets, and admin moderation shows no change in error/success
  toast behavior.

## Assumptions

- The shared type is purely a type-level change — no server action's runtime
  logic, validation, or authorization check is modified.
- `src/lib/` is the correct home for the shared type, consistent with this
  project's existing convention of centralizing reusable helpers/types there
  rather than in `src/actions/*` (which may only export async functions).
- Renaming the type is out of scope; only its declaration location changes.
