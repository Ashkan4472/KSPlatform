"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { deleteCommentAction } from "@/actions/comments";
import { formatDate, initialsOf } from "@/lib/format";

type Props = {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string; image: string | null };
  canDelete: boolean;
};

export function CommentItem({ id, body, createdAt, author, canDelete }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm("Delete this comment?")) return;
    startTransition(async () => {
      const res = await deleteCommentAction(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
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
          <Link
            href={`/u/${author.id}`}
            className="font-medium hover:underline"
          >
            {author.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDate(createdAt)}
          </span>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              aria-label="Delete comment"
              className="ml-auto text-muted-foreground hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm">{body}</p>
      </div>
    </div>
  );
}
