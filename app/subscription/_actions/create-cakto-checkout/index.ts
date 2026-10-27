"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { db } from "@/app/_lib/prisma";
import { PREMIUM_BASE_CENTS } from "../../_lib/subscription-pricing";

type CheckoutResult = { ok: true; subscriptionId: string; url: string } | { ok: false; code: "pending" | "payment" | "configuration" | "schema" };

function configuredCheckoutUrl(): URL | null {
  const rawUrl = process.env.CAKTO_PREMIUM_CHECKOUT_URL;
  const productId = process.env.CAKTO_PREMIUM_PRODUCT_ID;
  const offerId = process.env.CAKTO_PREMIUM_OFFER_ID;
  if (!rawUrl || !productId || !offerId) return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.hostname !== "pay.cakto.com.br" || url.username || url.password) return null;
    if (url.pathname !== `/${offerId}` || url.search || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

export async function createCaktoCheckout(): Promise<CheckoutResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, code: "payment" };
  const user = await currentUser();
  if (!user || user.privateMetadata.subscriptionPlan === "premium" || user.publicMetadata.subscriptionPlan === "premium") {
    return { ok: false, code: "pending" };
  }

  const baseUrl = configuredCheckoutUrl();
  if (!baseUrl) return { ok: false, code: "configuration" };

  try {
    const record = await db.$transaction(async (tx) => {
      const open = await tx.billingSubscription.findFirst({
        where: { userId, status: { in: ["CREATING", "PENDING", "ACTIVE"], }, provider: "CAKTO" },
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, caktoCallbackToken: true },
      });
      if (open) {
        if (open.status === "ACTIVE" || !open.caktoCallbackToken) return null;
        return open;
      }

      const callbackToken = randomBytes(32).toString("base64url");
      return tx.billingSubscription.create({
        data: {
          userId,
          provider: "CAKTO",
          caktoCallbackToken: callbackToken,
          caktoProductId: process.env.CAKTO_PREMIUM_PRODUCT_ID,
          caktoOfferId: process.env.CAKTO_PREMIUM_OFFER_ID,
          baseAmount: (PREMIUM_BASE_CENTS / 100).toFixed(2),
          currentAmount: (PREMIUM_BASE_CENTS / 100).toFixed(2),
          status: "PENDING",
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (!record?.caktoCallbackToken) return { ok: false, code: "pending" };
    baseUrl.searchParams.set("callback", record.caktoCallbackToken);
    return { ok: true, subscriptionId: record.id, url: baseUrl.toString() };
  } catch (error) {
    console.error("Cakto checkout setup failed", { code: typeof error === "object" && error && "code" in error ? error.code : "unknown" });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
      return { ok: false, code: "schema" };
    }
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { ok: false, code: "pending" };
    }
    return { ok: false, code: "payment" };
  }
}
