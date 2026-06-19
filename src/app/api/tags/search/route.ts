import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type TagRow = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

/**
 * Tag search for free-form tags. Uses pg_trgm: typo-tolerant similarity (`%`)
 * plus a prefix match, ranked by similarity then popularity.
 * GET /api/tags/search?q=nextjs  → [{ id, name, slug, postCount }]
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  const rows = q
    ? await prisma.$queryRaw<TagRow[]>`
        SELECT t.id, t.name, t.slug, COUNT(pt."postId")::int AS "postCount"
        FROM "Tag" t
        LEFT JOIN "PostTag" pt ON pt."tagId" = t.id
        WHERE t.name % ${q} OR t.name ILIKE ${q + "%"}
        GROUP BY t.id
        ORDER BY similarity(t.name, ${q}) DESC, "postCount" DESC, t.name ASC
        LIMIT 8`
    : await prisma.$queryRaw<TagRow[]>`
        SELECT t.id, t.name, t.slug, COUNT(pt."postId")::int AS "postCount"
        FROM "Tag" t
        LEFT JOIN "PostTag" pt ON pt."tagId" = t.id
        GROUP BY t.id
        ORDER BY "postCount" DESC, t.name ASC
        LIMIT 8`;

  return NextResponse.json(rows);
}
