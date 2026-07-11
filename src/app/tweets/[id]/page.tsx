import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canModerate as isModerator } from "@/lib/session";
import { TweetCard } from "@/components/tweets/TweetCard";
import { CommentSection } from "@/components/comments/CommentSection";
import { tweetInclude, toTweetView } from "@/lib/tweets";
import { commentThreadInclude } from "@/lib/comments";
import { truncate } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tweet = await prisma.tweet.findUnique({
    where: { id },
    select: { body: true },
  });
  return {
    title: tweet ? `${truncate(tweet.body, 50)} — KSPlatform` : "Tweet",
  };
}

export default async function TweetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [row, comments] = await Promise.all([
    prisma.tweet.findUnique({
      where: { id },
      include: tweetInclude(user?.id),
    }),
    prisma.comment.findMany({
      where: { tweetId: id, parentId: null },
      orderBy: { createdAt: "desc" },
      include: commentThreadInclude,
    }),
  ]);
  if (!row) notFound();

  const tweet = toTweetView(row);

  const canModerate = isModerator(user);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <TweetCard
        tweet={tweet}
        currentUserId={user?.id}
        canModerate={canModerate}
      />
      <CommentSection
        tweetId={tweet.id}
        comments={comments}
        currentUserId={user?.id}
        canModerate={canModerate}
      />
    </div>
  );
}
