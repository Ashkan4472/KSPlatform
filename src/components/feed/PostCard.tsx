import Link from "next/link";
import { ViewTransition } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDate, initialsOf } from "@/lib/format";
import { tagColorVar } from "@/lib/tagColor";

export type FeedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  status: "DRAFT" | "PUBLISHED";
  author: { id: string; name: string; image: string | null };
  tags: { name: string; slug: string }[];
  likeCount: number;
  commentCount: number;
};

export function PostCard({ post }: { post: FeedPost }) {
  const spineColor = post.tags[0]
    ? tagColorVar(post.tags[0].slug)
    : "var(--border)";

  return (
    <Card
      className="border-l-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ borderLeftColor: spineColor }}
    >
      <CardHeader className="gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-6 w-6">
            {post.author.image ? (
              <AvatarImage src={post.author.image} alt={post.author.name} />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {initialsOf(post.author.name)}
            </AvatarFallback>
          </Avatar>
          <Link href={`/u/${post.author.id}`} className="hover:text-foreground">
            {post.author.name}
          </Link>
          <span>·</span>
          <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
          {post.status === "DRAFT" && (
            <Badge variant="outline" className="ml-1">
              Draft
            </Badge>
          )}
        </div>
        <Link href={`/posts/${post.slug}`}>
          <ViewTransition name={`post-title-${post.id}`}>
            <h2 className="font-heading text-lg font-semibold leading-snug text-balance transition-colors hover:text-primary">
              {post.title}
            </h2>
          </ViewTransition>
        </Link>
      </CardHeader>
      {post.excerpt && (
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        </CardContent>
      )}
      <CardFooter className="flex flex-wrap items-center gap-2">
        {post.tags.map((tag) => {
          const color = tagColorVar(tag.slug);
          return (
            <Link key={tag.slug} href={`/?tag=${tag.slug}`}>
              <Badge
                variant="outline"
                className="border-transparent font-mono transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{
                  backgroundColor: `color-mix(in oklch, ${color} 16%, var(--card))`,
                  color,
                }}
              >
                #{tag.name}
              </Badge>
            </Link>
          );
        })}
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> {post.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {post.commentCount}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
