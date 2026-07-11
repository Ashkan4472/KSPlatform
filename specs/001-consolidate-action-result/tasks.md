---

description: "Task list for feature implementation"
---

# Tasks: Consolidate Duplicate ActionResult Type

**Input**: Design documents from `/specs/001-consolidate-action-result/`

**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

**Tests**: Not requested in the spec beyond the manual quickstart smoke test
(Success Criteria SC-003) and the type-check/lint gate (SC-002) — no unit
test tasks are generated.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared type all user stories depend on.

- [X] T001 Create `src/lib/actions.ts` exporting
  `export type ActionResult = { error?: string; ok?: boolean };`

---

## Phase 2: Foundational

No additional foundational work — T001 alone unblocks every user story.

**Checkpoint**: `src/lib/actions.ts` exists and exports `ActionResult`.

---

## Phase 3: User Story 1 - Single source of truth for action results (Priority: P1) 🎯 MVP

**Goal**: Every server action that currently declares its own local
`ActionResult` imports the shared one instead.

**Independent Test**: `npx tsc --noEmit` passes and none of the five files
below contains a local `type ActionResult` declaration.

### Implementation for User Story 1

- [X] T002 [P] [US1] In `src/actions/posts.ts`: remove
  `type ActionResult = { error?: string };` and import
  `import type { ActionResult } from "@/lib/actions";`
- [X] T003 [P] [US1] In `src/actions/admin.ts`: remove the local
  `ActionResult` declaration and import it from `@/lib/actions`
- [X] T004 [P] [US1] In `src/actions/comments.ts`: remove the local
  `ActionResult` declaration and import it from `@/lib/actions`
- [X] T005 [P] [US1] In `src/actions/tweets.ts`: remove the local
  `ActionResult` declaration and import it from `@/lib/actions`
- [X] T006 [US1] In `src/actions/profile.ts`: remove the local
  `type ActionResult = { error?: string; ok?: boolean };` and import it from
  `@/lib/actions` (this file's usage already matches the shared superset —
  no call-site change needed)

**Checkpoint**: Zero duplicate `ActionResult` declarations remain in
`src/actions/*` (SC-001). `npx tsc --noEmit` passes.

---

## Phase 4: User Story 2 - No behavior change in the running app (Priority: P2)

**Goal**: Confirm the type-only change has zero runtime impact.

**Independent Test**: Manual quickstart smoke test against the Docker stack.

### Implementation for User Story 2

- [ ] T007 [US2] Run `docker compose up --build` and execute every scenario
  in `specs/001-consolidate-action-result/quickstart.md` (post error/success,
  comment add/delete, tweet add/delete, profile update, admin moderation
  delete for post/tweet/user); confirm no change in toast/UI behavior
  **DEFERRED**: Docker daemon was not running when this feature was
  implemented, so this step could not be executed. Start Docker and run this
  task before considering SC-003 verified.

**Checkpoint**: All quickstart scenarios pass with unchanged behavior (SC-003) — PENDING, see T007.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T008 Run `npx tsc --noEmit` (final confirmation, SC-002)
- [X] T009 Run `npm run lint` (SC-002)

---

## Dependencies & Execution Order

- **Setup (T001)**: No dependencies — must complete first, blocks everything else.
- **User Story 1 (T002-T006)**: Depends on T001. T002-T005 are parallel
  (different files); T006 is independent but grouped last since it also
  exercises the superset field — no ordering requirement, just listed last
  for clarity.
- **User Story 2 (T007)**: Depends on User Story 1 being complete (needs the
  code to compile and run).
- **Polish (T008-T009)**: Depends on User Story 1 (and should be re-run after
  User Story 2 if that surfaces any fix).

## Parallel Example: User Story 1

```bash
Task: "Remove local ActionResult from src/actions/posts.ts, import shared type"
Task: "Remove local ActionResult from src/actions/admin.ts, import shared type"
Task: "Remove local ActionResult from src/actions/comments.ts, import shared type"
Task: "Remove local ActionResult from src/actions/tweets.ts, import shared type"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 (shared type)
2. T002-T006 (all five files migrated)
3. **STOP and VALIDATE**: `npx tsc --noEmit` passes, zero duplicates remain
4. This alone is a complete, shippable improvement (SC-001, SC-002)

### Incremental Delivery

1. T001 → shared type exists
2. US1 (T002-T006) → duplication eliminated, type-checks
3. US2 (T007) → runtime behavior confirmed unchanged
4. Polish (T008-T009) → final gate

## Notes

- No test-writing tasks: this feature has no new logic to unit-test, only a
  type relocation. Verification is type-checking + manual smoke test per the
  spec's own Success Criteria.
- Commit after Phase 3 (US1) completes and again after Phase 4 (US2) validation.
