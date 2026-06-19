"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function toggleSubscriptionAction(
  tagId: string,
): Promise<{ subscribed: boolean }> {
  const userId = await requireUserId();
  const existing = await prisma.subscription.findUnique({
    where: { userId_tagId: { userId, tagId } },
  });

  if (existing) {
    await prisma.subscription.delete({
      where: { userId_tagId: { userId, tagId } },
    });
  } else {
    await prisma.subscription.create({ data: { userId, tagId } });
  }

  revalidatePath("/");
  revalidatePath("/settings");
  return { subscribed: !existing };
}
