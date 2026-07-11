"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { FeedPost } from "@/components/feed/PostCard";
import { FEED_PAGE_SIZE, postFeedInclude, toFeedPost } from "@/lib/feed";
import { tweetInclude, toTweetView, type TweetView } from "@/lib/tweets";
import type { Page } from "@/lib/pagination";
import { idCursorArgs } from "@/lib/pagination";

/** A user's posts, newest first. Drafts are included only for the owner. */
export async function loadUserPosts({
  userId,
  cursor,
}: {
  userId: string;
  cursor?: string | null;
}): Promise<Page<FeedPost>> {
  const viewer = await getCurrentUser();
  const isOwner = viewer?.id === userId;

  const rows = await prisma.post.findMany({
    where: {
      authorId: userId,
      ...(isOwner ? {} : { status: "PUBLISHED" }),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    ...idCursorArgs(cursor),
    include: postFeedInclude,
  });

  return {
    items: rows.map(toFeedPost),
    nextCursor:
      rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null,
  };
}

/** A user's tweets, newest first. */
export async function loadUserTweets({
  userId,
  cursor,
}: {
  userId: string;
  cursor?: string | null;
}): Promise<Page<TweetView>> {
  const viewer = await getCurrentUser();

  const rows = await prisma.tweet.findMany({
    where: { authorId: userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    ...idCursorArgs(cursor),
    include: tweetInclude(viewer?.id),
  });

  return {
    items: rows.map(toTweetView),
    nextCursor:
      rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null,
  };
}
