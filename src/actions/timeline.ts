"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  FEED_PAGE_SIZE,
  postFeedInclude,
  postFeedWhere,
  toFeedPost,
  type FeedFilter,
} from "@/lib/feed";
import { tweetInclude, tweetFeedWhere, toTweetView } from "@/lib/tweets";
import type { FeedPost } from "@/components/feed/PostCard";
import type { TweetView } from "@/lib/tweets";

export type FeedItem =
  | { kind: "post"; sortAt: string; post: FeedPost }
  | { kind: "tweet"; sortAt: string; tweet: TweetView };

export type TimelinePage = { items: FeedItem[]; nextCursor: string | null };

/**
 * Unified home timeline merging posts and tweets, newest first.
 * `cursor` is an ISO timestamp; the next page returns items strictly older.
 */
export async function loadTimeline({
  filter,
  tag,
  cursor,
}: {
  filter: FeedFilter;
  tag?: string;
  cursor?: string | null;
}): Promise<TimelinePage> {
  const user = await getCurrentUser();
  const before = cursor ? new Date(cursor) : null;

  const postWhere = postFeedWhere({ filter, tag, userId: user?.id });
  const tweetWhere = tweetFeedWhere({ filter, tag, userId: user?.id });

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
      include: tweetInclude(user?.id),
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
  // More may exist if either source filled its page or we trimmed the merge.
  const hasMore =
    posts.length === FEED_PAGE_SIZE ||
    tweets.length === FEED_PAGE_SIZE ||
    merged.length > FEED_PAGE_SIZE;
  const nextCursor =
    hasMore && page.length > 0 ? page[page.length - 1].sortAt : null;

  return { items: page, nextCursor };
}
