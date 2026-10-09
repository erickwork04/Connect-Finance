import { db } from "@/app/_lib/prisma";
import type { Prisma } from "@prisma/client";
import { calculateCouponPrice, normalizeCouponCode, PREMIUM_BASE_CENTS } from "./coupon-pricing";

export type CouponFailureCode = "invalid" | "inactive" | "expired" | "exhausted" | "used" | "unavailable";

export type CouponQuote = {
  code: string;
  couponId: string;
  discountCents: number;
  finalCents: number;
  firstCycleOnly: boolean;
};

export async function getCouponQuoteForUser(userId: string, rawCode: string, now = new Date(), client: Pick<Prisma.TransactionClient, "coupon" | "couponUsage" | "mercadoPagoSubscription"> = db): Promise<
  { ok: true; quote: CouponQuote } | { ok: false; code: CouponFailureCode }
> {
  const code = normalizeCouponCode(rawCode);
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return { ok: false, code: "invalid" };
  const coupon = await client.coupon.findUnique({ where: { code } });
  if (!coupon) return { ok: false, code: "invalid" };
  if (!coupon.active) return { ok: false, code: "inactive" };
  if (coupon.expiresAt && coupon.expiresAt <= now) return { ok: false, code: "expired" };

  const [usage, reservation] = await Promise.all([
    client.couponUsage.findUnique({ where: { couponId_userId: { couponId: coupon.id, userId } }, select: { id: true } }),
    client.mercadoPagoSubscription.findFirst({
      where: { userId, couponId: coupon.id, couponReserved: true, status: { in: ["CREATING", "PENDING", "ACTIVE"] } },
      select: { id: true },
    }),
  ]);
  if (usage || reservation) return { ok: false, code: "used" };
  if (coupon.maxUses !== null && coupon.currentUses + coupon.reservedUses >= coupon.maxUses) return { ok: false, code: "exhausted" };

  try {
    const price = calculateCouponPrice(PREMIUM_BASE_CENTS, { type: coupon.type, value: Number(coupon.value) });
    return { ok: true, quote: { code, couponId: coupon.id, ...price, firstCycleOnly: coupon.firstCycleOnly } };
  } catch {
    return { ok: false, code: "unavailable" };
  }
}
