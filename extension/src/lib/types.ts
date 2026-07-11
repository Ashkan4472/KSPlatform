// Mirrors src/actions/timeline.ts's FeedItem / src/actions/*.ts's
// FeedPost/TweetView shapes, serialized as JSON over specs/004's
// GET /api/v1/feed contract. The extension is a separate build target
// (contracts/feed-api.md is the shared source of truth), so these types
// are declared here rather than imported across the build boundary.

export type FeedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  author: { id: string; name: string; image: string | null };
  tags: { name: string; slug: string }[];
  likeCount: number;
  commentCount: number;
};

export type TweetView = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
  tags: { name: string; slug: string }[];
  likeCount: number;
  commentCount: number;
};

export type FeedItem =
  | { kind: "post"; sortAt: string; post: FeedPost }
  | { kind: "tweet"; sortAt: string; tweet: TweetView };
