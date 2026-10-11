export type CaktoEventDecision = "ACTIVATE" | "REVOKE" | "PAUSE" | "FAIL";

const paidEvents = new Set(["purchase_approved", "subscription_renewed", "subscription_resumed", "subscription_late_recovered"]);
const canceledEvents = new Set(["refund", "chargeback", "subscription_canceled"]);
const pausedEvents = new Set(["subscription_paused", "subscription_late", "subscription_renewal_refused"]);

export function getCaktoEventDecision(eventType: string, paymentStatus: unknown): CaktoEventDecision | null {
  if (paidEvents.has(eventType)) return paymentStatus === "paid" ? "ACTIVATE" : null;
  if (canceledEvents.has(eventType)) return "REVOKE";
  if (pausedEvents.has(eventType)) return "PAUSE";
  if (eventType === "purchase_refused") return "FAIL";
  return null;
}

export function matchesCaktoPlan(input: {
  productId: unknown;
  productType: unknown;
  offerId: unknown;
  currency: unknown;
  expectedProductId?: string;
  expectedOfferId?: string;
}): boolean {
  const expectedProductId = input.expectedProductId ?? process.env.CAKTO_PREMIUM_PRODUCT_ID;
  const expectedOfferId = input.expectedOfferId ?? process.env.CAKTO_PREMIUM_OFFER_ID;
  return Boolean(expectedProductId && expectedOfferId &&
    input.productId === expectedProductId && input.productType === "subscription" &&
    input.offerId === expectedOfferId && input.currency === "BRL");
}

function moneyToCents(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100);
  if (typeof value === "string" && /^\d+(?:\.\d{1,2})?$/.test(value)) return Math.round(Number(value) * 100);
  return null;
}

export function matchesCaktoPayment(input: {
  amount: unknown;
  baseAmount: unknown;
  discount: unknown;
  expectedBaseAmount: number;
}): boolean {
  const amountCents = moneyToCents(input.amount);
  const baseAmountCents = moneyToCents(input.baseAmount);
  const discountCents = input.discount == null ? 0 : moneyToCents(input.discount);
  const expectedBaseCents = moneyToCents(input.expectedBaseAmount);
  if (amountCents === null || baseAmountCents === null || discountCents === null || expectedBaseCents === null) return false;
  return expectedBaseCents > 0 && amountCents > 0 && discountCents >= 0 &&
    baseAmountCents === expectedBaseCents && amountCents + discountCents === baseAmountCents;
}

export function isNewerCaktoEvent(existing: Date | null, incoming: Date): boolean {
  return !existing || incoming.getTime() > existing.getTime();
}

export function caktoEventKey(eventType: string, providerEventId: string): string {
  return `${eventType}:${providerEventId}`;
}
