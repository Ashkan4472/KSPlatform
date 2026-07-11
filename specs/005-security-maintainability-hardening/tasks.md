---

description: "Task list for feature implementation"
---

# Tasks: Security & Maintainability Hardening

**Input**: Design documents from `/specs/005-security-maintainability-hardening/`

**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

**Tests**: Not requested beyond the manual quickstart smoke test (SC-003)
and the type-check/lint gate (SC-002) — no unit test tasks generated.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Add `export function canModerate(user: { role: "USER" | "ADMIN" } | null | undefined): boolean { return user?.role === "ADMIN"; }`
  to `src/lib/session.ts`; refactor `isAdmin()` to
  `return canModerate(session?.user);` instead of its own inline comparison

---

## Phase 2: Foundational

No additional foundational work — T001 alone unblocks every user story.

---

## Phase 3: User Story 1 - One place decides "can this user moderate?" (Priority: P1) 🎯 MVP

**Goal**: Zero inline `=== "ADMIN"` comparisons remain outside `session.ts`.

**Independent Test**: `grep -rn '"ADMIN"' src/app src/components` returns
no inline comparisons (only prop names/badges referencing the concept, not
a literal equality check).

### Implementation for User Story 1

- [X] T002 [P] [US1] `src/app/page.tsx`: replace
  `user?.role === "ADMIN"` with `canModerate(user)`
- [X] T003 [P] [US1] `src/app/posts/[slug]/page.tsx`: replace
  `user?.role === "ADMIN"` with `canModerate(user)`
- [X] T004 [P] [US1] `src/app/u/[id]/page.tsx`: replace both
  `user.role === "ADMIN"` (badge) and `viewer?.role === "ADMIN"`
  (canModerate prop) with `canModerate(user)` / `canModerate(viewer)`
- [X] T005 [P] [US1] `src/app/search/page.tsx`: replace
  `user?.role === "ADMIN"` with `canModerate(user)`
- [X] T006 [P] [US1] `src/app/tweets/page.tsx`: replace
  `user?.role === "ADMIN"` with `canModerate(user)`
- [X] T007 [P] [US1] `src/app/tweets/[id]/page.tsx`: replace
  `user?.role === "ADMIN"` with `canModerate(user)`
- [X] T008 [P] [US1] `src/components/layout/UserMenu.tsx`: replace
  `role === "ADMIN"` with `canModerate({ role })`
- [X] T009 [P] [US1] `src/components/admin/AdminTabs.tsx`: replace
  `u.role === "ADMIN"` with `canModerate({ role: u.role })`
- [X] T010 [P] [US1] `src/components/people/UserCard.tsx`: replace
  `user.role === "ADMIN"` with `canModerate({ role: user.role })`

**Checkpoint**: SC-001 achieved — zero inline comparisons remain. `npx tsc
--noEmit` passes.

---

## Phase 4: User Story 2 - Consistent auth-check style in server actions (Priority: P2)

**Goal**: `updatePreferencesAction` resolves its caller the same way every
other action does.

**Independent Test**: `src/actions/preferences.ts` imports and calls
`getCurrentUser()` instead of `auth()`.

### Implementation for User Story 2

- [X] T011 [US2] `src/actions/preferences.ts`: replace
  `import { auth } from "@/auth"` + `const session = await auth(); if (!session?.user?.id) return;`
  with `import { getCurrentUser } from "@/lib/session"` +
  `const user = await getCurrentUser(); if (!user) return;` (and use
  `user.id` in place of `session.user.id` below)

**Checkpoint**: quickstart.md step 9 passes (identical behavior signed-in
and signed-out).

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T012 Run `npx tsc --noEmit` (SC-002)
- [X] T013 Run `npm run lint` (SC-002)
- [X] T014 Run the full `quickstart.md` manual smoke test (SC-003, SC-004)

---

## Dependencies & Execution Order

- **Setup (T001)**: No dependencies — must complete first, blocks everything else.
- **User Story 1 (T002-T010)**: Depends on T001. All 9 tasks are parallel
  (different files).
- **User Story 2 (T011)**: Depends on T001 only (not on User Story 1);
  independent of the other 9 files.
- **Polish (T012-T014)**: Depends on both user stories.

## Parallel Example: User Story 1

```bash
Task: "Replace inline ADMIN check in src/app/page.tsx"
Task: "Replace inline ADMIN check in src/app/posts/[slug]/page.tsx"
Task: "Replace inline ADMIN check in src/app/u/[id]/page.tsx"
Task: "Replace inline ADMIN check in src/app/search/page.tsx"
Task: "Replace inline ADMIN check in src/app/tweets/page.tsx"
Task: "Replace inline ADMIN check in src/app/tweets/[id]/page.tsx"
Task: "Replace inline ADMIN check in src/components/layout/UserMenu.tsx"
Task: "Replace inline ADMIN check in src/components/admin/AdminTabs.tsx"
Task: "Replace inline ADMIN check in src/components/people/UserCard.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 (helper)
2. T002-T010 (all 9 call sites)
3. **STOP and VALIDATE**: zero inline comparisons remain, `npx tsc --noEmit` passes

### Incremental Delivery

1. T001 → helper exists
2. US1 (T002-T010) → duplication eliminated
3. US2 (T011) → preferences.ts aligned
4. Polish (T012-T014) → final gate + manual verification

## Notes

- No test-writing tasks: no new logic, only a call-site substitution.
- This spec deliberately sets up (FR-005) but does not build the RBAC
  permission model itself — that's specs/006.
- **Deviation during implementation**: `canModerate()` lives in a new,
  dependency-free `src/lib/roles.ts`, not directly in `src/lib/session.ts`
  as T001 originally specified. Reason: `session.ts` imports `@/auth`,
  which pulls in Node-only deps (`bcryptjs`, Prisma) via NextAuth's
  credentials provider. Two of the nine call sites
  (`components/admin/AdminTabs.tsx`, `components/layout/UserMenu.tsx`) are
  `"use client"` components — importing `canModerate` from `session.ts`
  there would have bundled those server-only deps into client code.
  `session.ts` still imports and re-exports `canModerate` from
  `roles.ts`, so every server-side call site (`isAdmin()`,
  `requireAdmin()`, the page files) is unaffected; only the two client
  components and `UserCard.tsx` (a server component, updated for
  consistency) import directly from `@/lib/roles` instead.
