"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { commentSchema } from "@/lib/validation";

type ActionResult = { error?: string };

export async function addCommentAction(
  postId: string,
  body: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = commentSchema.safeParse({ postId, body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment" };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { slug: true },
  });
  if (!post) return { error: "Post not found" };

  await prisma.comment.create({
    data: { postId, authorId: userId, body: parsed.data.body },
  });

  revalidatePath(`/posts/${post.slug}`);
  return {};
}

export async function deleteCommentAction(
  commentId: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, post: { select: { slug: true } } },
  });
  if (!comment || comment.authorId !== userId) {
    return { error: "Comment not found" };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/posts/${comment.post.slug}`);
  return {};
}
