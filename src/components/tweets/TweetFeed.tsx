"use client";

import { InfiniteList } from "@/components/InfiniteList";
import { TweetCard } from "@/components/tweets/TweetCard";
import { loadMoreTweets } from "@/actions/tweets";
import type { TweetView } from "@/lib/tweets";
import type { FeedFilter } from "@/lib/feed";

export function TweetFeed({
  initialItems,
  initialCursor,
  filter,
  tag,
  currentUserId,
  canModerate = false,
  emptyState,
}: {
  initialItems: TweetView[];
  initialCursor: string | null;
  filter: FeedFilter;
  tag?: string;
  currentUserId?: string;
  canModerate?: boolean;
  emptyState?: React.ReactNode;
}) {
  return (
    <InfiniteList<TweetView>
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={(cursor) => loadMoreTweets({ filter, tag, cursor })}
      renderItem={(tweet) => (
        <TweetCard
          tweet={tweet}
          currentUserId={currentUserId}
          canModerate={canModerate}
        />
      )}
      getKey={(tweet) => tweet.id}
      className="space-y-4"
      emptyState={emptyState}
    />
  );
}
