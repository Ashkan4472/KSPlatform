import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard, type FeedPost } from "@/components/feed/PostCard";
import { initialsOf } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: user ? `${user.name} — KSPlatform` : "Profile — KSPlatform" };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const isOwner = viewer?.id === id;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      posts: {
        // Owners also see their own drafts on their profile.
        where: isOwner ? {} : { status: "PUBLISHED" },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: { include: { tag: { select: { name: true, slug: true } } } },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const posts: FeedPost[] = user.posts.map((p) => ({
    id: p.id,
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
      <header className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
          <AvatarFallback className="text-lg">
            {initialsOf(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          {user.bio && (
            <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>
          )}
        </div>
      </header>

      <h2 className="mb-4 mt-8 text-lg font-medium">
        {isOwner ? "Your posts" : "Posts"}
      </h2>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            No posts yet.
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </div>
  );
}
