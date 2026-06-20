"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { FeedPost } from "@/components/feed/PostCard";
import { FEED_PAGE_SIZE, postFeedInclude, toFeedPost } from "@/lib/feed";
import { tweetInclude, toTweetView, type TweetView } from "@/lib/tweets";

export type PostSearchPage = { items: FeedPost[]; nextCursor: string | null };
export type TweetSearchPage = { items: TweetView[]; nextCursor: string | null };

const MAX_Q = 100;

function normalize(q: string): string {
  return q.trim().toLowerCase().slice(0, MAX_Q);
}

function parseOffset(cursor?: string | null): number {
  const n = cursor ? Number.parseInt(cursor, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Trigram-ranked post search (title fuzzy + title/body substring), published only.
 * Offset cursor (ranked order is stable per query). All inputs are bound params.
 */
export async function searchPosts({
  q,
  cursor,
}: {
  q: string;
  cursor?: string | null;
}): Promise<PostSearchPage> {
  const query = normalize(q);
  if (!query) return { items: [], nextCursor: null };
  const offset = parseOffset(cursor);
  const like = `%${query}%`;

  const ranked = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Post"
    WHERE status = 'PUBLISHED'
      AND (title % ${query} OR title ILIKE ${like} OR "contentMd" ILIKE ${like})
    ORDER BY similarity(title, ${query}) DESC, "publishedAt" DESC
    LIMIT ${FEED_PAGE_SIZE} OFFSET ${offset}`;

  const ids = ranked.map((r) => r.id);
  if (ids.length === 0) return { items: [], nextCursor: null };

  const rows = await prisma.post.findMany({
    where: { id: { in: ids } },
    include: postFeedInclude,
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const items = ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(toFeedPost);

  return {
    items,
    nextCursor: ranked.length === FEED_PAGE_SIZE ? String(offset + FEED_PAGE_SIZE) : null,
  };
}

/** Trigram-ranked tweet search. Offset cursor. All inputs are bound params. */
export async function searchTweets({
  q,
  cursor,
}: {
  q: string;
  cursor?: string | null;
}): Promise<TweetSearchPage> {
  const query = normalize(q);
  if (!query) return { items: [], nextCursor: null };
  const offset = parseOffset(cursor);
  const like = `%${query}%`;
  const viewer = await getCurrentUser();

  const ranked = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Tweet"
    WHERE body % ${query} OR body ILIKE ${like}
    ORDER BY similarity(body, ${query}) DESC, "createdAt" DESC
    LIMIT ${FEED_PAGE_SIZE} OFFSET ${offset}`;

  const ids = ranked.map((r) => r.id);
  if (ids.length === 0) return { items: [], nextCursor: null };

  const rows = await prisma.tweet.findMany({
    where: { id: { in: ids } },
    include: tweetInclude(viewer?.id),
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const items = ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(toTweetView);

  return {
    items,
    nextCursor: ranked.length === FEED_PAGE_SIZE ? String(offset + FEED_PAGE_SIZE) : null,
  };
}
