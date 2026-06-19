"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export type ToggleResult = { active: boolean; count: number };

export async function toggleLikeAction(postId: string): Promise<ToggleResult> {
  const userId = await requireUserId();
  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });
  } else {
    await prisma.like.create({ data: { userId, postId } });
  }

  const count = await prisma.like.count({ where: { postId } });
  return { active: !existing, count };
}

export async function toggleBookmarkAction(
  postId: string,
): Promise<ToggleResult> {
  const userId = await requireUserId();
  const existing = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: { userId_postId: { userId, postId } },
    });
  } else {
    await prisma.bookmark.create({ data: { userId, postId } });
  }

  const count = await prisma.bookmark.count({ where: { postId } });
  return { active: !existing, count };
}
