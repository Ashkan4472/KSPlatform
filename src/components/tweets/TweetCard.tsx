"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate, initialsOf } from "@/lib/format";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toggleTweetLikeAction, deleteTweetAction } from "@/actions/tweets";
import { tagColorVar } from "@/lib/tagColor";
import type { TweetView } from "@/lib/tweets";

export function TweetCard({
  tweet,
  currentUserId,
  canModerate = false,
}: {
  tweet: TweetView;
  currentUserId?: string;
  canModerate?: boolean;
}) {
  const [liked, setLiked] = useState(tweet.likedByMe);
  const [likes, setLikes] = useState(tweet.likeCount);
  const [deleted, setDeleted] = useState(false);
  const [pending, startTransition] = useTransition();

  const canDelete =
    !!currentUserId && (tweet.author.id === currentUserId || canModerate);

  function onLike() {
    if (!currentUserId) {
      toast.error("Log in to like");
      return;
    }
    startTransition(async () => {
      const res = await toggleTweetLikeAction(tweet.id);
      setLiked(res.active);
      setLikes(res.count);
    });
  }

  async function onConfirmDelete() {
    const res = await deleteTweetAction(tweet.id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setDeleted(true);
  }

  if (deleted) return null;

  const spineColor = tweet.tags[0]
    ? tagColorVar(tweet.tags[0].slug)
    : "var(--border)";

  return (
    <Card
      className="border-l-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ borderLeftColor: spineColor }}
    >
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-7 w-7">
            {tweet.author.image ? (
              <AvatarImage src={tweet.author.image} alt={tweet.author.name} />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {initialsOf(tweet.author.name)}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/u/${tweet.author.id}`}
            className="font-medium text-foreground hover:underline"
          >
            {tweet.author.name}
          </Link>
          <span>·</span>
          <Link href={`/tweets/${tweet.id}`} className="hover:underline">
            {formatDate(tweet.createdAt)}
          </Link>
          {canDelete && (
            <span className="ml-auto">
              <ConfirmDialog
                title="Delete tweet?"
                description="This tweet will be permanently removed."
                onConfirm={onConfirmDelete}
                trigger={
                  <button
                    type="button"
                    aria-label="Delete tweet"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                }
              />
            </span>
          )}
        </div>

        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {tweet.body}
        </p>

        {tweet.imageUrl && (
          <Link href={`/tweets/${tweet.id}`} className="block">
            <Image
              src={tweet.imageUrl}
              alt=""
              width={800}
              height={450}
              className="max-h-96 w-full rounded-md border object-cover"
            />
          </Link>
        )}

        {tweet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tweet.tags.map((t) => {
              const color = tagColorVar(t.slug);
              return (
                <Link key={t.slug} href={`/tweets?tag=${t.slug}`}>
                  <Badge
                    variant="outline"
                    className="border-transparent font-mono transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${color} 16%, var(--card))`,
                      color,
                    }}
                  >
                    #{t.name}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={onLike}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-1 hover:text-foreground",
              liked && "text-red-600",
            )}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} /> {likes}
          </button>
          <Link
            href={`/tweets/${tweet.id}`}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" /> {tweet.commentCount}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
