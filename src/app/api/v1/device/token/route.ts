import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateAccessToken,
  hashToken,
  corsJson,
  corsPreflight,
} from "@/lib/extensionAuth";
import { deviceCodeSchema } from "@/lib/validation";

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

/**
 * specs/003: extension polls for approval.
 * POST /api/v1/device/token
 *
 * The raw access token only ever exists in memory for this one request: it
 * is generated here (the first successful poll after approval) and only its
 * bcrypt hash is persisted — never written to the database in plaintext.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = deviceCodeSchema.safeParse(body);
  if (!parsed.success) {
    return corsJson(request, { error: "expired_token" }, { status: 400 });
  }

  const grant = await prisma.deviceGrant.findUnique({
    where: { deviceCode: parsed.data.device_code },
    include: { token: true },
  });

  if (!grant) {
    return corsJson(request, { error: "expired_token" }, { status: 400 });
  }

  if (grant.status === "PENDING" && grant.expiresAt < new Date()) {
    await prisma.deviceGrant.update({
      where: { id: grant.id },
      data: { status: "EXPIRED" },
    });
    return corsJson(request, { error: "expired_token" }, { status: 400 });
  }

  if (grant.status === "PENDING") {
    return corsJson(request, { status: "authorization_pending" }, { status: 202 });
  }

  if (grant.status === "DENIED" || grant.status === "EXPIRED") {
    return corsJson(
      request,
      { error: grant.status === "DENIED" ? "access_denied" : "expired_token" },
      { status: 400 },
    );
  }

  // APPROVED. Issue the token on first retrieval only.
  if (grant.token) {
    // Already consumed by an earlier poll — nothing left to hand out.
    return corsJson(request, { error: "expired_token" }, { status: 400 });
  }
  if (!grant.userId) {
    return corsJson(request, { error: "expired_token" }, { status: 400 });
  }

  const rawToken = generateAccessToken();
  const label = "Browser Extension";
  await prisma.extensionToken.create({
    data: {
      tokenHash: await hashToken(rawToken),
      label,
      userId: grant.userId,
      grantId: grant.id,
    },
  });

  return corsJson(request, {
    access_token: rawToken,
    token_type: "Bearer",
    label,
  });
}
