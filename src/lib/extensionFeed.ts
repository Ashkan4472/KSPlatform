import { prisma } from "@/lib/prisma";
import { FEED_PAGE_SIZE, postFeedInclude, postFeedWhere, toFeedPost } from "@/lib/feed";
import { tweetInclude, tweetFeedWhere, toTweetView } from "@/lib/tweets";
import type { Page } from "@/lib/pagination";
import type { FeedItem } from "@/actions/timeline";

/**
 * specs/004: same unified post+tweet merge as loadTimeline
 * (src/actions/timeline.ts), always scoped to the caller's subscribed tags
 * (equivalent to loadTimeline's `filter: "subscribed"`), but driven by a
 * userId resolved from a bearer token instead of the session cookie.
 */
export async function loadSubscribedFeed({
  userId,
  cursor,
}: {
  userId: string;
  cursor?: string | null;
}): Promise<Page<FeedItem>> {
  const before = cursor ? new Date(cursor) : null;

  const postWhere = postFeedWhere({ filter: "subscribed", userId });
  const tweetWhere = tweetFeedWhere({ filter: "subscribed", userId });

  const [posts, tweets] = await Promise.all([
    prisma.post.findMany({
      where: before
        ? { AND: [postWhere, { publishedAt: { lt: before } }] }
        : postWhere,
      orderBy: { publishedAt: "desc" },
      take: FEED_PAGE_SIZE,
      include: postFeedInclude,
    }),
    prisma.tweet.findMany({
      where: before
        ? { AND: [tweetWhere, { createdAt: { lt: before } }] }
        : tweetWhere,
      orderBy: { createdAt: "desc" },
      take: FEED_PAGE_SIZE,
      include: tweetInclude(userId),
    }),
  ]);

  const merged: FeedItem[] = [
    ...posts.map((p) => ({
      kind: "post" as const,
      sortAt: (p.publishedAt ?? p.createdAt).toISOString(),
      post: toFeedPost(p),
    })),
    ...tweets.map((t) => ({
      kind: "tweet" as const,
      sortAt: t.createdAt.toISOString(),
      tweet: toTweetView(t),
    })),
  ].sort((a, b) => (a.sortAt < b.sortAt ? 1 : a.sortAt > b.sortAt ? -1 : 0));

  const page = merged.slice(0, FEED_PAGE_SIZE);
  const hasMore =
    posts.length === FEED_PAGE_SIZE ||
    tweets.length === FEED_PAGE_SIZE ||
    merged.length > FEED_PAGE_SIZE;
  const nextCursor =
    hasMore && page.length > 0 ? page[page.length - 1].sortAt : null;

  return { items: page, nextCursor };
}
