import { clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { db } from "@/app/_lib/prisma";
import { caktoEventKey, getCaktoEventDecision, isNewerCaktoEvent, matchesCaktoPayment, matchesCaktoPlan } from "./cakto-event-policy";

type CaktoOrder = {
  id?: unknown;
  status?: unknown;
  amount?: unknown;
  baseAmount?: unknown;
  discount?: unknown;
  callback?: unknown;
  paidAt?: unknown;
  canceledAt?: unknown;
  refundedAt?: unknown;
  chargedbackAt?: unknown;
  createdAt?: unknown;
  customer?: { email?: unknown };
  product?: { id?: unknown; type?: unknown };
  offer?: { id?: unknown; currency?: unknown } | null;
};

type CaktoWebhook = { event?: unknown; data?: unknown };

const knownEvents = new Set(["purchase_approved", "subscription_renewed", "subscription_resumed", "subscription_late_recovered",
  "refund", "chargeback", "subscription_canceled", "subscription_paused", "subscription_late", "subscription_renewal_refused", "purchase_refused"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEventDate(order: CaktoOrder, event: string): Date | null {
  const raw = ["refund", "chargeback", "subscription_canceled"].includes(event)
    ? event === "refund" ? order.refundedAt : event === "chargeback" ? order.chargedbackAt : order.canceledAt
    : ["purchase_approved", "subscription_renewed", "subscription_resumed", "subscription_late_recovered"].includes(event) ? order.paidAt : order.createdAt;
  if (typeof raw !== "string") return null;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

async function getOrCreateEvent(eventType: string, providerEventId: string, productId: string | null) {
  const eventKey = caktoEventKey(eventType, providerEventId);
  const existing = await db.caktoWebhookEvent.findUnique({ where: { eventKey } });
  if (existing) return existing;
  try {
    return await db.caktoWebhookEvent.create({ data: { eventKey, providerEventId, eventType, productId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return db.caktoWebhookEvent.findUniqueOrThrow({ where: { eventKey } });
    }
    throw error;
  }
}

async function setCaktoPremium(userId: string, billingId: string, active: boolean) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const currentId = user.privateMetadata.caktoBillingSubscriptionId;
  if (active) {
    if (currentId !== billingId || user.publicMetadata.subscriptionPlan !== "premium") {
      await client.users.updateUser(userId, {
        privateMetadata: { caktoBillingSubscriptionId: billingId },
        publicMetadata: { subscriptionPlan: "premium" },
      });
    }
  } else if (currentId === billingId) {
    await client.users.updateUser(userId, {
      privateMetadata: { caktoBillingSubscriptionId: null },
      publicMetadata: { subscriptionPlan: null },
    });
  }
}

async function emailBelongsToUser(userId: string, email: unknown): Promise<boolean> {
  if (typeof email !== "string" || !email.includes("@")) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const normalized = email.trim().toLowerCase();
  return user.emailAddresses.some((entry) => entry.emailAddress.trim().toLowerCase() === normalized);
}

async function markIgnored(eventId: string) {
  await db.caktoWebhookEvent.update({ where: { id: eventId }, data: { outcome: "IGNORED", processedAt: new Date() } });
}

async function processOrder(eventType: string, rawOrder: unknown): Promise<void> {
  if (!isObject(rawOrder)) return;
  const order = rawOrder as CaktoOrder;
  const providerEventId = typeof order.id === "string" ? order.id : null;
  if (!providerEventId || !knownEvents.has(eventType)) return;

  const productId = typeof order.product?.id === "string" ? order.product.id : null;
  const event = await getOrCreateEvent(eventType, providerEventId, productId);
  if (event.processedAt) return;

  if (!matchesCaktoPlan({ productId: order.product?.id, productType: order.product?.type, offerId: order.offer?.id,
    currency: order.offer?.currency }) || typeof order.callback !== "string" || !/^[A-Za-z0-9._~-]{1,255}$/.test(order.callback)) {
    await markIgnored(event.id);
    return;
  }

  const record = await db.billingSubscription.findFirst({
    where: { provider: "CAKTO", caktoCallbackToken: order.callback, caktoProductId: productId, caktoOfferId: order.offer?.id as string },
  });
  if (!record) {
    await markIgnored(event.id);
    return;
  }

  const eventAt = parseEventDate(order, eventType);
  if (!eventAt) {
    await markIgnored(event.id);
    return;
  }

  const decision = getCaktoEventDecision(eventType, order.status);
  let nextStatus: "ACTIVE" | "PAUSED" | "CANCELLED" | "FAILED" | null = null;
  const shouldGrant = decision === "ACTIVATE";
  const shouldRevoke = decision === "REVOKE" || decision === "PAUSE";

  if (decision === "ACTIVATE") {
    if (!matchesCaktoPayment({
      amount: order.amount,
      baseAmount: order.baseAmount,
      discount: order.discount,
      expectedBaseAmount: Number(record.baseAmount),
    })) {
      await markIgnored(event.id);
      return;
    }
    if (!await emailBelongsToUser(record.userId, order.customer?.email)) {
      await markIgnored(event.id);
      return;
    }
    nextStatus = "ACTIVE";
  } else if (decision === "REVOKE") {
    nextStatus = "CANCELLED";
  } else if (decision === "PAUSE") {
    nextStatus = "PAUSED";
  } else if (decision === "FAIL") {
    nextStatus = "FAILED";
  }

  if (!nextStatus) {
    await markIgnored(event.id);
    return;
  }

  const applied = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${record.id}, 0))`;
    const current = await tx.billingSubscription.findUnique({ where: { id: record.id } });
    if (!current || current.provider !== "CAKTO") {
      await tx.caktoWebhookEvent.update({ where: { id: event.id }, data: { outcome: "IGNORED", processedAt: new Date() } });
      return false;
    }
    if (!isNewerCaktoEvent(current.providerEventAt, eventAt)) {
      if (current.providerEventAt?.getTime() === eventAt.getTime() && current.status === nextStatus) return true;
      await tx.caktoWebhookEvent.update({ where: { id: event.id }, data: { outcome: "IGNORED", processedAt: new Date() } });
      return false;
    }
    await tx.billingSubscription.update({
      where: { id: current.id },
      data: {
        status: nextStatus,
        providerEventAt: eventAt,
        ...(shouldGrant && !current.firstPaymentApprovedAt ? {
          firstPaymentId: providerEventId,
          caktoOrderId: providerEventId,
          firstPaymentApprovedAt: eventAt,
        } : {}),
      },
    });
    return true;
  });

  if (!applied) return;
  if (shouldGrant) await setCaktoPremium(record.userId, record.id, true);
  if (shouldRevoke) await setCaktoPremium(record.userId, record.id, false);
  await db.caktoWebhookEvent.update({ where: { id: event.id }, data: { outcome: "PROCESSED", processedAt: new Date() } });
}

export async function processCaktoWebhook(payload: CaktoWebhook): Promise<void> {
  if (typeof payload.event !== "string" || !knownEvents.has(payload.event)) return;
  const items = Array.isArray(payload.data) ? payload.data : [payload.data];
  for (const item of items) await processOrder(payload.event, item);
}
