-- AlterTable
ALTER TABLE "User" ADD COLUMN     "font" TEXT NOT NULL DEFAULT 'geist',
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'system';

-- Trigram fuzzy search for free-form tags
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "tag_name_trgm_idx" ON "Tag" USING gin ("name" gin_trgm_ops);
