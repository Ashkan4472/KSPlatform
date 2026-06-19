import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "@/components/posts/Markdown";
import { PostActions } from "@/components/posts/PostActions";
import { CommentForm } from "@/components/posts/CommentForm";
import { CommentItem } from "@/components/posts/CommentItem";
import { formatDate, initialsOf } from "@/lib/format";

async function getPost(slug: string) {
  return prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      },
      _count: { select: { likes: true, bookmarks: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });
  if (!post) return { title: "Post not found — KSPlatform" };
  return {
    title: `${post.title} — KSPlatform`,
    description: post.excerpt ?? undefined,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const post = await getPost(slug);

  if (!post) notFound();

  const isAuthor = user?.id === post.authorId;
  // Drafts are visible only to their author.
  if (post.status === "DRAFT" && !isAuthor) notFound();

  let likedByMe = false;
  let bookmarkedByMe = false;
  if (user?.id) {
    const [like, bookmark] = await Promise.all([
      prisma.like.findUnique({
        where: { userId_postId: { userId: user.id, postId: post.id } },
      }),
      prisma.bookmark.findUnique({
        where: { userId_postId: { userId: user.id, postId: post.id } },
      }),
    ]);
    likedByMe = !!like;
    bookmarkedByMe = !!bookmark;
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8">
      {post.status === "DRAFT" && (
        <div className="mb-4 rounded-md border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          This is a draft — only you can see it.
        </div>
      )}

      <header className="space-y-4">
        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <Avatar className="h-9 w-9">
            {post.author.image ? (
              <AvatarImage src={post.author.image} alt={post.author.name} />
            ) : null}
            <AvatarFallback>{initialsOf(post.author.name)}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <Link
              href={`/u/${post.author.id}`}
              className="font-medium hover:underline"
            >
              {post.author.name}
            </Link>
            <p className="text-muted-foreground">
              {formatDate(post.publishedAt ?? post.createdAt)}
            </p>
          </div>
          {isAuthor && (
            <Button asChild variant="outline" size="sm" className="ml-auto">
              <Link href={`/posts/${post.slug}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((pt) => (
              <Link key={pt.tag.slug} href={`/?tag=${pt.tag.slug}`}>
                <Badge variant="secondary">#{pt.tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      <Separator className="my-6" />

      <Markdown content={post.contentMd} />

      <Separator className="my-6" />

      <PostActions
        postId={post.id}
        slug={post.slug}
        title={post.title}
        contentMd={post.contentMd}
        initialLikes={post._count.likes}
        initialBookmarks={post._count.bookmarks}
        likedByMe={likedByMe}
        bookmarkedByMe={bookmarkedByMe}
      />

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">
          {post.comments.length} comment
          {post.comments.length === 1 ? "" : "s"}
        </h2>

        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to join the discussion.
          </p>
        )}

        <div className="mt-6 space-y-6">
          {post.comments.map((c) => (
            <CommentItem
              key={c.id}
              id={c.id}
              body={c.body}
              createdAt={c.createdAt}
              author={c.author}
              canDelete={user?.id === c.authorId}
            />
          ))}
        </div>
      </section>
    </article>
  );
}
