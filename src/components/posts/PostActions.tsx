"use client";

import { useState, useTransition } from "react";
import { Bookmark, Download, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleLikeAction, toggleBookmarkAction } from "@/actions/reactions";
import { deletePostAction } from "@/actions/posts";

type Props = {
  postId: string;
  slug: string;
  title: string;
  contentMd: string;
  initialLikes: number;
  initialBookmarks: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  canModerate?: boolean;
};

export function PostActions({
  postId,
  slug,
  title,
  contentMd,
  initialLikes,
  initialBookmarks,
  likedByMe,
  bookmarkedByMe,
  canModerate = false,
}: Props) {
  const [liked, setLiked] = useState(likedByMe);
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarked, setBookmarked] = useState(bookmarkedByMe);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [pending, startTransition] = useTransition();

  function onLike() {
    startTransition(async () => {
      const res = await toggleLikeAction(postId);
      setLiked(res.active);
      setLikes(res.count);
    });
  }

  function onBookmark() {
    startTransition(async () => {
      const res = await toggleBookmarkAction(postId);
      setBookmarked(res.active);
      setBookmarks(res.count);
    });
  }

  function onDownload() {
    const doc = `# ${title}\n\n${contentMd}\n`;
    const blob = new Blob([doc], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Markdown downloaded");
  }

  function onModerate() {
    if (!window.confirm("Delete this post as an admin?")) return;
    startTransition(async () => {
      const res = await deletePostAction(postId);
      if (res?.error) toast.error(res.error);
      // On success the action redirects away.
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onLike}
        disabled={pending}
        className={cn(liked && "border-red-300 text-red-600")}
      >
        <Heart className={cn("mr-1.5 h-4 w-4", liked && "fill-current")} />
        {likes}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onBookmark}
        disabled={pending}
        className={cn(bookmarked && "border-blue-300 text-blue-600")}
      >
        <Bookmark
          className={cn("mr-1.5 h-4 w-4", bookmarked && "fill-current")}
        />
        {bookmarks}
      </Button>
      <Button variant="outline" size="sm" onClick={onDownload}>
        <Download className="mr-1.5 h-4 w-4" /> Export .md
      </Button>
      {canModerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onModerate}
          disabled={pending}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-4 w-4" /> Delete
        </Button>
      )}
    </div>
  );
}
