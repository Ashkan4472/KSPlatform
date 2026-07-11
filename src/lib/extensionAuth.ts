import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
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
