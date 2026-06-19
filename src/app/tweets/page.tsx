import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TweetComposer } from "@/components/tweets/TweetComposer";
import { TweetFeed } from "@/components/tweets/TweetFeed";
import { tweetInclude, tweetFeedWhere, toTweetView } from "@/lib/tweets";
import { FEED_PAGE_SIZE } from "@/lib/feed";

export const metadata = { title: "Tweets — KSPlatform" };

export default async function TweetsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const user = await getCurrentUser();

  const rows = await prisma.tweet.findMany({
    where: tweetFeedWhere({ filter: "all", tag, userId: user?.id }),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    include: tweetInclude(user?.id),
  });

  const initialItems = rows.map(toTweetView);
  const initialCursor =
    rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">
        Tweets{tag ? ` · #${tag}` : ""}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Short thoughts, quick updates.
      </p>

      {user && (
        <div className="mb-6">
          <TweetComposer />
        </div>
      )}

      <TweetFeed
        initialItems={initialItems}
        initialCursor={initialCursor}
        filter="all"
        tag={tag}
        currentUserId={user?.id}
        emptyState={
          <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
            {tag ? `No tweets tagged #${tag} yet.` : "No tweets yet."}
          </div>
        }
      />
    </div>
  );
}
