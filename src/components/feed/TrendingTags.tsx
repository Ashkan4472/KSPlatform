import Link from "next/link";
import { Hash, Heart, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tagColorVar } from "@/lib/tagColor";

type TagStat = { id: string; name: string; slug: string; n: number };

// Plain async helpers (not components) so reading the clock is allowed.
async function loadTagTrends() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Most liked: likes received this week across a tag's posts + tweets.
  const mostLiked = prisma.$queryRaw<TagStat[]>`
    SELECT t.id, t.name, t.slug, COUNT(*)::int AS n
    FROM "Tag" t
    JOIN (
      SELECT pt."tagId" AS tag_id
      FROM "Like" l JOIN "PostTag" pt ON pt."postId" = l."postId"
      WHERE l."createdAt" >= ${since}
      UNION ALL
      SELECT tt."tagId"
      FROM "TweetLike" tl JOIN "TweetTag" tt ON tt."tweetId" = tl."tweetId"
      WHERE tl."createdAt" >= ${since}
    ) x ON x.tag_id = t.id
    GROUP BY t.id
    ORDER BY n DESC, t.name ASC
    LIMIT 5`;

  // Most used: posts/tweets carrying the tag, created this week.
  const mostUsed = prisma.$queryRaw<TagStat[]>`
    SELECT t.id, t.name, t.slug, COUNT(*)::int AS n
    FROM "Tag" t
    JOIN (
      SELECT pt."tagId" AS tag_id
      FROM "PostTag" pt JOIN "Post" p ON p.id = pt."postId"
      WHERE p.status = 'PUBLISHED' AND p."publishedAt" >= ${since}
      UNION ALL
      SELECT tt."tagId"
      FROM "TweetTag" tt JOIN "Tweet" tw ON tw.id = tt."tweetId"
      WHERE tw."createdAt" >= ${since}
    ) x ON x.tag_id = t.id
    GROUP BY t.id
    ORDER BY n DESC, t.name ASC
    LIMIT 5`;

  return Promise.all([mostLiked, mostUsed]);
}

function TagList({ tags }: { tags: TagStat[] }) {
  return (
    <div className="space-y-1.5">
      {tags.map((t) => {
        const color = tagColorVar(t.slug);
        return (
          <Link
            key={t.id}
            href={`/?tag=${t.slug}`}
            className="flex items-center justify-between rounded-md px-1.5 py-1 text-sm transition-colors duration-150 hover:bg-accent"
            style={{ color }}
          >
            <span className="inline-flex items-center gap-1 font-mono font-medium">
              <Hash className="h-3.5 w-3.5" />
              {t.name}
            </span>
            <span className="text-xs text-muted-foreground">{t.n}</span>
          </Link>
        );
      })}
    </div>
  );
}

export async function TrendingTags() {
  const [mostLiked, mostUsed] = await loadTagTrends();
  if (mostLiked.length === 0 && mostUsed.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trending tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mostLiked.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Heart className="h-3.5 w-3.5" /> Most liked this week
            </p>
            <TagList tags={mostLiked} />
          </div>
        )}
        {mostUsed.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> Most used this week
            </p>
            <TagList tags={mostUsed} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
