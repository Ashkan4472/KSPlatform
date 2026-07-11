import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateDeviceCode,
  generateUserCode,
  isRateLimited,
  corsJson,
  corsPreflight,
} from "@/lib/extensionAuth";

const CODE_TTL_MS = 10 * 60 * 1000;

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

/**
 * specs/003: unauthenticated extension requests a connection code.
 * POST /api/v1/device/code
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(`device-code:${ip}`)) {
    return corsJson(request, { error: "rate_limited", retry_after: 30 }, { status: 429 });
  }

  let userCode = generateUserCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.deviceGrant.findFirst({
      where: { userCode, status: "PENDING" },
      select: { id: true },
    });
    if (!existing) break;
    userCode = generateUserCode();
  }

  const grant = await prisma.deviceGrant.create({
    data: {
      deviceCode: generateDeviceCode(),
      userCode,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  const origin = request.nextUrl.origin;
  return corsJson(request, {
    device_code: grant.deviceCode,
    user_code: grant.userCode,
    verification_uri: `${origin}/connect`,
    verification_uri_complete: `${origin}/connect?code=${grant.userCode}`,
    expires_in: Math.round(CODE_TTL_MS / 1000),
    interval: 5,
  });
}
