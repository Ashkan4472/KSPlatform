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

export type UserSummary = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  role: "USER" | "ADMIN";
  postCount: number;
  tweetCount: number;
};

export type UserPage = { items: UserSummary[]; nextCursor: string | null };

export const usersSelect = {
  id: true,
  name: true,
  image: true,
  bio: true,
  role: true,
  _count: { select: { posts: true, tweets: true } },
} as const;

type RawUser = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  role: "USER" | "ADMIN";
  _count: { posts: number; tweets: number };
};

export function toUserSummary(u: RawUser): UserSummary {
  return {
    id: u.id,
    name: u.name,
    image: u.image,
    bio: u.bio,
    role: u.role,
    postCount: u._count.posts,
    tweetCount: u._count.tweets,
  };
}

/** Cursor-paginated users directory. `cursor` is the last user id of the prior page. */
export async function loadMoreUsers({
  cursor,
}: {
  cursor: string;
}): Promise<UserPage> {
  const rows = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    skip: 1,
    cursor: { id: cursor },
    select: usersSelect,
  });
  return {
    items: rows.map(toUserSummary),
    nextCursor:
      rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null,
  };
}

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
