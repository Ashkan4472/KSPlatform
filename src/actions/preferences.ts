"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isBase, isAccent, isSize, isFontKey } from "@/lib/fonts";

/**
 * Persist appearance preferences to the logged-in user's record.
 * `base` is stored in the `theme` column. Guests are a no-op (the client
 * still applies the change locally for the session).
 */
export async function updatePreferencesAction(prefs: {
  base?: string;
  accent?: string;
  size?: string;
  font?: string;
}): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const data: { theme?: string; accent?: string; size?: string; font?: string } =
    {};
  if (prefs.base && isBase(prefs.base)) data.theme = prefs.base;
  if (prefs.accent && isAccent(prefs.accent)) data.accent = prefs.accent;
  if (prefs.size && isSize(prefs.size)) data.size = prefs.size;
  if (prefs.font && isFontKey(prefs.font)) data.font = prefs.font;
  if (Object.keys(data).length === 0) return;

  await prisma.user.update({ where: { id: session.user.id }, data });
}
