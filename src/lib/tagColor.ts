const TAG_PALETTE = ["tag-1", "tag-2", "tag-3", "tag-4", "tag-5", "tag-6"] as const;

/**
 * specs/007: a tag's display color is computed from its slug, never
 * stored — no `color` column on `Tag`, works for any number of tags.
 * Deterministic: same slug always resolves to the same one of 6 fixed
 * CSS custom properties (defined in globals.css for light and dark).
 */
export function tagColorVar(slug: string): string {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `var(--${TAG_PALETTE[hash % TAG_PALETTE.length]})`;
}
