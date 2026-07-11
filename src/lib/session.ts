import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canModerate } from "@/lib/roles";
import { PERMISSIONS, DEFAULT_USER_PERMISSIONS, type Permission } from "@/lib/permissions";

export { canModerate };

/** Returns the current session user or null. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Returns the current user id, or redirects to /login if unauthenticated. */
export async function requireUserId(redirectTo?: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    const target = redirectTo
      ? `/login?callbackUrl=${encodeURIComponent(redirectTo)}`
      : "/login";
    redirect(target);
  }
  return session.user.id;
}

/** True if the current session user is an admin. */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return canModerate(session?.user);
}

/** Returns the current admin user id, or redirects away if not an admin. */
export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (!canModerate(session.user)) redirect("/");
  return session.user.id;
}

/**
 * specs/006: like requireAdmin(), but for a specific permission instead of
 * the blanket ADMIN role — lets a user delegated e.g. "user:all:delete"
 * reach an admin surface without being a full admin.
 */
export async function requirePermission(permission: Permission): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (!(await hasPermission(session.user, permission))) redirect("/");
  return session.user.id;
}

/**
 * specs/006: true if the user can perform a specific, cataloged action.
 * ADMIN implicitly holds every permission; every signed-in user implicitly
 * holds the "self"-scoped baseline (DEFAULT_USER_PERMISSIONS, mirroring
 * existing ownership-based capabilities); otherwise checks for an
 * explicit grant.
 */
export async function hasPermission(
  user: { id: string; role: "USER" | "ADMIN" } | null | undefined,
  permission: Permission,
): Promise<boolean> {
  if (!user) return false;
  if (canModerate(user)) return true;
  if (DEFAULT_USER_PERMISSIONS.includes(permission)) return true;
  const grant = await prisma.userPermission.findUnique({
    where: { userId_permission: { userId: user.id, permission } },
  });
  return !!grant;
}

export type EffectivePermission = {
  permission: Permission;
  source: "role" | "grant";
  grantedBy?: { name: string };
  grantedAt?: Date;
};

/** specs/006: every permission a user effectively holds, with its source. */
export async function listEffectivePermissions(
  userId: string,
): Promise<EffectivePermission[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return [];

  if (canModerate(user)) {
    return PERMISSIONS.map((permission) => ({
      permission,
      source: "role" as const,
    }));
  }

  const baseline: EffectivePermission[] = DEFAULT_USER_PERMISSIONS.map(
    (permission) => ({ permission, source: "role" as const }),
  );

  const grants = await prisma.userPermission.findMany({
    where: { userId },
    include: { grantedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const granted: EffectivePermission[] = grants.map((g) => ({
    permission: g.permission as Permission,
    source: "grant" as const,
    grantedBy: { name: g.grantedBy.name },
    grantedAt: g.createdAt,
  }));

  return [...baseline, ...granted];
}
