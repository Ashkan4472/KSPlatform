"use client";

import { InfiniteList } from "@/components/InfiniteList";
import { PostCard, type FeedPost } from "@/components/feed/PostCard";
import { loadMorePosts } from "@/actions/feed";
import type { FeedFilter } from "@/lib/feed";

export function PostFeed({
  initialItems,
  initialCursor,
  filter,
  tag,
  emptyState,
}: {
  initialItems: FeedPost[];
  initialCursor: string | null;
  filter: FeedFilter;
  tag?: string;
  emptyState?: React.ReactNode;
}) {
  return (
    <InfiniteList<FeedPost>
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={(cursor) => loadMorePosts({ filter, tag, cursor })}
      renderItem={(post) => <PostCard post={post} />}
      getKey={(post) => post.id}
      className="space-y-4"
      emptyState={emptyState}
    />
  );
}
