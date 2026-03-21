-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');

-- AlterTable: add referral fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referredById" TEXT;

-- CreateIndex for referralCode
CREATE UNIQUE INDEX IF NOT EXISTS "users_referralCode_key" ON "users"("referralCode");
CREATE INDEX IF NOT EXISTS "users_referralCode_idx" ON "users"("referralCode");

-- AddForeignKey for referredById
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: referral_earnings
CREATE TABLE IF NOT EXISTS "referral_earnings" (
    "id" TEXT NOT NULL,
    "earnerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "purchaseAmount" INTEGER NOT NULL,
    "earnAmount" INTEGER NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_earnings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_earnings_earnerId_idx" ON "referral_earnings"("earnerId");
CREATE INDEX IF NOT EXISTS "referral_earnings_earnerId_paid_idx" ON "referral_earnings"("earnerId", "paid");

ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_earnerId_fkey" FOREIGN KEY ("earnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: withdrawal_requests
CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "cardDetails" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "withdrawal_requests_userId_idx" ON "withdrawal_requests"("userId");
CREATE INDEX IF NOT EXISTS "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
