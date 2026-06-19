"use server";

import { prisma } from "@/lib/prisma";
import { FEED_PAGE_SIZE } from "@/lib/feed";
import { usersSelect, toUserSummary, type UserPage } from "@/lib/users";

/** Cursor-paginated users directory. `cursor` is the last user id of the prior page. */
export async function loadMoreUsers({
  cursor,
}: {
  cursor: string;
}): Promise<UserPage> {
  const rows = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE,
    skip: 1,
    cursor: { id: cursor },
    select: usersSelect,
  });
  return {
    items: rows.map(toUserSummary),
    nextCursor:
      rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1].id : null,
  };
}
