"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type ActionResult = { error?: string };

export async function adminDeletePost(postId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function adminDeleteTweet(tweetId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.tweet.delete({ where: { id: tweetId } });
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function adminDeleteUser(userId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  if (userId === adminId) {
    return { error: "You cannot delete your own account here" };
  }
  // Cascades remove the user's posts, tweets, comments, likes, etc.
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
  revalidatePath("/people");
  return {};
}
