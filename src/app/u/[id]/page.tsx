import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canModerate } from "@/lib/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { loadUserPosts, loadUserTweets } from "@/actions/profileFeed";
import { initialsOf } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: user ? `${user.name} — KSPlatform` : "Profile — KSPlatform" };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const isOwner = viewer?.id === id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, bio: true, image: true, role: true },
  });

  if (!user) notFound();

  const [postCount, tweetCount, posts, tweets] = await Promise.all([
    prisma.post.count({
      where: { authorId: id, ...(isOwner ? {} : { status: "PUBLISHED" }) },
    }),
    prisma.tweet.count({ where: { authorId: id } }),
    loadUserPosts({ userId: id, cursor: null }),
    loadUserTweets({ userId: id, cursor: null }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
          <AvatarFallback className="text-lg">
            {initialsOf(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{user.name}</h1>
            {canModerate(user) && <Badge variant="outline">Admin</Badge>}
          </div>
          {user.bio && (
            <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>
          )}
        </div>
      </header>

      <ProfileTabs
        userId={user.id}
        currentUserId={viewer?.id}
        canModerate={canModerate(viewer)}
        initialPosts={posts.items}
        postsCursor={posts.nextCursor}
        postCount={postCount}
        initialTweets={tweets.items}
        tweetsCursor={tweets.nextCursor}
        tweetCount={tweetCount}
      />
    </div>
  );
}
