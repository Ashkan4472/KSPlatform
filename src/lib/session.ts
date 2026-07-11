import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canModerate } from "@/lib/roles";

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
