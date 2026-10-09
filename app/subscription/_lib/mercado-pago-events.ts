import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { getPaymentFinalization, shouldUpdateClerkPremium } from "./payment-finalization";

type ProviderSubscription = { id?: unknown; external_reference?: unknown; status?: unknown };
type ProviderInvoice = { id?: unknown; preapproval_id?: unknown; external_reference?: unknown; currency_id?: unknown;
  transaction_amount?: unknown; payment?: { id?: unknown; status?: unknown } };

function providerCode(body: unknown): string {
  return typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
    ? body.error : "unknown";
}

async function providerRequest(path: string, token: string, options?: { method: "PUT"; body: object }): Promise<unknown> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method: options?.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, ...(options ? { "Content-Type": "application/json" } : {}) },
    body: options ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Mercado Pago webhook provider request failed", { path: path.split("/").slice(0, 2).join("/"), status: response.status, code: providerCode(body) });
    throw new Error("Provider request failed");
  }
  return body;
}

async function setClerkPremium(userId: string, providerId: string, active: boolean) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const currentId = user.privateMetadata.mercadoPagoSubscriptionId;
  if (active) {
    if (shouldUpdateClerkPremium(currentId, providerId, user.publicMetadata.subscriptionPlan, true)) {
      await client.users.updateUser(userId, {
        privateMetadata: { mercadoPagoSubscriptionId: providerId }, publicMetadata: { subscriptionPlan: "premium" },
      });
    }
  } else if (shouldUpdateClerkPremium(currentId, providerId, user.publicMetadata.subscriptionPlan, false)) {
    await client.users.updateUser(userId, {
      privateMetadata: { mercadoPagoSubscriptionId: null }, publicMetadata: { subscriptionPlan: null },
    });
  }
}

export async function processPreapprovalEvent(id: string, token: string) {
  const subscription = await providerRequest(`/preapproval/${encodeURIComponent(id)}`, token) as ProviderSubscription;
  if (subscription.id !== id || typeof subscription.external_reference !== "string" || typeof subscription.status !== "string") {
    throw new Error("Invalid provider subscription");
  }
  const local = await db.mercadoPagoSubscription.findUnique({ where: { id: subscription.external_reference } });
  if (!local && !subscription.external_reference.startsWith("user_")) return;
  const userId = local?.userId ?? subscription.external_reference;
  if (local && local.mercadoPagoId && local.mercadoPagoId !== id) throw new Error("Subscription id mismatch");

  if (subscription.status === "authorized") {
    if (!local) {
      await setClerkPremium(userId, id, true);
      return;
    }
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "MercadoPagoSubscription" WHERE "id" = ${local.id} FOR UPDATE`;
      const current = await tx.mercadoPagoSubscription.findUnique({ where: { id: local.id } });
      if (!current || current.mercadoPagoId && current.mercadoPagoId !== id) return;
      if (!["CREATING", "PENDING", "ACTIVE"].includes(current.status)) return;
      await tx.mercadoPagoSubscription.update({
        where: { id: local.id },
        data: { mercadoPagoId: id, status: "ACTIVE" },
      });
      await setClerkPremium(userId, id, true);
    }, { timeout: 20_000 });
  } else if (subscription.status === "cancelled" || subscription.status === "canceled" || subscription.status === "paused") {
    if (!local) {
      await setClerkPremium(userId, id, false);
      return;
    }
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "MercadoPagoSubscription" WHERE "id" = ${local.id} FOR UPDATE`;
      const current = await tx.mercadoPagoSubscription.findUnique({ where: { id: local.id } });
      if (!current || current.mercadoPagoId && current.mercadoPagoId !== id) return;
      if (current.status !== "FAILED") {
        await tx.mercadoPagoSubscription.update({
          where: { id: local.id },
          data: { mercadoPagoId: id, status: "CANCELLED" },
        });
      }
      await setClerkPremium(userId, id, false);
    }, { timeout: 20_000 });
  }
}

