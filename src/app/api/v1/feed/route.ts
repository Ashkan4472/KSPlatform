import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireBearerAuth, corsJson, corsPreflight } from "@/lib/extensionAuth";
import { loadSubscribedFeed } from "@/lib/extensionFeed";

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

/**
 * specs/004: GET /api/v1/feed
 * Bearer-token-authenticated, unified posts+tweets feed scoped to the
 * caller's subscribed tags.
 */
export async function GET(request: NextRequest) {
  const auth = await requireBearerAuth(request);
  if (auth instanceof NextResponse) return auth;

  const cursor = request.nextUrl.searchParams.get("cursor");
  const page = await loadSubscribedFeed({ userId: auth.userId, cursor });
  return corsJson(request, page);
}
