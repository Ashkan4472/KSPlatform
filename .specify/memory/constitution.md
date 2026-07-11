<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles:
  - II. Mutations Are Server Actions → II. Mutations Are Server Actions
    (Web App); Route Handler reservation list amended to reference the new
    external-client exception (Principle VII) instead of forbidding it outright
- Added sections: VII. External-Client API Is a Deliberate, Scoped Exception
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ Constitution Check section is generic, no change needed
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - README.md / CLAUDE.md ⚠ pending — add a short "External clients" section
    once the browser-extension feature (specs/003, specs/004) lands
- Follow-up TODOs: none
-->

# KSPlatform Constitution

## Core Principles

### I. Reuse Before Reinvention
Before writing new code, check `src/lib/*` and `src/components/*` for an existing
helper, hook, or primitive that already does the job (auth/session, tag
upsert + subscriber fan-out, uploads, tag search, infinite scroll, feed/tweet/user
query shapes, comments, slugs, markdown conversion, formatting). New abstractions
are only justified when no existing helper covers the need — a second nearly-identical
helper is a defect, not a feature.
**Rationale**: This codebase already centralizes its cross-cutting logic; the
biggest risk during a "modernization" refactor is silently forking that logic
into a second, subtly different implementation.

### II. Mutations Are Server Actions (Web App)
For the web app itself, all mutations live in `src/actions/*` as `"use server"`
functions. Every action MUST re-check auth/ownership via `requireUserId()` /
`isAdmin()` / `requireAdmin()`, validate input with a `zod` schema from
`src/lib/validation.ts`, and either `revalidatePath()` or return `{ error }`
for the caller to toast. Route Handlers (`src/app/api/*`) are reserved for
Auth.js callbacks, multipart image upload, the tag-search GET endpoint, and
the external-client API carved out under Principle VII — never add a REST
endpoint for a web-app mutation that a server action could serve instead.
**Rationale**: A single mutation pathway keeps auth/validation checks from
drifting out of sync across duplicated code paths for code the web app's own
UI calls.

### III. Version-Pinned Correctness (NON-NEGOTIABLE)
Code MUST match the framework and library majors actually installed, not older
training-data conventions: Next 16 (`proxy`, not `middleware.ts`; `params`/
`searchParams` are Promises), Prisma 7 (`@/generated/prisma/client`, not
`@prisma/client`; no `url` in the schema `datasource`; the singleton `prisma`
import from `src/lib/prisma.ts`, never `new PrismaClient()`), Tailwind v4
(CSS-first `@theme` config, no `tailwind.config.js`), and React Compiler lint
rules (`react-hooks/*`). Raw SQL MUST use tagged-template `$queryRaw` with bound
params — never `$queryRawUnsafe` or string concatenation.
**Rationale**: These are the gotchas most likely to reintroduce regressions
during a refactor; violating any one of them reintroduces a class of bug this
project has already paid down.

### IV. Composable, Disjoint Design Tokens
The appearance system (base, accent, size, font, surface, radius, card, border,
shadow) is 9 orthogonal axes, each owning disjoint CSS tokens, each persisted as
its own `User` column and seeded as a `data-*` attribute on `<html>`. A new
discrete visual axis MUST reuse the generic `AppearancePicker` and MUST NOT
introduce overlapping tokens with an existing axis.
**Rationale**: Composability breaks the moment two axes fight over the same
CSS variable; keeping them disjoint is what lets axes be added or changed
independently without a combinatorial explosion of overrides.

### V. Evidence-Driven Refactoring
Refactor targets are chosen from measured signals — the graphify knowledge
graph's god nodes, low-cohesion communities, isolated nodes, and surprising
connections (`graphify-out/GRAPH_REPORT.md`) — not from general "modernize
everything" instinct. Each spec-kit feature spec names the specific graph
finding it addresses and its measurable target (e.g. cohesion score, edge
count, community split).
**Rationale**: "Refactor the whole project" without a concrete signal produces
churn without a stopping condition; the graph gives an auditable, falsifiable
backlog instead.

### VI. No Speculative Abstraction
Don't add interfaces, config layers, or generic wrappers for a single call
site or a hypothetical future case. Three similar lines beat a premature
abstraction. A refactor that increases the line count or file count without a
concrete, testable payoff is rejected.
**Rationale**: This project explicitly favors boring, deletable code over
clever indirection (see house style in `CLAUDE.md`); a "modernization" pass
that adds layers contradicts that style rather than upholding it.

### VII. External-Client API Is a Deliberate, Scoped Exception
A non-browser, non-cookie client (e.g. a browser extension running on its own
`chrome-extension://`/`moz-extension://` origin) MAY be served by a versioned
REST surface under `src/app/api/v1/*`, authenticated by a bearer token issued
through an explicit grant flow — never by relaxing CORS/cookie policy on the
web app's session cookie. This surface MUST be: (a) additive only — it never
replaces or bypasses a server action the web app itself uses; (b) read-mostly
by default — a new external-client mutation endpoint requires the same
auth/ownership/zod-validation discipline as Principle II, restated explicitly
in that endpoint's spec, not assumed; (c) independently revocable — issued
tokens must be listable and revokable by the user without contacting support.
**Rationale**: Principle II's "no REST for mutations" rule assumes a same-origin
browser client that already holds the session cookie; an extension is a
genuinely different trust boundary, and pretending it can use the same
cookie-based pathway either fails outright (cookies aren't readable
cross-origin) or invites weakening CORS/SameSite for the whole app to
accommodate it. Naming the exception explicitly — instead of quietly bending
Principle II — keeps the web app's mutation pathway singular while giving
external clients a real, scoped alternative.

## Verification Gate

No task is complete until `npx tsc --noEmit` and `npm run lint` both pass. UI or
behavior-affecting changes MUST additionally be exercised against the running
Docker stack (`docker compose up --build`, `localhost:3000`) — type checking
alone does not verify feature correctness. Any deliberately deferred corner-cut
(e.g. a naive scan pending a future index) must be marked in code with a comment
naming the ceiling and the upgrade trigger.

## Governance

This constitution supersedes ad-hoc practice for all spec-kit-driven work in this
repository; CLAUDE.md and README.md remain the source of truth for setup/commands
and are kept in sync with any principle change here. Amendments require: (1) a
stated rationale, (2) a version bump per semantic versioning (MAJOR: principle
removed/redefined incompatibly; MINOR: principle added or materially expanded;
PATCH: wording/clarification only), and (3) a check that `plan-template.md`,
`spec-template.md`, and `tasks-template.md` still align. Every `/speckit-plan`
run MUST verify its Constitution Check section against the current version of
this document before proceeding to task generation.

**Version**: 1.1.0 | **Ratified**: 2026-07-11 | **Last Amended**: 2026-07-11
