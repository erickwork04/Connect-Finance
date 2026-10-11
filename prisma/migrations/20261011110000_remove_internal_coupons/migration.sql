DROP INDEX IF EXISTS "MercadoPagoSubscription_couponId_couponReserved_idx";

DROP TABLE IF EXISTS "CouponUsage";

ALTER TABLE "MercadoPagoSubscription"
  DROP CONSTRAINT IF EXISTS "MercadoPagoSubscription_couponId_fkey",
  DROP COLUMN IF EXISTS "couponId",
  DROP COLUMN IF EXISTS "couponCode",
  DROP COLUMN IF EXISTS "couponFirstCycleOnly",
  DROP COLUMN IF EXISTS "couponRestored",
  DROP COLUMN IF EXISTS "couponReserved";

DROP TABLE IF EXISTS "Coupon";
DROP TYPE IF EXISTS "CouponType";
