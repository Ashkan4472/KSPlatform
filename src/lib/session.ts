import { redirect } from "next/navigation";
import { auth } from "@/auth";

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
