"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { FeedPost } from "@/components/feed/PostCard";
import {
  FEED_PAGE_SIZE,
  postFeedInclude,
  postFeedOrderBy,
  postFeedWhere,
  toFeedPost,
  type FeedFilter,
} from "@/lib/feed";

export type PostPage = { items: FeedPost[]; nextCursor: string | null };

/** Cursor-paginated posts feed. `cursor` is the last post id of the prior page. */
export async function loadMorePosts({
  filter,
  tag,
  cursor,
}: {
  filter: FeedFilter;
  tag?: string;
  cursor: string;
}): Promise<PostPage> {
  const user = await getCurrentUser();
  const rows = await prisma.post.findMany({
    where: postFeedWhere({ filter, tag, userId: user?.id }),
    orderBy: postFeedOrderBy,
    take: FEED_PAGE_SIZE,
    skip: 1,
    cursor: { id: cursor },
    include: postFeedInclude,
  });

  return {
    items: rows.map(toFeedPost),
    nextCursor:
      rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null,
  };
}
