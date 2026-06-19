import Link from "next/link";
import { Flame, Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Most-liked posts published in the last 7 days. */
export async function TrendingPosts() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since } },
    orderBy: [{ likes: { _count: "desc" } }, { publishedAt: "desc" }],
    take: 5,
    select: {
      slug: true,
      title: true,
      _count: { select: { likes: true } },
    },
  });

  // Only worth showing if at least one has traction.
  const ranked = posts.filter((p) => p._count.likes > 0);
  if (ranked.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-orange-500" /> Most liked this week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ranked.map((post, i) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="flex items-start gap-3 text-sm hover:text-foreground"
          >
            <span className="font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <span className="flex-1">
              <span className="line-clamp-2 font-medium leading-snug">
                {post.title}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Heart className="h-3 w-3" /> {post._count.likes}
              </span>
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
