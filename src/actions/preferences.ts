"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isThemeKey, isFontKey } from "@/lib/fonts";

/**
 * Persist theme/font preferences to the logged-in user's record.
 * Guests are a no-op (the client still applies the change locally for the session).
 */
export async function updatePreferencesAction(prefs: {
  theme?: string;
  font?: string;
}): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const data: { theme?: string; font?: string } = {};
  if (prefs.theme && isThemeKey(prefs.theme)) data.theme = prefs.theme;
  if (prefs.font && isFontKey(prefs.font)) data.font = prefs.font;
  if (Object.keys(data).length === 0) return;

  await prisma.user.update({ where: { id: session.user.id }, data });
}
