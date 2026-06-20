import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminTabs } from "@/components/admin/AdminTabs";
import {
  adminListUsers,
  adminListPosts,
  adminListTweets,
} from "@/actions/admin";

export const metadata = { title: "Admin — KSPlatform" };

export default async function AdminPage() {
  const adminId = await requireAdmin();

  const [userCount, postCount, tweetCount, users, posts, tweets] =
    await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.tweet.count(),
      adminListUsers({ cursor: null }),
      adminListPosts({ cursor: null }),
      adminListTweets({ cursor: null }),
    ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        Browse and moderate all users and content. Roles can also be changed
        directly in the database.
      </p>

      <AdminTabs
        adminId={adminId}
        userCount={userCount}
        postCount={postCount}
        tweetCount={tweetCount}
        initialUsers={users.items}
        usersCursor={users.nextCursor}
        initialPosts={posts.items}
        postsCursor={posts.nextCursor}
        initialTweets={tweets.items}
        tweetsCursor={tweets.nextCursor}
      />
    </div>
  );
}
