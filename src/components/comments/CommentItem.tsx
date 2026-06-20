"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentForm } from "@/components/comments/CommentForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteCommentAction } from "@/actions/comments";
import { formatDate, initialsOf } from "@/lib/format";
import type { CommentAuthor, CommentNode } from "@/lib/comments";

function Row({
  id,
  body,
  createdAt,
  author,
  canDelete,
  children,
  footer,
}: {
  id: string;
  body: string;
  createdAt: Date;
  author: CommentAuthor;
  canDelete: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const router = useRouter();

  async function onConfirmDelete() {
    const res = await deleteCommentAction(id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        {author.image ? (
          <AvatarImage src={author.image} alt={author.name} />
        ) : null}
        <AvatarFallback className="text-xs">
          {initialsOf(author.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/u/${author.id}`} className="font-medium hover:underline">
            {author.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDate(createdAt)}
          </span>
          {canDelete && (
            <span className="ml-auto">
              <ConfirmDialog
                title="Delete comment?"
                description="This comment will be permanently removed."
                onConfirm={onConfirmDelete}
                trigger={
                  <button
                    type="button"
                    aria-label="Delete comment"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                }
              />
            </span>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm">{body}</p>
        {footer}
        {children}
      </div>
    </div>
  );
}

export function CommentItem({
  comment,
  postId,
  tweetId,
  currentUserId,
  canModerate = false,
}: {
  comment: CommentNode;
  postId?: string;
  tweetId?: string;
  currentUserId?: string;
  canModerate?: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const canDelete = (id: string) =>
    !!currentUserId && (id === currentUserId || canModerate);

  return (
    <Row
      id={comment.id}
      body={comment.body}
      createdAt={comment.createdAt}
      author={comment.author}
      canDelete={canDelete(comment.author.id)}
      footer={
        currentUserId ? (
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {replying ? "Cancel" : "Reply"}
          </button>
        ) : null
      }
    >
      {replying && (
        <div className="mt-3">
          <CommentForm
            postId={postId}
            tweetId={tweetId}
            parentId={comment.id}
            placeholder={`Reply to ${comment.author.name}…`}
            autoFocus
            onPosted={() => setReplying(false)}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-4 space-y-4 border-l pl-4">
          {comment.replies.map((reply) => (
            <Row
              key={reply.id}
              id={reply.id}
              body={reply.body}
              createdAt={reply.createdAt}
              author={reply.author}
              canDelete={canDelete(reply.author.id)}
            />
          ))}
        </div>
      )}
    </Row>
  );
}
