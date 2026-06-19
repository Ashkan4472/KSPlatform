import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { PostForm } from "@/components/editor/PostForm";

export const metadata = { title: "Edit post — KSPlatform" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userId = await requireUserId(`/posts/${slug}/edit`);

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { tags: { include: { tag: true } } },
  });

  if (!post) notFound();
  if (post.authorId !== userId) redirect(`/posts/${slug}`);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Edit post</h1>
      <PostForm
        mode="edit"
        post={{
          id: post.id,
          title: post.title,
          contentMd: post.contentMd,
          tags: post.tags.map((pt) => pt.tag.name),
        }}
      />
    </div>
  );
}
