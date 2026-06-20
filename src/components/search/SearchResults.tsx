"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfiniteList } from "@/components/InfiniteList";
import { PostCard, type FeedPost } from "@/components/feed/PostCard";
import { TweetCard } from "@/components/tweets/TweetCard";
import { searchPosts, searchTweets } from "@/actions/search";
import type { TweetView } from "@/lib/tweets";

export function SearchResults({
  q,
  defaultTab,
  initialPosts,
  postsCursor,
  initialTweets,
  tweetsCursor,
  currentUserId,
  canModerate,
}: {
  q: string;
  defaultTab: "posts" | "tweets";
  initialPosts: FeedPost[];
  postsCursor: string | null;
  initialTweets: TweetView[];
  tweetsCursor: string | null;
  currentUserId?: string;
  canModerate: boolean;
}) {
  const empty = (label: string) => (
    <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
      No {label} match “{q}”.
    </div>
  );

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="tweets">Tweets</TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-4">
        <InfiniteList<FeedPost>
          initialItems={initialPosts}
          initialCursor={postsCursor}
          loadMore={(cursor) => searchPosts({ q, cursor })}
          renderItem={(post) => <PostCard post={post} />}
          getKey={(post) => post.id}
          className="space-y-4"
          emptyState={empty("posts")}
        />
      </TabsContent>

      <TabsContent value="tweets" className="mt-4">
        <InfiniteList<TweetView>
          initialItems={initialTweets}
          initialCursor={tweetsCursor}
          loadMore={(cursor) => searchTweets({ q, cursor })}
          renderItem={(tweet) => (
            <TweetCard
              tweet={tweet}
              currentUserId={currentUserId}
              canModerate={canModerate}
            />
          )}
          getKey={(tweet) => tweet.id}
          className="space-y-4"
          emptyState={empty("tweets")}
        />
      </TabsContent>
    </Tabs>
  );
}
