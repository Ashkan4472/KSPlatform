import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { PostCard, type FeedPost } from "@/components/feed/PostCard";
import { Button } from "@/components/ui/button";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; tag?: string }>;
}) {
  const { filter: filterParam, tag } = await searchParams;
  const filter = filterParam === "subscribed" ? "subscribed" : "all";
  const user = await getCurrentUser();

  const and: Prisma.PostWhereInput[] = [{ status: "PUBLISHED" }];
  if (tag) {
    and.push({ tags: { some: { tag: { slug: tag } } } });
  }
  if (filter === "subscribed" && user?.id) {
    and.push({
      tags: { some: { tag: { subscriptions: { some: { userId: user.id } } } } },
    });
  }

  const [posts, tags] = await Promise.all([
    prisma.post.findMany({
      where: { AND: and },
      orderBy: { publishedAt: "desc" },
      take: 50,
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.tag.findMany({
      orderBy: { posts: { _count: "desc" } },
      take: 12,
      select: { name: true, slug: true },
    }),
  ]);

  const feedPosts: FeedPost[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    status: p.status,
    author: p.author,
    tags: p.tags.map((pt) => pt.tag),
    likeCount: p._count.likes,
    commentCount: p._count.comments,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Knowledge feed</h1>
          <p className="text-sm text-muted-foreground">
            Discover and share what you know.
          </p>
        </div>
        {user && (
          <Button asChild size="sm">
            <Link href="/new">Write a post</Link>
          </Button>
        )}
      </div>

      <FeedFilters
        tags={tags}
        activeFilter={filter}
        activeTag={tag}
        isAuthed={!!user}
      />

      <div className="mt-6 space-y-4">
        {feedPosts.length === 0 ? (
          <EmptyState filter={filter} tag={tag} isAuthed={!!user} />
        ) : (
          feedPosts.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </div>
  );
}

function EmptyState({
  filter,
  tag,
  isAuthed,
}: {
  filter: string;
  tag?: string;
  isAuthed: boolean;
}) {
  let message = "No posts yet. Be the first to share something!";
  if (tag) message = `No posts tagged #${tag} yet.`;
  else if (filter === "subscribed")
    message = isAuthed
      ? "Nothing here yet. Subscribe to tags to build your feed."
      : "Log in to see posts from your subscriptions.";

  return (
    <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