async function finalizeFirstPayment(subscriptionId: string, paymentId: string, restored: boolean) {
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "MercadoPagoSubscription" WHERE "id" = ${subscriptionId} FOR UPDATE`;
    const record = await tx.mercadoPagoSubscription.findUnique({ where: { id: subscriptionId } });
    if (!record) return;
    const decision = getPaymentFinalization({
      status: record.status,
      firstPaymentAlreadyRecorded: Boolean(record.firstPaymentApprovedAt),
      couponReserved: record.couponReserved,
      firstCycleOnly: record.couponFirstCycleOnly,
      couponRestored: record.couponRestored || restored,
    });
    if (!decision.shouldRecordPayment) {
      if (decision.shouldGrantPremium && record.mercadoPagoId) {
        await setClerkPremium(record.userId, record.mercadoPagoId, true);
      }
      return;
    }
    const updated = await tx.mercadoPagoSubscription.updateMany({
      where: { id: record.id, firstPaymentApprovedAt: null, status: record.status },
      data: { firstPaymentId: paymentId, firstPaymentApprovedAt: new Date(),
        status: decision.nextStatus, couponReserved: false,
        ...(restored ? { couponRestored: true, currentAmount: record.baseAmount, restoreLockUntil: null } : {}),
      },
    });
    if (!updated.count) throw new Error("Subscription changed during payment finalization");
    if (record.couponId && decision.shouldConsumeCoupon) {
      await tx.couponUsage.create({ data: { couponId: record.couponId, userId: record.userId, subscriptionId: record.id } });
      await tx.coupon.update({ where: { id: record.couponId }, data: {
        reservedUses: { decrement: 1 }, currentUses: { increment: 1 },
      } });
    }
    if (decision.shouldGrantPremium && record.mercadoPagoId) {
      await setClerkPremium(record.userId, record.mercadoPagoId, true);
    }
  }, { timeout: 20_000 });
}

export async function processAuthorizedPaymentEvent(id: string, token: string) {
  const invoice = await providerRequest(`/authorized_payments/${encodeURIComponent(id)}`, token) as ProviderInvoice;
  if (String(invoice.id) !== id || typeof invoice.preapproval_id !== "string" ||
      invoice.payment?.status !== "approved" || (typeof invoice.payment.id !== "string" && typeof invoice.payment.id !== "number")) return;

  let record = await db.mercadoPagoSubscription.findFirst({ where: {
    OR: [{ mercadoPagoId: invoice.preapproval_id }, { id: typeof invoice.external_reference === "string" ? invoice.external_reference : "" }],
  } });
  if (!record) {
    const providerSubscription = await providerRequest(`/preapproval/${encodeURIComponent(invoice.preapproval_id)}`, token) as ProviderSubscription;
    if (providerSubscription.id !== invoice.preapproval_id || typeof providerSubscription.external_reference !== "string") {
      throw new Error("Invalid provider subscription for payment");
    }
    record = await db.mercadoPagoSubscription.findUnique({ where: { id: providerSubscription.external_reference } });
    if (record && !record.mercadoPagoId) {
      await db.mercadoPagoSubscription.updateMany({ where: { id: record.id, mercadoPagoId: null }, data: { mercadoPagoId: invoice.preapproval_id } });
    }
  }
  if (!record || record.status === "FAILED") return;
  if (record.mercadoPagoId && record.mercadoPagoId !== invoice.preapproval_id) throw new Error("Payment subscription mismatch");
  if (!record.firstPaymentApprovedAt &&
      (invoice.currency_id !== "BRL" || Math.round(Number(invoice.transaction_amount) * 100) !== Math.round(Number(record.currentAmount) * 100))) {
    throw new Error("Payment amount mismatch");
  }

  const paymentId = String(invoice.payment.id);
  const decision = getPaymentFinalization({
    status: record.status,
    firstPaymentAlreadyRecorded: Boolean(record.firstPaymentApprovedAt),
    couponReserved: record.couponReserved,
    firstCycleOnly: record.couponFirstCycleOnly,
    couponRestored: record.couponRestored,
  });
  if (decision.shouldRestorePrice && !record.firstPaymentApprovedAt) {
    const claimed = await db.mercadoPagoSubscription.updateMany({ where: {
      id: record.id, firstPaymentApprovedAt: null, couponRestored: false,
      OR: [{ restoreLockUntil: null }, { restoreLockUntil: { lt: new Date() } }],
    }, data: { restoreLockUntil: new Date(Date.now() + 120_000) } });
    if (!claimed.count) return;
    try {
      await providerRequest(`/preapproval/${encodeURIComponent(invoice.preapproval_id)}`, token, {
        method: "PUT", body: { auto_recurring: { transaction_amount: Number(record.baseAmount), currency_id: "BRL" } },
      });
      await finalizeFirstPayment(record.id, paymentId, true);
    } catch (error) {
      await db.mercadoPagoSubscription.updateMany({ where: { id: record.id, firstPaymentApprovedAt: null }, data: { restoreLockUntil: null } });
      throw error;
    }
  } else {
    await finalizeFirstPayment(record.id, paymentId, false);
  }
}
