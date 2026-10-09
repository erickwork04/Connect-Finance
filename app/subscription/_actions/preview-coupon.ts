"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getCouponQuoteForUser, type CouponFailureCode } from "../_lib/coupon-eligibility";
import { PREMIUM_BASE_CENTS } from "../_lib/coupon-pricing";

export type CouponPreview =
  | { ok: true; code: string; baseCents: number; discountCents: number; finalCents: number; firstCycleOnly: boolean }
  | { ok: false; code: CouponFailureCode };

export async function previewCoupon(rawCode: string): Promise<CouponPreview> {
  const { userId } = await auth();
  if (!userId) return { ok: false, code: "unavailable" };
  const user = await currentUser();
  if (!user || user.publicMetadata.subscriptionPlan === "premium") return { ok: false, code: "unavailable" };
  try {
    const result = await getCouponQuoteForUser(userId, rawCode);
    if (!result.ok) return result;
    return { ok: true, code: result.quote.code, baseCents: PREMIUM_BASE_CENTS,
      discountCents: result.quote.discountCents, finalCents: result.quote.finalCents,
      firstCycleOnly: result.quote.firstCycleOnly };
  } catch (error) {
    console.error("Coupon preview failed", { code: typeof error === "object" && error && "code" in error ? error.code : "unknown" });
    return { ok: false, code: "unavailable" };
  }
}
