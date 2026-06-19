import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { PostFeed } from "@/components/feed/PostFeed";
import { Button } from "@/components/ui/button";
import {
  FEED_PAGE_SIZE,
  postFeedInclude,
  postFeedOrderBy,
  postFeedWhere,
  toFeedPost,
} from "@/lib/feed";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; tag?: string }>;
}) {
  const { filter: filterParam, tag } = await searchParams;
  const filter = filterParam === "subscribed" ? "subscribed" : "all";
  const user = await getCurrentUser();

  const [posts, tags] = await Promise.all([
    prisma.post.findMany({
      where: postFeedWhere({ filter, tag, userId: user?.id }),
      orderBy: postFeedOrderBy,
      take: FEED_PAGE_SIZE,
      include: postFeedInclude,
    }),
    prisma.tag.findMany({
      orderBy: { posts: { _count: "desc" } },
      take: 12,
      select: { name: true, slug: true },
    }),
  ]);

  const feedPosts = posts.map(toFeedPost);
  const initialCursor =
    posts.length === FEED_PAGE_SIZE ? posts[posts.length - 1].id : null;

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

      <div className="mt-6">
        <PostFeed
          initialItems={feedPosts}
          initialCursor={initialCursor}
          filter={filter}
          tag={tag}
          emptyState={<EmptyState filter={filter} tag={tag} isAuthed={!!user} />}
        />
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
