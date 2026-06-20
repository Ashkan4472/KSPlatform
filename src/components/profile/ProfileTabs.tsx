"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfiniteList } from "@/components/InfiniteList";
import { PostCard, type FeedPost } from "@/components/feed/PostCard";
import { TweetCard } from "@/components/tweets/TweetCard";
import { loadUserPosts, loadUserTweets } from "@/actions/profileFeed";
import type { TweetView } from "@/lib/tweets";

export function ProfileTabs({
  userId,
  currentUserId,
  canModerate,
  initialPosts,
  postsCursor,
  postCount,
  initialTweets,
  tweetsCursor,
  tweetCount,
}: {
  userId: string;
  currentUserId?: string;
  canModerate: boolean;
  initialPosts: FeedPost[];
  postsCursor: string | null;
  postCount: number;
  initialTweets: TweetView[];
  tweetsCursor: string | null;
  tweetCount: number;
}) {
  const emptyPosts = (
    <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
      No posts yet.
    </div>
  );
  const emptyTweets = (
    <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
      No tweets yet.
    </div>
  );

  return (
    <Tabs defaultValue="posts" className="mt-8">
      <TabsList>
        <TabsTrigger value="posts">Posts · {postCount}</TabsTrigger>
        <TabsTrigger value="tweets">Tweets · {tweetCount}</TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-4">
        <InfiniteList<FeedPost>
          initialItems={initialPosts}
          initialCursor={postsCursor}
          loadMore={(cursor) => loadUserPosts({ userId, cursor })}
          renderItem={(post) => <PostCard post={post} />}
          getKey={(post) => post.id}
          className="space-y-4"
          emptyState={emptyPosts}
        />
      </TabsContent>

      <TabsContent value="tweets" className="mt-4">
        <InfiniteList<TweetView>
          initialItems={initialTweets}
          initialCursor={tweetsCursor}
          loadMore={(cursor) => loadUserTweets({ userId, cursor })}
          renderItem={(tweet) => (
            <TweetCard
              tweet={tweet}
              currentUserId={currentUserId}
              canModerate={canModerate}
            />
          )}
          getKey={(tweet) => tweet.id}
          className="space-y-4"
          emptyState={emptyTweets}
        />
      </TabsContent>
    </Tabs>
  );
}
