import { prisma } from "@/lib/prisma";
import { PeopleFeed } from "@/components/people/PeopleFeed";
import { usersSelect, toUserSummary } from "@/actions/feed";
import { FEED_PAGE_SIZE } from "@/lib/feed";

export const metadata = { title: "People — KSPlatform" };

export default async function PeoplePage() {
  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    select: usersSelect,
  });

  const initial = users.map(toUserSummary);
  const initialCursor =
    users.length === FEED_PAGE_SIZE ? users[users.length - 1].id : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">People</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Discover everyone sharing knowledge on the platform.
      </p>
      <PeopleFeed initialItems={initial} initialCursor={initialCursor} />
    </div>
  );
}
