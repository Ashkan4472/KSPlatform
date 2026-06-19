import Link from "next/link";
import { Heart, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDate, initialsOf } from "@/lib/format";

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
  return (
    <Card className="transition-colors hover:border-foreground/20">
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
          <h2 className="text-lg font-semibold leading-snug hover:underline">
            {post.title}
          </h2>
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
        {post.tags.map((tag) => (
          <Link key={tag.slug} href={`/?tag=${tag.slug}`}>
            <Badge variant="secondary" className="hover:bg-accent">
              #{tag.name}
            </Badge>
          </Link>
        ))}
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
