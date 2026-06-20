-- AlterTable: additional per-account appearance axes.
ALTER TABLE "User" ADD COLUMN     "borderDensity" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "cardStyle" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "radius" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "shadow" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "surface" TEXT NOT NULL DEFAULT 'default';
