"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { profileSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions";

export async function updateProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
    image: formData.get("image"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio ? parsed.data.bio : null,
      image: parsed.data.image ? parsed.data.image : null,
    },
  });

  revalidatePath("/settings");
  revalidatePath(`/u/${userId}`);
  return { ok: true };
}
