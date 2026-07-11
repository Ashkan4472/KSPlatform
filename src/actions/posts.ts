"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId, isAdmin } from "@/lib/session";
import { postSchema, type PostInput } from "@/lib/validation";
import { uniqueSlug } from "@/lib/slug";
import { excerptFromMarkdown } from "@/lib/markdown";
import { resolveTagIds, notifySubscribers } from "@/lib/tagging";
import type { ActionResult } from "@/lib/actions";

export async function createPostAction(input: PostInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { title, contentMd, tags, status } = parsed.data;

  const slug = await uniqueSlug(
    title,
    async (s) => (await prisma.post.count({ where: { slug: s } })) > 0,
  );
  const tagIds = await resolveTagIds(tags);

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      contentMd,
      excerpt: excerptFromMarkdown(contentMd),
      status,
      authorId: userId,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
  });

  if (status === "PUBLISHED") {
    await notifySubscribers({ tagIds, authorId: userId, postId: post.id });
  }

  revalidatePath("/");
  redirect(`/posts/${post.slug}`);
}

export async function updatePostAction(
  postId: string,
  input: PostInput,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { title, contentMd, tags, status } = parsed.data;

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, status: true, slug: true, publishedAt: true },
  });
  if (!existing || existing.authorId !== userId) {
    return { error: "Post not found" };
  }

  const tagIds = await resolveTagIds(tags);
  const justPublished =
    status === "PUBLISHED" && existing.status !== "PUBLISHED";

  await prisma.$transaction([
    prisma.postTag.deleteMany({ where: { postId } }),
    prisma.post.update({
      where: { id: postId },
      data: {
        title,
        contentMd,
        excerpt: excerptFromMarkdown(contentMd),
        status,
        publishedAt:
          status === "PUBLISHED"
            ? (existing.publishedAt ?? new Date())
            : null,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    }),
  ]);

  if (justPublished) {
    await notifySubscribers({ tagIds, authorId: userId, postId });
  }

  revalidatePath("/");
  revalidatePath(`/posts/${existing.slug}`);
  redirect(`/posts/${existing.slug}`);
}

export async function deletePostAction(postId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!existing) return { error: "Post not found" };
  if (existing.authorId !== userId && !(await isAdmin())) {
    return { error: "Not allowed" };
  }
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/");
  redirect("/");
}
