import Link from "next/link";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentItem } from "@/components/comments/CommentItem";
import type { CommentNode } from "@/lib/comments";

export function CommentSection({
  postId,
  tweetId,
  comments,
  currentUserId,
  canModerate = false,
}: {
  postId?: string;
  tweetId?: string;
  comments: CommentNode[];
  currentUserId?: string;
  canModerate?: boolean;
}) {
  const count = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-semibold">
        {count} comment{count === 1 ? "" : "s"}
      </h2>

      {currentUserId ? (
        <CommentForm postId={postId} tweetId={tweetId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          to join the discussion.
        </p>
      )}

      <div className="mt-6 space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            tweetId={tweetId}
            currentUserId={currentUserId}
            canModerate={canModerate}
          />
        ))}
      </div>
    </section>
  );
}
