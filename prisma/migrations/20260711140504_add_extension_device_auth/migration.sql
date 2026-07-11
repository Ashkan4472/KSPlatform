-- CreateEnum
CREATE TYPE "DeviceGrantStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED');

-- Note: prisma migrate diff wants to drop post_title_trgm_idx,
-- tag_name_trgm_idx, and tweet_body_trgm_idx here because the pg_trgm GIN
-- indexes aren't expressible in schema.prisma (see CLAUDE.md). Intentionally
-- omitted — never drop these.

-- CreateTable
CREATE TABLE "DeviceGrant" (
    "id" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "userCode" TEXT NOT NULL,
    "status" "DeviceGrantStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "DeviceGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "grantId" TEXT,

    CONSTRAINT "ExtensionToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceGrant_deviceCode_key" ON "DeviceGrant"("deviceCode");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceGrant_userCode_key" ON "DeviceGrant"("userCode");

-- CreateIndex
CREATE INDEX "DeviceGrant_status_idx" ON "DeviceGrant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionToken_tokenHash_key" ON "ExtensionToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionToken_grantId_key" ON "ExtensionToken"("grantId");

-- CreateIndex
CREATE INDEX "ExtensionToken_userId_idx" ON "ExtensionToken"("userId");

-- AddForeignKey
ALTER TABLE "DeviceGrant" ADD CONSTRAINT "DeviceGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionToken" ADD CONSTRAINT "ExtensionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionToken" ADD CONSTRAINT "ExtensionToken_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "DeviceGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
