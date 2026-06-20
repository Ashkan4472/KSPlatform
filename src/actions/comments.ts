"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId, isAdmin } from "@/lib/session";
import { commentSchema } from "@/lib/validation";

type ActionResult = { error?: string };

export async function addCommentAction(input: {
  postId?: string;
  tweetId?: string;
  parentId?: string;
  body: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment" };
  }
  const { postId, tweetId, parentId, body } = parsed.data;

  await prisma.comment.create({
    data: { authorId: userId, postId, tweetId, parentId, body },
  });

  if (postId) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { slug: true },
    });
    if (post) revalidatePath(`/posts/${post.slug}`);
  } else if (tweetId) {
    revalidatePath(`/tweets/${tweetId}`);
  }
  return {};
}

export async function deleteCommentAction(
  commentId: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      authorId: true,
      tweetId: true,
      post: { select: { slug: true } },
    },
  });
  if (!comment) return { error: "Comment not found" };
  if (comment.authorId !== userId && !(await isAdmin())) {
    return { error: "Not allowed" };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  if (comment.post) revalidatePath(`/posts/${comment.post.slug}`);
  if (comment.tweetId) revalidatePath(`/tweets/${comment.tweetId}`);
  return {};
}
