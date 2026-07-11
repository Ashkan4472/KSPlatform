import type { Metadata } from "next";
import { getCurrentUser, canModerate } from "@/lib/session";
import { searchPosts, searchTweets } from "@/actions/search";
import { SearchResults } from "@/components/search/SearchResults";

export const metadata: Metadata = { title: "Search — KSPlatform" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q: rawQ, type } = await searchParams;
  const q = (rawQ ?? "").trim();
  const defaultTab = type === "tweets" ? "tweets" : "posts";
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Search</h1>
      {q ? (
        <p className="mb-6 text-sm text-muted-foreground">
          Results for <span className="font-medium text-foreground">“{q}”</span>
        </p>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          Search posts and tweets.
        </p>
      )}

      {q ? (
        <Results q={q} defaultTab={defaultTab} userId={user?.id} canModerate={canModerate(user)} />
      ) : (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          Type a query in the search box above.
        </div>
      )}
    </div>
  );
}

async function Results({
  q,
  defaultTab,
  userId,
  canModerate,
}: {
  q: string;
  defaultTab: "posts" | "tweets";
  userId?: string;
  canModerate: boolean;
}) {
  const [posts, tweets] = await Promise.all([
    searchPosts({ q, cursor: null }),
    searchTweets({ q, cursor: null }),
  ]);

  return (
    <SearchResults
      q={q}
      defaultTab={defaultTab}
      initialPosts={posts.items}
      postsCursor={posts.nextCursor}
      initialTweets={tweets.items}
      tweetsCursor={tweets.nextCursor}
      currentUserId={userId}
      canModerate={canModerate}
    />
  );
}
