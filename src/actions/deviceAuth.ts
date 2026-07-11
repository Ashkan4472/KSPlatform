"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { approveCodeSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions";

export async function approveDeviceCodeAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = approveCodeSchema.safeParse({
    userCode: formData.get("userCode"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid code" };
  }

  const grant = await prisma.deviceGrant.findUnique({
    where: { userCode: parsed.data.userCode },
  });

  if (!grant || grant.status !== "PENDING") {
    return { error: "That code isn't valid. It may have expired or already been used." };
  }
  if (grant.expiresAt < new Date()) {
    await prisma.deviceGrant.update({
      where: { id: grant.id },
      data: { status: "EXPIRED" },
    });
    return { error: "That code has expired. Ask the extension for a new one." };
  }

  await prisma.deviceGrant.update({
    where: { id: grant.id },
    data: { status: "APPROVED", userId },
  });

  return { ok: true };
}

export type ExtensionConnectionRow = {
  id: string;
  label: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export async function listExtensionConnectionsAction(): Promise<
  ExtensionConnectionRow[]
> {
  const userId = await requireUserId();
  return prisma.extensionToken.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true, lastUsedAt: true },
  });
}

export async function revokeExtensionConnectionAction(
  tokenId: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const token = await prisma.extensionToken.findUnique({
    where: { id: tokenId },
    select: { userId: true },
  });
  if (!token || token.userId !== userId) {
    return { error: "Connection not found" };
  }
  await prisma.extensionToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/settings/connections");
  return {};
}
