"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { FEED_PAGE_SIZE } from "@/lib/feed";
import type { ActionResult } from "@/lib/actions";
import type { Page } from "@/lib/pagination";
import { idCursorArgs } from "@/lib/pagination";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: Date;
  postCount: number;
  tweetCount: number;
  commentCount: number;
};
export type AdminPostRow = {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  authorName: string;
};
export type AdminTweetRow = {
  id: string;
  body: string;
  authorName: string;
};

export async function adminListUsers({
  cursor,
}: {
  cursor?: string | null;
}): Promise<Page<AdminUserRow>> {
  await requirePermission("user:all:delete");
  const rows = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    ...idCursorArgs(cursor),
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { posts: true, tweets: true, comments: true } },
    },
  });
  return {
    items: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      postCount: u._count.posts,
      tweetCount: u._count.tweets,
      commentCount: u._count.comments,
    })),
    nextCursor: rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null,
  };
}

export async function adminListPosts({
  cursor,
}: {
  cursor?: string | null;
}): Promise<Page<AdminPostRow>> {
  await requirePermission("post:all:delete");
  const rows = await prisma.post.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    ...idCursorArgs(cursor),
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      author: { select: { name: true } },
    },
  });
  return {
    items: rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      authorName: p.author.name,
    })),
    nextCursor: rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null,
  };
}

export async function adminListTweets({
  cursor,
}: {
  cursor?: string | null;
}): Promise<Page<AdminTweetRow>> {
  await requirePermission("tweet:all:delete");
  const rows = await prisma.tweet.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    ...idCursorArgs(cursor),
    select: {
      id: true,
      body: true,
      author: { select: { name: true } },
    },
  });
  return {
    items: rows.map((t) => ({
      id: t.id,
      body: t.body,
      authorName: t.author.name,
    })),
    nextCursor: rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null,
  };
}

export async function adminDeletePost(postId: string): Promise<ActionResult> {
  await requirePermission("post:all:delete");
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function adminDeleteTweet(tweetId: string): Promise<ActionResult> {
  await requirePermission("tweet:all:delete");
  await prisma.tweet.delete({ where: { id: tweetId } });
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function adminDeleteUser(userId: string): Promise<ActionResult> {
  const adminId = await requirePermission("user:all:delete");
  if (userId === adminId) {
    return { error: "You cannot delete your own account here" };
  }
  // Cascades remove the user's posts, tweets, comments, likes, etc.
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
  revalidatePath("/people");
  return {};
}
