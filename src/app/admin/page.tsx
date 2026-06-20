import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { formatDate, truncate } from "@/lib/format";

export const metadata = { title: "Admin — KSPlatform" };

export default async function AdminPage() {
  const adminId = await requireAdmin();

  const [users, posts, tweets] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { posts: true, tweets: true, comments: true } },
      },
    }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        author: { select: { name: true } },
      },
    }),
    prisma.tweet.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        body: true,
        author: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Moderate users and content. Roles can also be changed directly in the
        database.
      </p>

      <section>
        <h2 className="mb-3 text-lg font-medium">Users ({users.length})</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/u/${u.id}`} className="font-medium hover:underline">
                    {u.name}
                  </Link>
                  {u.role === "ADMIN" && <Badge variant="outline">Admin</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email} · {u._count.posts}p / {u._count.tweets}t /{" "}
                  {u._count.comments}c · joined {formatDate(u.createdAt)}
                </p>
              </div>
              {u.id !== adminId && (
                <AdminDeleteButton kind="user" id={u.id} name={u.name} />
              )}
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="mb-3 text-lg font-medium">Recent posts</h2>
        <div className="space-y-2">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/posts/${p.slug}`}
                  className="font-medium hover:underline"
                >
                  {p.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  by {p.author.name}
                  {p.status === "DRAFT" ? " · draft" : ""}
                </p>
              </div>
              <AdminDeleteButton kind="post" id={p.id} name={p.title} />
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="mb-3 text-lg font-medium">Recent tweets</h2>
        <div className="space-y-2">
          {tweets.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <Link href={`/tweets/${t.id}`} className="hover:underline">
                  {truncate(t.body, 80)}
                </Link>
                <p className="text-xs text-muted-foreground">
                  by {t.author.name}
                </p>
              </div>
              <AdminDeleteButton kind="tweet" id={t.id} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
