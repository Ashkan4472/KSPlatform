"use client";

import { InfiniteList } from "@/components/InfiniteList";
import { UserCard } from "@/components/people/UserCard";
import { loadMoreUsers, type UserSummary } from "@/actions/feed";

export function PeopleFeed({
  initialItems,
  initialCursor,
}: {
  initialItems: UserSummary[];
  initialCursor: string | null;
}) {
  return (
    <InfiniteList<UserSummary>
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={(cursor) => loadMoreUsers({ cursor })}
      renderItem={(user) => <UserCard user={user} />}
      getKey={(user) => user.id}
      className="space-y-3"
    />
  );
}
