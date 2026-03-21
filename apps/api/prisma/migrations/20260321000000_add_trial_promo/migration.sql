-- AlterTable: add trialUsed to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trialUsed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: promo_codes
CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "daysToAdd" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_key" ON "promo_codes"("code");
CREATE INDEX IF NOT EXISTS "promo_codes_code_idx" ON "promo_codes"("code");

-- CreateTable: promo_code_uses
CREATE TABLE IF NOT EXISTS "promo_code_uses" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promo_code_uses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "promo_code_uses_promoCodeId_userId_key" ON "promo_code_uses"("promoCodeId", "userId");
CREATE INDEX IF NOT EXISTS "promo_code_uses_userId_idx" ON "promo_code_uses"("userId");

ALTER TABLE "promo_code_uses" ADD CONSTRAINT "promo_code_uses_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promo_code_uses" ADD CONSTRAINT "promo_code_uses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
