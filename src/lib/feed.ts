import type { Prisma } from "@/generated/prisma/client";
import type { FeedPost } from "@/components/feed/PostCard";

export const FEED_PAGE_SIZE = 10;

export type FeedFilter = "all" | "subscribed";

export const postFeedInclude = {
  author: { select: { id: true, name: true, image: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostInclude;

type RawFeedPost = Prisma.PostGetPayload<{ include: typeof postFeedInclude }>;

export function postFeedWhere({
  tag,
  filter,
  userId,
}: {
  tag?: string;
  filter: FeedFilter;
  userId?: string;
}): Prisma.PostWhereInput {
  const and: Prisma.PostWhereInput[] = [{ status: "PUBLISHED" }];
  if (tag) and.push({ tags: { some: { tag: { slug: tag } } } });
  if (filter === "subscribed" && userId) {
    and.push({
      tags: { some: { tag: { subscriptions: { some: { userId } } } } },
    });
  }
  return { AND: and };
}

// Stable ordering for cursor pagination (publishedAt desc, then id desc).
export const postFeedOrderBy: Prisma.PostOrderByWithRelationInput[] = [
  { publishedAt: "desc" },
  { id: "desc" },
];

export function toFeedPost(p: RawFeedPost): FeedPost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    status: p.status,
    author: p.author,
    tags: p.tags.map((pt) => pt.tag),
    likeCount: p._count.likes,
    commentCount: p._count.comments,
  };
}
