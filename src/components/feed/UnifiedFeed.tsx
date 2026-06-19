"use client";

import { InfiniteList } from "@/components/InfiniteList";
import { PostCard } from "@/components/feed/PostCard";
import { TweetCard } from "@/components/tweets/TweetCard";
import { loadTimeline, type FeedItem } from "@/actions/timeline";
import type { FeedFilter } from "@/lib/feed";

export function UnifiedFeed({
  initialItems,
  initialCursor,
  filter,
  tag,
  currentUserId,
  canModerate = false,
  emptyState,
}: {
  initialItems: FeedItem[];
  initialCursor: string | null;
  filter: FeedFilter;
  tag?: string;
  currentUserId?: string;
  canModerate?: boolean;
  emptyState?: React.ReactNode;
}) {
  return (
    <InfiniteList<FeedItem>
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={(cursor) => loadTimeline({ filter, tag, cursor })}
      renderItem={(item) =>
        item.kind === "post" ? (
          <PostCard post={item.post} />
        ) : (
          <TweetCard
            tweet={item.tweet}
            currentUserId={currentUserId}
            canModerate={canModerate}
          />
        )
      }
      getKey={(item) =>
        item.kind === "post" ? `post:${item.post.id}` : `tweet:${item.tweet.id}`
      }
      className="space-y-4"
      emptyState={emptyState}
    />
  );
}
