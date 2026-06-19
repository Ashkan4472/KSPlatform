import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { UnifiedFeed } from "@/components/feed/UnifiedFeed";
import { TrendingPosts } from "@/components/feed/TrendingPosts";
import { Button } from "@/components/ui/button";
import { loadTimeline } from "@/actions/timeline";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; tag?: string }>;
}) {
  const { filter: filterParam, tag } = await searchParams;
  const filter = filterParam === "subscribed" ? "subscribed" : "all";
  const user = await getCurrentUser();

  const [{ items, nextCursor }, tags] = await Promise.all([
    loadTimeline({ filter, tag, cursor: null }),
    prisma.tag.findMany({
      orderBy: { posts: { _count: "desc" } },
      take: 12,
      select: { name: true, slug: true },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
      <div className="min-w-0">
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
          <UnifiedFeed
            initialItems={items}
            initialCursor={nextCursor}
            filter={filter}
            tag={tag}
            currentUserId={user?.id}
            emptyState={
              <EmptyState filter={filter} tag={tag} isAuthed={!!user} />
            }
          />
        </div>
      </div>

      <aside className="mt-8 lg:mt-0">
        <div className="lg:sticky lg:top-20">
          <Suspense fallback={null}>
            <TrendingPosts />
          </Suspense>
        </div>
      </aside>
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
