"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUserId, isAdmin } from "@/lib/session";
import { tweetSchema, type TweetInput } from "@/lib/validation";
import { resolveTagIds, notifySubscribers } from "@/lib/tagging";
import {
  tweetInclude,
  tweetFeedWhere,
  toTweetView,
  type TweetView,
} from "@/lib/tweets";
import { FEED_PAGE_SIZE, type FeedFilter } from "@/lib/feed";
import type { ActionResult } from "@/lib/actions";
import type { Page } from "@/lib/pagination";

export async function createTweetAction(
  input: TweetInput,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = tweetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid tweet" };
  }
  const { body, imageUrl, tags } = parsed.data;
  const tagIds = await resolveTagIds(tags);

  const tweet = await prisma.tweet.create({
    data: {
      body,
      imageUrl: imageUrl ? imageUrl : null,
      authorId: userId,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
  });

  await notifySubscribers({ tagIds, authorId: userId, tweetId: tweet.id });

  revalidatePath("/");
  revalidatePath("/tweets");
  return {};
}

export async function deleteTweetAction(
  tweetId: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const tweet = await prisma.tweet.findUnique({
    where: { id: tweetId },
    select: { authorId: true },
  });
  if (!tweet) return { error: "Tweet not found" };
  if (tweet.authorId !== userId && !(await isAdmin())) {
    return { error: "Not allowed" };
  }
  await prisma.tweet.delete({ where: { id: tweetId } });
  revalidatePath("/");
  revalidatePath("/tweets");
  return {};
}

export async function toggleTweetLikeAction(
  tweetId: string,
): Promise<{ active: boolean; count: number }> {
  const userId = await requireUserId();
  const existing = await prisma.tweetLike.findUnique({
    where: { userId_tweetId: { userId, tweetId } },
  });
  if (existing) {
    await prisma.tweetLike.delete({
      where: { userId_tweetId: { userId, tweetId } },
    });
  } else {
    await prisma.tweetLike.create({ data: { userId, tweetId } });
  }
  const count = await prisma.tweetLike.count({ where: { tweetId } });
  return { active: !existing, count };
}

/** Cursor-paginated tweets feed (cursor = last tweet id of the prior page). */
export async function loadMoreTweets({
  filter,
  tag,
  cursor,
}: {
  filter: FeedFilter;
  tag?: string;
  cursor: string;
}): Promise<Page<TweetView>> {
  const user = await getCurrentUser();
  const rows = await prisma.tweet.findMany({
    where: tweetFeedWhere({ filter, tag, userId: user?.id }),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    skip: 1,
    cursor: { id: cursor },
    include: tweetInclude(user?.id),
  });
  return {
    items: rows.map(toTweetView),
    nextCursor:
      rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null,
  };
}
