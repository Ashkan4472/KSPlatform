import type { Prisma } from "@/generated/prisma/client";
import type { FeedFilter } from "@/lib/feed";

export type TweetView = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  author: { id: string; name: string; image: string | null };
  tags: { name: string; slug: string }[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

const NONE = "__no_user__";

/** Include shape for a tweet card; `likes` is filtered to the viewer for likedByMe. */
export function tweetInclude(userId?: string) {
  return {
    author: { select: { id: true, name: true, image: true } },
    tags: { include: { tag: { select: { name: true, slug: true } } } },
    _count: { select: { likes: true, comments: true } },
    likes: {
      where: { userId: userId ?? NONE },
      select: { userId: true },
      take: 1,
    },
  } satisfies Prisma.TweetInclude;
}

type RawTweet = Prisma.TweetGetPayload<{ include: ReturnType<typeof tweetInclude> }>;

export function toTweetView(t: RawTweet): TweetView {
  return {
    id: t.id,
    body: t.body,
    imageUrl: t.imageUrl,
    createdAt: t.createdAt,
    author: t.author,
    tags: t.tags.map((tt) => tt.tag),
    likeCount: t._count.likes,
    commentCount: t._count.comments,
    likedByMe: t.likes.length > 0,
  };
}

export function tweetFeedWhere({
  tag,
  filter,
  userId,
}: {
  tag?: string;
  filter: FeedFilter;
  userId?: string;
}): Prisma.TweetWhereInput {
  const and: Prisma.TweetWhereInput[] = [];
  if (tag) and.push({ tags: { some: { tag: { slug: tag } } } });
  if (filter === "subscribed" && userId) {
    and.push({
      tags: { some: { tag: { subscriptions: { some: { userId } } } } },
    });
  }
  return and.length ? { AND: and } : {};
}
