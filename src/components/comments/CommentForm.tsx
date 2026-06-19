"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addCommentAction } from "@/actions/comments";

export function CommentForm({
  postId,
  tweetId,
  parentId,
  placeholder = "Add a comment…",
  autoFocus = false,
  onPosted,
}: {
  postId?: string;
  tweetId?: string;
  parentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onPosted?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length === 0) return;
    startTransition(async () => {
      const res = await addCommentAction({
        postId,
        tweetId,
        parentId,
        body: body.trim(),
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setBody("");
      onPosted?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        maxLength={2000}
        autoFocus={autoFocus}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          {pending ? "Posting…" : parentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
