"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validation";
import { signOut } from "@/auth";
import type { ActionResult } from "@/lib/actions";

export async function changePasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Account not found" };

  const valid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!valid) return { error: "Current password is incorrect" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { ok: true };
}

export async function toggleNotificationsAction(
  enabled: boolean,
): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { notificationsEnabled: enabled },
  });
  revalidatePath("/settings");
  return {};
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const userId = await requireUserId();
  // Cascades remove the user's posts, tweets, comments, likes, bookmarks,
  // subscriptions, device grants, extension tokens, and permission grants.
  await prisma.user.delete({ where: { id: userId } });
  await signOut({ redirect: false });
  redirect("/");
}
