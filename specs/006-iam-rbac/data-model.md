# Data Model: IAM Module with Per-User Permission Overrides

## Permission (code-level catalog, not a database table)

Defined in `src/lib/permissions.ts` as a fixed const list — permissions
are tied to app features/sections and maintained by developers, not
created dynamically (spec Assumptions).

| Key | Label | Governs |
|-----|-------|---------|
| `posts:moderate` | Moderate posts | Deleting/moderating any post |
| `tweets:moderate` | Moderate tweets | Deleting/moderating any tweet |
| `comments:moderate` | Moderate comments | Deleting/moderating any comment |
| `users:manage` | Manage users | The `/admin` Users tab (list, delete) |
| `tags:manage` | Manage tags | Tag administration surfaces |

## UserPermission

An explicit grant of one permission to one user.

| Field         | Type       | Notes |
|---------------|------------|-------|
| `id`          | `String` (cuid) | Primary key |
| `userId`      | `String`   | The user who holds this permission |
| `permission`  | `String`   | One of the `Permission` catalog keys (validated at the application layer via zod `z.enum`, not a DB foreign key — the catalog isn't a table) |
| `grantedById` | `String`   | The admin who granted it |
| `createdAt`   | `DateTime` | Grant timestamp |

**Relationships**: `userId` → `User.id` (cascade delete — if a user is
deleted, their grants go with them). `grantedById` → `User.id` (cascade
delete — if the granting admin's account is later deleted, the grant
record is also removed; the grant itself doesn't need to survive its
granter's account).

**Validation rules**: `(userId, permission)` is unique — a user can only
hold each permission once (granting an already-held permission is a
no-op, not a duplicate row).

**State transitions**: A grant simply exists or doesn't; "revoke" deletes
the row (no soft-delete/audit-preserving tombstone needed for v1 — the
`createdAt`/`grantedById` on the *existing* row is the audit trail while
it's active, and revocation is expected to be an intentional, visible admin
action, not something requiring forensic history in v1).

## Effective Permissions (computed, not persisted)

For a given user: if `role === "ADMIN"`, every catalog permission
(source: "role"). Otherwise, the set of `permission` values from their
`UserPermission` rows (source: "grant", with `grantedById`/`createdAt`
from that row).
