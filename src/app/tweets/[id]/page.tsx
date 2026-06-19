import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TweetCard } from "@/components/tweets/TweetCard";
import { tweetInclude, toTweetView } from "@/lib/tweets";
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

  const row = await prisma.tweet.findUnique({
    where: { id },
    include: tweetInclude(user?.id),
  });
  if (!row) notFound();

  const tweet = toTweetView(row);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <TweetCard tweet={tweet} currentUserId={user?.id} />
    </div>
  );
}
