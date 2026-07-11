# Data Model: Browser Extension Device-Flow Authentication

## DeviceGrant

Represents one pending "let this extension access my account" request.

| Field       | Type       | Notes |
|-------------|------------|-------|
| `id`        | `String` (cuid) | Primary key |
| `deviceCode`| `String` (unique) | Long, high-entropy, sent to and held by the extension only |
| `userCode`  | `String` (unique) | Short, human-typeable (e.g. `WXYZ-1234`), shown to the user |
| `userId`    | `String?` | Set once a signed-in user approves; `null` while pending |
| `status`    | enum: `PENDING \| APPROVED \| DENIED \| EXPIRED` | |
| `expiresAt` | `DateTime` | `createdAt` + 10 minutes (FR-004) |
| `createdAt` | `DateTime` | |

**Relationships**: `userId` → `User.id` (nullable FK, set on approval).
On approval, exactly one `ExtensionToken` is created and linked back to this
grant's originating request (for audit/labeling — e.g. "approved on
2026-07-11").

**Validation rules**:
- `userCode` uniqueness enforced only among currently-`PENDING` grants
  (an expired/approved code's `userCode` may be reused by a later request).
- A grant already `APPROVED`/`DENIED`/`EXPIRED` MUST reject a second
  approval attempt (Edge Case: double-approval is a no-op, not a duplicate
  token).

**State transitions**: `PENDING → APPROVED` (user approves, before
`expiresAt`) · `PENDING → DENIED` (user explicitly declines) · `PENDING →
EXPIRED` (checked lazily on read/poll once past `expiresAt`, no background
job required — Principle VI, no speculative infrastructure).

## ExtensionToken

Represents one approved, revocable, long-lived credential for one extension
installation.

| Field        | Type      | Notes |
|--------------|-----------|-------|
| `id`         | `String` (cuid) | Primary key |
| `userId`     | `String`  | Owner |
| `tokenHash`  | `String`  | `bcrypt` hash of the raw bearer token — raw value is never persisted (mirrors `User.passwordHash`) |
| `label`      | `String`  | Human-readable, e.g. "Browser Extension — Chrome" (browser detected from the connect flow's user agent, editable by the user later if desired — editing is out of scope for v1) |
| `createdAt`  | `DateTime`| |
| `lastUsedAt` | `DateTime?` | Updated (best-effort, not every single request needs a synchronous write) on successful API use |
| `revokedAt`  | `DateTime?` | `null` while active; set on revoke |

**Relationships**: `userId` → `User.id` (cascade delete, consistent with
existing `Subscription`/`Comment` cascade behavior).

**Validation rules**: A request bearing a token whose `revokedAt` is set, or
whose hash doesn't match any active token, MUST be rejected with the
FR-006 "reauthenticate" signal — not a generic 401/500.

**State transitions**: `active → revoked` (one-way; a revoked token is never
reactivated — the user reconnects and gets a new one).
