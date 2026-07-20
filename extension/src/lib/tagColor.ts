const TAG_PALETTE = [
  "#6B5CE0",
  "#E0913D",
  "#2FA893",
  "#DD5C8A",
  "#3E8FD9",
  "#C9A227",
] as const;

export function tagColor(slug: string): string {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}
