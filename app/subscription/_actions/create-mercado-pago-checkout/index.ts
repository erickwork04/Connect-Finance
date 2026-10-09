"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/app/_lib/prisma";
import { getCouponQuoteForUser, type CouponFailureCode } from "../../_lib/coupon-eligibility";
import { PREMIUM_BASE_CENTS } from "../../_lib/coupon-pricing";

type CheckoutFailureCode = CouponFailureCode | "pending" | "payment";
type CheckoutResult = { ok: true; subscriptionId: string; url: string | null } | { ok: false; code: CheckoutFailureCode };

class CheckoutFailure extends Error {
  constructor(readonly code: CheckoutFailureCode) { super(code); }
}

const tokenSchema = z.string().min(8).max(500);
const codeSchema = z.string().max(80).optional();
const money = (cents: number) => (cents / 100).toFixed(2);

function logProviderFailure(stage: string, status: number | null, body: unknown) {
  const code = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
    ? body.error : "unknown";
  console.error("Mercado Pago subscription request failed", { stage, status, code });
}

async function reserveCheckout(userId: string, rawCode: string | undefined) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const open = await tx.mercadoPagoSubscription.findFirst({
          where: { userId, status: { in: ["CREATING", "PENDING", "ACTIVE"] } }, select: { id: true },
        });
        if (open) throw new CheckoutFailure("pending");

        const result = rawCode ? await getCouponQuoteForUser(userId, rawCode, new Date(), tx) : null;
        if (result && !result.ok) throw new CheckoutFailure(result.code);
        const quote = result?.ok ? result.quote : null;
        const record = await tx.mercadoPagoSubscription.create({ data: {
          userId, couponId: quote?.couponId, couponCode: quote?.code,
          baseAmount: money(PREMIUM_BASE_CENTS), currentAmount: money(quote?.finalCents ?? PREMIUM_BASE_CENTS),
          couponFirstCycleOnly: quote?.firstCycleOnly ?? false, couponReserved: Boolean(quote),
        } });
        if (quote) await tx.coupon.update({ where: { id: quote.couponId }, data: { reservedUses: { increment: 1 } } });
        return record;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof CheckoutFailure) throw error;
      if (typeof error === "object" && error && "code" in error && error.code === "P2034" && attempt < 2) continue;
      if (typeof error === "object" && error && "code" in error && error.code === "P2002") throw new CheckoutFailure("pending");
      throw error;
    }
  }
  throw new CheckoutFailure("pending");
}

async function releaseRejectedCheckout(id: string) {
  await db.$transaction(async (tx) => {
    const record = await tx.mercadoPagoSubscription.findUnique({ where: { id } });
    if (!record || record.status !== "CREATING") return;
    const updated = await tx.mercadoPagoSubscription.updateMany({ where: { id, status: "CREATING" }, data: { status: "FAILED", couponReserved: false } });
    if (updated.count && record.couponId && record.couponReserved) {
      await tx.coupon.update({ where: { id: record.couponId }, data: { reservedUses: { decrement: 1 } } });
    }
  });
}

export async function createMercadoPagoCheckout(cardTokenId: string, couponCode?: string): Promise<CheckoutResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, code: "payment" };
  const user = await currentUser();
  if (!user || user.publicMetadata.subscriptionPlan === "premium") return { ok: false, code: "pending" };
  const token = tokenSchema.safeParse(cardTokenId);
  const code = codeSchema.safeParse(couponCode);
  if (!token.success || !code.success || !user.emailAddresses[0]?.emailAddress) return { ok: false, code: "payment" };
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) return { ok: false, code: "payment" };

  let checkoutId: string | null = null;
  try {
    const record = await reserveCheckout(userId, code.data?.trim() || undefined);
    checkoutId = record.id;
    const backUrl = new URL("/subscription", process.env.APP_URL || "http://localhost:3000");
    backUrl.searchParams.set("checkout", record.id);
    const finalAmount = Number(record.currentAmount);
    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "Plano Premium - Connect Finance",
        external_reference: record.id,
        payer_email: user.emailAddresses[0].emailAddress,
        card_token_id: token.data,
        status: "authorized",
        back_url: backUrl.toString(),
        auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: finalAmount, currency_id: "BRL" },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      logProviderFailure("create", response.status, body);
      if (response.status >= 400 && response.status < 500 && response.status !== 429) await releaseRejectedCheckout(record.id);
      return { ok: false, code: response.status >= 500 || response.status === 429 ? "pending" : "payment" };
    }
    if (!body || typeof body !== "object" || !("id" in body) || typeof body.id !== "string") {
      logProviderFailure("create-response", response.status, body);
      return { ok: false, code: "pending" };
    }
    const url = "init_point" in body && typeof body.init_point === "string" ? body.init_point : null;
    const safeUrl = url && /^https:\/\/[a-z0-9.-]*mercadopago\.(com|com\.br)\//i.test(url) ? url : null;
    await db.mercadoPagoSubscription.updateMany({
      where: { id: record.id, mercadoPagoId: null, status: "CREATING" },
      data: { mercadoPagoId: body.id, status: "PENDING" },
    });
    return { ok: true, subscriptionId: record.id, url: safeUrl };
  } catch (error) {
    if (error instanceof CheckoutFailure) return { ok: false, code: error.code };
    console.error("Mercado Pago checkout failed", { checkoutId, code: typeof error === "object" && error && "code" in error ? error.code : "unknown" });
    return { ok: false, code: checkoutId ? "pending" : "payment" };
  }
}
