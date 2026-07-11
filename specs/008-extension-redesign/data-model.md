# Data Model: Extension New-Tab Visual Redesign

No data model changes — this feature is a client-side restyle only.

## Extension tag color (computed, mirrors specs/007)

```ts
// extension/src/lib/tagColor.ts
const TAG_PALETTE = ["#6B5CE0", "#E0913D", "#2FA893", "#DD5C8A", "#3E8FD9", "#C9A227"] as const;

export function tagColor(slug: string): string {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}
```

Same hash algorithm as `src/lib/tagColor.ts` (specs/007); the extension
returns raw hex values directly (no shared CSS custom property system
with the main app, per specs/004's no-shared-build-step decision), so the
two implementations must be kept in sync by hand if the palette ever
changes — acceptable duplication given both are ~6 lines.
