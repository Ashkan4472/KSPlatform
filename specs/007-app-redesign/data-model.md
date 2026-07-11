# Data Model: Visual Redesign & Settings Completeness

## User (existing model, one new column)

| Field | Type | Notes |
|-------|------|-------|
| `notificationsEnabled` | `Boolean @default(true)` | Governs whether `notifySubscribers()` creates a `Notification` row for this user. Default `true` preserves today's always-on behavior (FR-005). |

No other schema changes. `Tag` is explicitly unchanged (FR-002/SC-002).

## Tag Color (computed function, not a table)

```ts
const TAG_PALETTE = ["tag-1", "tag-2", "tag-3", "tag-4", "tag-5", "tag-6"] as const;

function tagColorVar(slug: string): string {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `var(--${TAG_PALETTE[hash % TAG_PALETTE.length]})`;
}
```

Deterministic: same slug always resolves to the same one of 6 fixed CSS
custom properties (`--tag-1` through `--tag-6`, defined once in
`globals.css` for light and dark). No lookup table, no per-tag row.

## Notification Preference (derived, not a new entity)

Reads/writes the single `User.notificationsEnabled` column above via a
new server action — not a separate model, since there is exactly one
notification-triggering event in the app today (spec Assumptions).
