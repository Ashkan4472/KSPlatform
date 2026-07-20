import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

/** Upsert free-form tags by name (lowercased) and return their ids. */
export async function resolveTagIds(names: string[]): Promise<string[]> {
  const unique = Array.from(
    new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean)),
  );
  const ids: string[] = [];
  for (const name of unique) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
    ids.push(tag.id);
  }
  return ids;
}

/**
 * Notify everyone subscribed to the given tags about a new post or tweet
 * (deduped per user, excluding the author).
 */
export async function notifySubscribers({
  tagIds,
  authorId,
  postId,
  tweetId,
}: {
  tagIds: string[];
  authorId: string;
  postId?: string;
  tweetId?: string;
}): Promise<void> {
  if (tagIds.length === 0) return;
  const subs = await prisma.subscription.findMany({
    where: {
      tagId: { in: tagIds },
      userId: { not: authorId },
      // specs/007: respect the per-user notification opt-out — the
      // subscription itself (and its effect on the subscribed-tags feed)
      // is unaffected either way.
      user: { notificationsEnabled: true },
    },
    select: { userId: true, tagId: true },
  });

  const seen = new Set<string>();
  const data = subs
    .filter((s) => {
      if (seen.has(s.userId)) return false;
      seen.add(s.userId);
      return true;
    })
    .map((s) => ({ userId: s.userId, tagId: s.tagId, postId, tweetId }));

  if (data.length > 0) {
    await prisma.notification.createMany({ data });
  }
}
