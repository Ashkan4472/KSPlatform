import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getCurrentUser, hasPermission, canModerate } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import {
  adminListUsers,
  adminListPosts,
  adminListTweets,
} from "@/actions/admin";

export const metadata = { title: "Admin — KSPlatform" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");

  const [canUsers, canPosts, canTweets] = await Promise.all([
    hasPermission(user, "user:all:delete"),
    hasPermission(user, "post:all:delete"),
    hasPermission(user, "tweet:all:delete"),
  ]);
  if (!canUsers && !canPosts && !canTweets) redirect("/");

  const [userCount, postCount, tweetCount, users, posts, tweets] =
    await Promise.all([
      canUsers ? prisma.user.count() : 0,
      canPosts ? prisma.post.count() : 0,
      canTweets ? prisma.tweet.count() : 0,
      canUsers ? adminListUsers({ cursor: null }) : null,
      canPosts ? adminListPosts({ cursor: null }) : null,
      canTweets ? adminListTweets({ cursor: null }) : null,
    ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="mb-2 text-sm text-muted-foreground">
            Browse and moderate content you have permission for. Roles can
            also be changed directly in the database.
          </p>
        </div>
        {canModerate(user) && (
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/permissions">
              <Shield className="mr-2 h-4 w-4" /> Permissions
            </Link>
          </Button>
        )}
      </div>

      <AdminTabs
        viewerId={user.id}
        canUsers={canUsers}
        canPosts={canPosts}
        canTweets={canTweets}
        userCount={userCount}
        postCount={postCount}
        tweetCount={tweetCount}
        initialUsers={users?.items ?? []}
        usersCursor={users?.nextCursor ?? null}
        initialPosts={posts?.items ?? []}
        postsCursor={posts?.nextCursor ?? null}
        initialTweets={tweets?.items ?? []}
        tweetsCursor={tweets?.nextCursor ?? null}
      />
    </div>
  );
}
