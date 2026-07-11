"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  isBase,
  isAccent,
  isSize,
  isFontKey,
  isSurface,
  isRadius,
  isCardStyle,
  isBorderDensity,
  isShadow,
} from "@/lib/fonts";

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
  surface?: string;
  radius?: string;
  cardStyle?: string;
  borderDensity?: string;
  shadow?: string;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const data: {
    theme?: string;
    accent?: string;
    size?: string;
    font?: string;
    surface?: string;
    radius?: string;
    cardStyle?: string;
    borderDensity?: string;
    shadow?: string;
  } = {};
  if (prefs.base && isBase(prefs.base)) data.theme = prefs.base;
  if (prefs.accent && isAccent(prefs.accent)) data.accent = prefs.accent;
  if (prefs.size && isSize(prefs.size)) data.size = prefs.size;
  if (prefs.font && isFontKey(prefs.font)) data.font = prefs.font;
  if (prefs.surface && isSurface(prefs.surface)) data.surface = prefs.surface;
  if (prefs.radius && isRadius(prefs.radius)) data.radius = prefs.radius;
  if (prefs.cardStyle && isCardStyle(prefs.cardStyle))
    data.cardStyle = prefs.cardStyle;
  if (prefs.borderDensity && isBorderDensity(prefs.borderDensity))
    data.borderDensity = prefs.borderDensity;
  if (prefs.shadow && isShadow(prefs.shadow)) data.shadow = prefs.shadow;
  if (Object.keys(data).length === 0) return;

  await prisma.user.update({ where: { id: user.id }, data });
}
