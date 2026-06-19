"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { postSchema, type PostInput } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";
import { excerptFromMarkdown } from "@/lib/markdown";

type ActionResult = { error?: string };

/** Upsert tags by name (free-form) and return their ids. */
async function resolveTagIds(names: string[]): Promise<string[]> {
  const unique = Array.from(
    new Set(names.map((n) => n.trim()).filter(Boolean)),
  );
  const ids: string[] = [];
  for (const name of unique) {
    const tag = await prisma.tag.upsert({
      where: { name: name.toLowerCase() },
      update: {},
      create: { name: name.toLowerCase(), slug: slugify(name) },
    });
    ids.push(tag.id);
  }
  return ids;
}

/** Create notifications for everyone subscribed to the post's tags. */
async function notifySubscribers(
  postId: string,
  tagIds: string[],
  authorId: string,
) {
  if (tagIds.length === 0) return;
  const subs = await prisma.subscription.findMany({
    where: { tagId: { in: tagIds }, userId: { not: authorId } },
    select: { userId: true, tagId: true },
  });

  const seen = new Set<string>();
  const data = subs
    .filter((s) => {
      if (seen.has(s.userId)) return false;
      seen.add(s.userId);
      return true;
    })
    .map((s) => ({ userId: s.userId, postId, tagId: s.tagId }));

  if (data.length > 0) {
    await prisma.notification.createMany({ data });
  }
}

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
    await notifySubscribers(post.id, tagIds, userId);
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
    await notifySubscribers(postId, tagIds, userId);
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
  if (!existing || existing.authorId !== userId) {
    return { error: "Post not found" };
  }
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/");
  redirect("/");
}
