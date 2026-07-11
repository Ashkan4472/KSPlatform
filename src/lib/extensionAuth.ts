import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function generateDeviceCode(): string {
  return randomBytes(32).toString("hex");
}

export function generateUserCode(): string {
  const pick = () =>
    Array.from({ length: 4 }, () =>
      USER_CODE_ALPHABET[randomBytes(1)[0] % USER_CODE_ALPHABET.length],
    ).join("");
  return `${pick()}-${pick()}`;
}

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function hashToken(raw: string): Promise<string> {
  return bcrypt.hash(raw, 10);
}

/**
 * ExtensionToken.tokenHash isn't indexable by a raw bcrypt lookup, so we
 * check the incoming token against every active hash. Fine at this scale;
 * ponytail: linear scan over active tokens, add a fast lookup index if the
 * connected-extension count ever gets large.
 */
export async function verifyAccessToken(
  raw: string,
): Promise<{ userId: string; tokenId: string } | null> {
  const tokens = await prisma.extensionToken.findMany({
    where: { revokedAt: null },
    select: { id: true, tokenHash: true, userId: true },
  });
  for (const t of tokens) {
    if (await bcrypt.compare(raw, t.tokenHash)) {
      await prisma.extensionToken.update({
        where: { id: t.id },
        data: { lastUsedAt: new Date() },
      });
      return { userId: t.userId, tokenId: t.id };
    }
  }
  return null;
}

/**
 * specs/003 FR-006: every /api/v1/* route (this feature's and spec 004's
 * feed endpoint) authenticates the same way — call this first and return
 * early on `null`. A revoked token's hash won't match any active
 * ExtensionToken row (verifyAccessToken only queries `revokedAt: null`),
 * so revoked and missing/invalid tokens all produce the same signal.
 */
export async function requireBearerAuth(
  request: NextRequest,
): Promise<{ userId: string; tokenId: string } | NextResponse> {
  const header = request.headers.get("authorization") ?? "";
  const raw = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!raw) {
    return corsJson(request, { error: "reauthenticate_required" }, { status: 401 });
  }
  const auth = await verifyAccessToken(raw);
  if (!auth) {
    return corsJson(request, { error: "reauthenticate_required" }, { status: 401 });
  }
  return auth;
}

// Only the browser-extension origins this API is meant for (Constitution
// Principle VII) get CORS access — not an open "*", which would let any
// website's JS call these endpoints from a visitor's browser too.
const ALLOWED_ORIGIN = /^(chrome|moz)-extension:\/\//;

function corsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED_ORIGIN.test(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };
}

/** Every /api/v1/* handler should return via this instead of NextResponse.json directly. */
export function corsJson(
  request: NextRequest,
  body: unknown,
  init?: { status?: number },
): NextResponse {
  return NextResponse.json(body, {
    status: init?.status,
    headers: corsHeaders(request),
  });
}

/** Every /api/v1/* route file should export this verbatim for CORS preflight. */
export function corsPreflight(request: NextRequest): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateLimitHits = new Map<string, number[]>();

/**
 * In-process sliding-window rate limit, keyed by caller IP.
 * ponytail: single-process only (resets on restart, not shared across
 * instances) — swap for a shared store (e.g. Redis) if this app ever runs
 * more than one server instance.
 */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rateLimitHits.get(key) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  hits.push(now);
  rateLimitHits.set(key, hits);
  return hits.length > RATE_LIMIT_MAX;
}
