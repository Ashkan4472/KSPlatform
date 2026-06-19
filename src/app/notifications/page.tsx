import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";

export const metadata = { title: "Notifications — KSPlatform" };

export default async function NotificationsPage() {
  const userId = await requireUserId("/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      tag: { select: { name: true } },
      post: { select: { title: true, slug: true } },
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <MarkAllReadButton disabled={unreadCount === 0} />
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No notifications yet. Subscribe to tags to hear about new posts.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              read={n.read}
              createdAt={n.createdAt}
              tagName={n.tag.name}
              postTitle={n.post.title}
              postSlug={n.post.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
