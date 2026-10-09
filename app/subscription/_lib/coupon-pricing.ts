export const PREMIUM_BASE_CENTS = 1990;

export type CouponKind = "PERCENTAGE" | "FIXED";

export function normalizeCouponCode(input: string): string {
  return input.trim().toUpperCase();
}

export function calculateCouponPrice(baseCents: number, coupon: { type: CouponKind; value: number }) {
  if (!Number.isSafeInteger(baseCents) || baseCents <= 0 || !Number.isFinite(coupon.value) || coupon.value <= 0) {
    throw new RangeError("Invalid coupon price");
  }
  if (coupon.type === "PERCENTAGE" && coupon.value > 100) throw new RangeError("Invalid percentage");
  const discountCents = coupon.type === "PERCENTAGE"
    ? Math.round(baseCents * coupon.value / 100)
    : Math.round(coupon.value * 100);
  const finalCents = baseCents - discountCents;
  // A zero-value subscription cannot be sent to the card payment flow.
  if (discountCents <= 0 || finalCents <= 0) throw new RangeError("Coupon exceeds payable amount");
  return { discountCents, finalCents };
}
