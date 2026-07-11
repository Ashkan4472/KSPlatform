# Implementation Plan: Browser Extension Device-Flow Authentication

**Branch**: `003-extension-device-auth` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-extension-device-auth/spec.md`

## Summary

Add an RFC-8628-style device authorization grant: an unauthenticated
extension requests a short-lived `device_code`/`user_code` pair, the user
approves it on a new `/connect` page in the existing web app (already
logged in via Auth.js), and the extension polls for and receives a
long-lived, individually-revocable bearer token. The token authenticates
only against the new `/api/v1/*` surface (Constitution Principle VII) —
it grants no access to the web app's session-only server actions. A new
"Connected Extensions" section in account settings lists and revokes tokens.

## Technical Context

**Language/Version**: TypeScript (Next.js 16 Route Handlers for the new
endpoints; React 19 for the `/connect` and settings UI)

**Primary Dependencies**: `bcryptjs` (already a dependency, reused to hash
tokens at rest the same way passwords are hashed — no new crypto
dependency); Prisma 7 (two new models, see Data Model)

**Storage**: PostgreSQL via Prisma — two new tables: `DeviceGrant` (pending
connection codes) and `ExtensionToken` (approved, revocable credentials)

**Testing**: `npx tsc --noEmit` + `npm run lint`; manual quickstart covering
the full connect → approve → poll → revoke cycle against the Docker stack

**Target Platform**: Existing KSPlatform web app (new pages/routes only);
consumed by the browser extension built in specs/004

**Project Type**: Web application — adds a new versioned API surface
(`src/app/api/v1/*`) alongside the existing app, no new deployable service

**Performance Goals**: Polling endpoint MUST tolerate the extension's poll
interval (target 5s) per connecting user without degrading other traffic;
not a high-throughput endpoint (bounded by concurrent in-progress connects)

**Constraints**:
- Tokens MUST be hashed at rest (never store the raw bearer token, mirroring
  how `passwordHash` already works for login passwords) — only a hash is
  persisted; the raw token is shown once, at issuance, and never again.
- Device/user codes MUST NOT collide across concurrent pending grants.
- Rate limiting on code issuance and poll endpoints (FR-007) — reuse a
  simple in-process/DB-backed counter; no new infra (e.g. Redis) introduced
  for this alone (No Speculative Abstraction, Principle VI).

**Scale/Scope**: 2 new Prisma models, ~5 new Route Handlers under
`src/app/api/v1/device/*` and `src/app/api/v1/tokens/*`, 1 new page
(`/connect`), 1 new account-settings section, helper additions to
`src/lib/session.ts`-adjacent code for bearer-token auth.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Reuse Before Reinvention**: PASS — reuses `bcryptjs` (already a
  dependency) for token hashing instead of adding a new crypto library;
  reuses the existing `zod` validation pattern from `src/lib/validation.ts`.
- **II. Mutations Are Server Actions (Web App)**: PASS — the *approval* and
  *revoke* actions the logged-in user performs on the web app UI ARE server
  actions (`src/actions/deviceAuth.ts`), consistent with Principle II. Only
  the extension-facing code/token issuance and polling endpoints (which by
  definition have no session cookie to act through) are Route Handlers,
  explicitly justified under Principle VII below.
- **III. Version-Pinned Correctness**: PASS — new Prisma models follow the
  existing `cuid()` id / Prisma 7 generator conventions; no framework-
  version-sensitive shortcuts taken.
- **IV. Composable, Disjoint Design Tokens**: N/A.
- **V. Evidence-Driven Refactoring**: N/A — this is new functionality, not
  a refactor; the "evidence" here is the explicit user requirement
  (extension needs auth) rather than a graphify finding.
- **VI. No Speculative Abstraction**: PASS — no generic "OAuth provider
  framework" is built; this is the one, specific device flow this feature
  needs. Rate limiting uses a plain counter, not new infrastructure.
- **VII. External-Client API Is a Deliberate, Scoped Exception**: PASS by
  construction — this feature exists to satisfy VII's requirements
  precisely: bearer-token auth (not cookie/CORS relaxation), additive-only
  (`/api/v1/*` is new, nothing existing is bypassed), and independently
  revocable (FR-005/FR-006, User Story 2).

No unjustified violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-extension-device-auth/
├── plan.md              # This file
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output — the /api/v1/device/* and
│                          # /api/v1/tokens/* request/response shapes
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

research.md is omitted: no NEEDS CLARIFICATION unknowns remain after the
clarifying-question round with the user (auth strategy, token model,
revocation UX were all resolved before this plan was written).

### Source Code (repository root)

```text
prisma/
└── schema.prisma                    # + DeviceGrant, + ExtensionToken models

src/
├── lib/
│   └── extensionAuth.ts             # NEW: token generation/hashing,
│                                    # bearer-token verification helper,
│                                    # rate-limit counter helper
├── actions/
│   └── deviceAuth.ts                # NEW server actions: approveDeviceCodeAction,
│                                    # listExtensionConnectionsAction (read),
│                                    # revokeExtensionConnectionAction
├── app/
│   ├── connect/
│   │   └── page.tsx                 # NEW: enter/confirm code, approve UI
│   ├── settings/
│   │   └── connections/page.tsx     # NEW: list + revoke connected extensions
│   └── api/
│       └── v1/
│           └── device/
│               ├── code/route.ts    # POST — issue device_code/user_code
│               └── token/route.ts   # POST — extension polls for approval
└── components/
    └── settings/
        └── ConnectionsList.tsx       # NEW: renders connections + revoke button
```

**Structure Decision**: Existing single Next.js project. The new external
API lives under `src/app/api/v1/` (versioned, per Principle VII) rather than
directly under `src/app/api/`, so it's visibly separated from the
Auth.js-callback/upload/tag-search routes that predate the external-client
exception.

## Complexity Tracking

No constitution violations — table not needed.
