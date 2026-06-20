-- AlterTable: combinable appearance axes (accent + size); `theme` now holds the base.
ALTER TABLE "User" ADD COLUMN     "accent" TEXT NOT NULL DEFAULT 'neutral',
ADD COLUMN     "size" TEXT NOT NULL DEFAULT 'comfortable';

-- Normalize previously-flat theme values into base + accent.
UPDATE "User" SET "theme" = 'dark'  WHERE "theme" IN ('midnight', 'solarized');
UPDATE "User" SET "accent" = 'rose',    "theme" = 'light' WHERE "theme" = 'rose';
UPDATE "User" SET "accent" = 'emerald', "theme" = 'light' WHERE "theme" = 'emerald';
-- Any remaining non-base values fall back to system.
UPDATE "User" SET "theme" = 'system' WHERE "theme" NOT IN ('light', 'dark', 'system');

-- Trigram indexes for fuzzy search (pg_trgm already enabled).
CREATE INDEX IF NOT EXISTS "post_title_trgm_idx" ON "Post" USING gin ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "tweet_body_trgm_idx" ON "Tweet" USING gin ("body" gin_trgm_ops);
