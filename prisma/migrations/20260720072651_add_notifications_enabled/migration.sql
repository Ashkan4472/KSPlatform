-- Note: prisma migrate diff wants to drop post_title_trgm_idx,
-- tag_name_trgm_idx, and tweet_body_trgm_idx here because the pg_trgm GIN
-- indexes aren't expressible in schema.prisma (see CLAUDE.md). Intentionally
-- omitted — never drop these.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
