/**
 * Framework/server-agnostic: no imports. Safe to use from client
 * components (unlike session.ts, which pulls in @/auth's Node-only
 * deps via NextAuth/bcryptjs/Prisma).
 */
export function canModerate(
  user: { role: "USER" | "ADMIN" } | null | undefined,
): boolean {
  return user?.role === "ADMIN";
}
