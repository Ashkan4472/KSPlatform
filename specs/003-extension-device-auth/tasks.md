---

description: "Task list for feature implementation"
---

# Tasks: Browser Extension Device-Flow Authentication

**Input**: Design documents from `/specs/003-extension-device-auth/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested as unit tests, but this is a
security-sensitive auth feature — task list includes verification tasks
(rate limiting, revocation, expiry) as first-class items, not just polish.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema + core token/hash helpers all stories depend on.

- [X] T001 Add `DeviceGrant` and `ExtensionToken` models to
  `prisma/schema.prisma` per `data-model.md`; run
  `npm run db:migrate -- --name add_extension_device_auth` (check for
  spurious `pg_trgm` index drops per CLAUDE.md before applying); run
  `npx prisma generate`
- [X] T002 [P] Create `src/lib/extensionAuth.ts`: `generateDeviceCode()`,
  `generateUserCode()` (short, human-typeable, collision-checked against
  pending grants), `hashToken()`/`verifyToken()` (using `bcryptjs`, mirroring
  `passwordHash` conventions), and a simple rate-limit counter helper for
  code issuance/polling (FR-007)
- [X] T003 [P] Add `deviceCodeSchema`/`approveCodeSchema` zod schemas to
  `src/lib/validation.ts`

---

## Phase 2: Foundational

No additional foundational work — T001-T003 unblock every user story.

**Checkpoint**: Schema migrated, helpers exist, zod schemas exist.

---

## Phase 3: User Story 1 - Connect the extension without a password (Priority: P1) 🎯 MVP

**Goal**: Full code → approve → poll → token cycle works end-to-end.

**Independent Test**: Run quickstart.md steps 1-4.

### Implementation for User Story 1

- [X] T004 [US1] Create `POST /api/v1/device/code` in
  `src/app/api/v1/device/code/route.ts`: rate-limit check, generate
  `DeviceGrant` (status `PENDING`, `expiresAt` = now + 10min), return the
  contract response from `contracts/device-flow-api.md`
- [X] T005 [US1] Create `POST /api/v1/device/token` in
  `src/app/api/v1/device/token/route.ts`: look up `DeviceGrant` by
  `deviceCode`; if expired mark `EXPIRED` and return `400 expired_token`; if
  `PENDING` return `202 authorization_pending`; if `APPROVED` return the
  `ExtensionToken`'s raw value (only obtainable once — see T007) and token
  metadata; if `DENIED` return `400 access_denied`
- [X] T006 [US1] Create `src/app/connect/page.tsx`: prompts login if
  signed out (reuse existing `requireUserId` redirect pattern), then shows a
  form to enter/confirm the `user_code` and an Approve button
- [X] T007 [US1] Create `approveDeviceCodeAction` in
  `src/actions/deviceAuth.ts`: `requireUserId()`, validate with
  `approveCodeSchema`, look up the `PENDING` `DeviceGrant` by `userCode`
  (reject if not found/expired/already resolved — Edge Case: double-approval
  is a no-op), generate a raw token, store only its hash on a new
  `ExtensionToken` row linked to the grant's user, mark the grant
  `APPROVED`, return `{}` (the raw token is retrieved by the extension via
  T005's poll, never returned directly to the web app UI)
- [X] T008 [US1] Wire `src/app/connect/page.tsx`'s Approve button to
  `approveDeviceCodeAction`, show success state per Acceptance Scenario 2

**Checkpoint**: quickstart.md steps 1-4 pass. SC-001 achievable.

---

## Phase 4: User Story 2 - Revoke extension access (Priority: P2)

**Goal**: List and revoke connections from account settings.

**Independent Test**: Run quickstart.md steps 5-6.

### Implementation for User Story 2

- [ ] T009 [P] [US2] Create `listExtensionConnectionsAction` in
  `src/actions/deviceAuth.ts`: `requireUserId()`, return the current user's
  non-revoked `ExtensionToken` rows (`id`, `label`, `createdAt`,
  `lastUsedAt`) — never the hash
- [ ] T010 [P] [US2] Create `revokeExtensionConnectionAction` in
  `src/actions/deviceAuth.ts`: `requireUserId()`, verify the token belongs
  to the caller (ownership check, Constitution Principle II), set
  `revokedAt`
- [ ] T011 [US2] Create `src/components/settings/ConnectionsList.tsx` and
  `src/app/settings/connections/page.tsx`: render the list from T009, a
  Revoke button per row calling T010 (depends on T009, T010)
- [ ] T012 [US2] Add a bearer-token verification helper's revoked/expired
  check path in `src/lib/extensionAuth.ts` (extends T002): any `/api/v1/*`
  request with a hash matching a `revokedAt`-set token MUST return `401
  reauthenticate_required` (FR-006) — this is the shared check every future
  `/api/v1/*` route (including spec 004's feed endpoint) will call

**Checkpoint**: quickstart.md steps 5-6 pass. SC-002, SC-003 achievable.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T013 Run `npx tsc --noEmit` (Verification Gate)
- [ ] T014 Run `npm run lint` (Verification Gate)
- [ ] T015 Run the full `quickstart.md` manual smoke test (all 7 steps)
  against the Docker stack, including the rate-limit (SC-004) and expiry
  (step 7) cases
- [ ] T016 Update `README.md` with a short "Connecting an extension"
  section once this feature is verified end-to-end (constitution Sync
  Impact Report flagged this as a pending doc follow-up)

---

## Dependencies & Execution Order

- **Setup (T001-T003)**: T001 has no dependencies; T002, T003 can run in
  parallel with T001 (different files) but nothing in later phases can run
  until all three are done.
- **User Story 1 (T004-T008)**: Depends on Setup. T004/T005 (routes) and
  T006 (page shell) can start in parallel; T007 depends on T002/T003; T008
  depends on T006 and T007.
- **User Story 2 (T009-T012)**: Depends on Setup (not on US1's routes,
  though T012 is the shared verification path spec 004 will also use).
  T009/T010 parallel; T011 depends on both; T012 is independent.
- **Polish (T013-T016)**: Depends on both user stories.

## Parallel Example: Setup

```bash
Task: "Add DeviceGrant/ExtensionToken models, migrate, generate client"
Task: "Create src/lib/extensionAuth.ts token/hash/rate-limit helpers"
Task: "Add deviceCodeSchema/approveCodeSchema to src/lib/validation.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup (T001-T003)
2. User Story 1 (T004-T008)
3. **STOP and VALIDATE**: quickstart.md steps 1-4 — a user can connect
   without ever entering a password into the extension (SC-001)

### Incremental Delivery

1. Setup → schema + helpers ready
2. US1 → connect flow works end-to-end
3. US2 → revocation ships (required before this feature is considered done,
   per Constitution Principle VII's revocability requirement — not truly
   optional despite being P2)
4. Polish → full verification + docs

## Notes

- This feature is a hard prerequisite for specs/004 (the extension itself)
  — T012's bearer-token verification helper is what spec 004's feed
  endpoint will call.
- Per user instruction, implementation (`/speckit-implement`) is paused
  after this tasks.md until the plan is reviewed — do not run T001+ without
  explicit go-ahead.
- **Deviation during implementation**: T007's raw-token generation moved
  into T005 (the `/api/v1/device/token` poll endpoint) instead of the
  approval action. Reason: the approval action runs in the web app's
  session context, while the extension retrieves the token from a
  different request entirely (the poll). Generating it in T007 would have
  required persisting the raw value somewhere (even briefly) for T005 to
  hand off — instead, T005 generates the token itself on the first
  `APPROVED` poll (when it has the raw value in memory for exactly one
  response) and only ever persists the bcrypt hash. `DeviceGrant.token`
  (the 1:1 relation) doubles as the "already consumed" guard: a second poll
  after issuance returns `expired_token` rather than a duplicate token.
