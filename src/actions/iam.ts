"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  listEffectivePermissions,
  type EffectivePermission,
} from "@/lib/session";
import { grantablePermissionSchema } from "@/lib/validation";
import type { Permission } from "@/lib/permissions";
import type { ActionResult } from "@/lib/actions";

export async function grantPermissionAction(
  userId: string,
  permission: Permission,
): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const parsed = grantablePermissionSchema.safeParse(permission);
  if (!parsed.success) return { error: "That permission can't be granted directly" };

  await prisma.userPermission.upsert({
    where: { userId_permission: { userId, permission: parsed.data } },
    update: {},
    create: { userId, permission: parsed.data, grantedById: adminId },
  });

  revalidatePath("/admin/permissions");
  return {};
}

export async function revokePermissionAction(
  userId: string,
  permission: Permission,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = grantablePermissionSchema.safeParse(permission);
  if (!parsed.success) return { error: "That permission can't be revoked directly" };

  await prisma.userPermission.deleteMany({
    where: { userId, permission: parsed.data },
  });

  revalidatePath("/admin/permissions");
  return {};
}

export type IamUserRow = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export async function searchUsersForIamAction(
  query: string,
): Promise<IamUserRow[]> {
  await requireAdmin();
  const q = query.trim().slice(0, 100);
  if (!q) return [];

  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, role: true },
    take: 8,
  });
}

export async function getUserPermissionsAction(
  userId: string,
): Promise<EffectivePermission[]> {
  await requireAdmin();
  return listEffectivePermissions(userId);
}
