-- Additive coupon ledger. Existing Clerk subscriptions and financial records are untouched.
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "BillingSubscriptionStatus" AS ENUM ('CREATING', 'PENDING', 'ACTIVE', 'PAUSED', 'CANCELLED', 'FAILED');

CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "type" "CouponType" NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3),
  "maxUses" INTEGER,
  "currentUses" INTEGER NOT NULL DEFAULT 0,
  "reservedUses" INTEGER NOT NULL DEFAULT 0,
  "firstCycleOnly" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Coupon_code_format_check" CHECK ("code" ~ '^[A-Z0-9_-]{3,40}$'),
  CONSTRAINT "Coupon_value_check" CHECK ("value" > 0 AND ("type" <> 'PERCENTAGE' OR "value" <= 100)),
  CONSTRAINT "Coupon_uses_check" CHECK ("currentUses" >= 0 AND "reservedUses" >= 0 AND ("maxUses" IS NULL OR "maxUses" > 0))
);

CREATE TABLE "MercadoPagoSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mercadoPagoId" TEXT,
  "couponId" TEXT,
  "couponCode" TEXT,
  "baseAmount" DECIMAL(10,2) NOT NULL,
  "currentAmount" DECIMAL(10,2) NOT NULL,
  "couponFirstCycleOnly" BOOLEAN NOT NULL DEFAULT false,
  "couponRestored" BOOLEAN NOT NULL DEFAULT false,
  "couponReserved" BOOLEAN NOT NULL DEFAULT false,
  "status" "BillingSubscriptionStatus" NOT NULL DEFAULT 'CREATING',
  "firstPaymentId" TEXT,
  "firstPaymentApprovedAt" TIMESTAMP(3),
  "restoreLockUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MercadoPagoSubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MercadoPagoSubscription_amount_check" CHECK ("baseAmount" > 0 AND "currentAmount" > 0)
);

CREATE TABLE "CouponUsage" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE UNIQUE INDEX "MercadoPagoSubscription_mercadoPagoId_key" ON "MercadoPagoSubscription"("mercadoPagoId");
CREATE UNIQUE INDEX "MercadoPagoSubscription_firstPaymentId_key" ON "MercadoPagoSubscription"("firstPaymentId");
CREATE INDEX "MercadoPagoSubscription_userId_createdAt_idx" ON "MercadoPagoSubscription"("userId", "createdAt");
CREATE INDEX "MercadoPagoSubscription_couponId_couponReserved_idx" ON "MercadoPagoSubscription"("couponId", "couponReserved");
CREATE UNIQUE INDEX "MercadoPagoSubscription_one_open_per_user_key" ON "MercadoPagoSubscription"("userId")
  WHERE "status" IN ('CREATING', 'PENDING', 'ACTIVE', 'PAUSED');
CREATE UNIQUE INDEX "CouponUsage_subscriptionId_key" ON "CouponUsage"("subscriptionId");
CREATE UNIQUE INDEX "CouponUsage_couponId_userId_key" ON "CouponUsage"("couponId", "userId");
CREATE INDEX "CouponUsage_userId_usedAt_idx" ON "CouponUsage"("userId", "usedAt");

ALTER TABLE "MercadoPagoSubscription" ADD CONSTRAINT "MercadoPagoSubscription_couponId_fkey"
  FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey"
  FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "MercadoPagoSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
