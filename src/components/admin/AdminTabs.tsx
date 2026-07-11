"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfiniteList } from "@/components/InfiniteList";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { canModerate } from "@/lib/roles";
import { formatDate, truncate } from "@/lib/format";
import {
  adminListUsers,
  adminListPosts,
  adminListTweets,
  adminDeleteUser,
  adminDeletePost,
  adminDeleteTweet,
  type AdminUserRow,
  type AdminPostRow,
  type AdminTweetRow,
} from "@/actions/admin";

type Kind = "user" | "post" | "tweet";

function AdminRow({
  kind,
  id,
  name,
  canDelete,
  children,
}: {
  kind: Kind;
  id: string;
  name?: string;
  canDelete: boolean;
  children: React.ReactNode;
}) {
  const [removed, setRemoved] = useState(false);
  if (removed) return null;

  async function onConfirm() {
    const res =
      kind === "user"
        ? await adminDeleteUser(id)
        : kind === "post"
          ? await adminDeletePost(id)
          : await adminDeleteTweet(id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Deleted ${kind}`);
    setRemoved(true);
  }

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">{children}</div>
      {canDelete && (
        <ConfirmDialog
          title={`Delete ${kind}?`}
          description={
            kind === "user"
              ? `"${name}" and all their content will be permanently removed.`
              : `This ${kind} will be permanently removed.`
          }
          onConfirm={onConfirm}
          trigger={
            <Button variant="ghost" size="icon" aria-label={`Delete ${kind}`}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
        />
      )}
    </div>
  );
}

export function AdminTabs({
  adminId,
  userCount,
  postCount,
  tweetCount,
  initialUsers,
  usersCursor,
  initialPosts,
  postsCursor,
  initialTweets,
  tweetsCursor,
}: {
  adminId: string;
  userCount: number;
  postCount: number;
  tweetCount: number;
  initialUsers: AdminUserRow[];
  usersCursor: string | null;
  initialPosts: AdminPostRow[];
  postsCursor: string | null;
  initialTweets: AdminTweetRow[];
  tweetsCursor: string | null;
}) {
  return (
    <Tabs defaultValue="users" className="mt-6">
      <TabsList>
        <TabsTrigger value="users">Users · {userCount}</TabsTrigger>
        <TabsTrigger value="posts">Posts · {postCount}</TabsTrigger>
        <TabsTrigger value="tweets">Tweets · {tweetCount}</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-4">
        <InfiniteList<AdminUserRow>
          initialItems={initialUsers}
          initialCursor={usersCursor}
          loadMore={(cursor) => adminListUsers({ cursor })}
          getKey={(u) => u.id}
          className="space-y-2"
          renderItem={(u) => (
            <AdminRow
              kind="user"
              id={u.id}
              name={u.name}
              canDelete={u.id !== adminId}
            >
              <div className="flex items-center gap-2">
                <Link href={`/u/${u.id}`} className="font-medium hover:underline">
                  {u.name}
                </Link>
                {canModerate({ role: u.role }) && <Badge variant="outline">Admin</Badge>}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {u.email} · {u.postCount}p / {u.tweetCount}t / {u.commentCount}c
                · joined {formatDate(u.createdAt)}
              </p>
            </AdminRow>
          )}
        />
      </TabsContent>

      <TabsContent value="posts" className="mt-4">
        <InfiniteList<AdminPostRow>
          initialItems={initialPosts}
          initialCursor={postsCursor}
          loadMore={(cursor) => adminListPosts({ cursor })}
          getKey={(p) => p.id}
          className="space-y-2"
          renderItem={(p) => (
            <AdminRow kind="post" id={p.id} name={p.title} canDelete>
              <Link
                href={`/posts/${p.slug}`}
                className="font-medium hover:underline"
              >
                {p.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                by {p.authorName}
                {p.status === "DRAFT" ? " · draft" : ""}
              </p>
            </AdminRow>
          )}
        />
      </TabsContent>

      <TabsContent value="tweets" className="mt-4">
        <InfiniteList<AdminTweetRow>
          initialItems={initialTweets}
          initialCursor={tweetsCursor}
          loadMore={(cursor) => adminListTweets({ cursor })}
          getKey={(t) => t.id}
          className="space-y-2"
          renderItem={(t) => (
            <AdminRow kind="tweet" id={t.id} canDelete>
              <Link href={`/tweets/${t.id}`} className="hover:underline">
                {truncate(t.body, 80)}
              </Link>
              <p className="text-xs text-muted-foreground">by {t.authorName}</p>
            </AdminRow>
          )}
        />
      </TabsContent>
    </Tabs>
  );
}
