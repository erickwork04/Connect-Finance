import assert from "node:assert/strict";
import { test } from "node:test";
import { caktoEventKey, getCaktoEventDecision, isNewerCaktoEvent, matchesCaktoPayment, matchesCaktoPlan } from "./cakto-event-policy.ts";

test("only paid, recognized subscription events activate Premium", () => {
  assert.equal(getCaktoEventDecision("purchase_approved", "paid"), "ACTIVATE");
  assert.equal(getCaktoEventDecision("subscription_renewed", "paid"), "ACTIVATE");
  assert.equal(getCaktoEventDecision("purchase_approved", "waiting_payment"), null);
  assert.equal(getCaktoEventDecision("checkout_abandonment", "paid"), null);
});

test("cancellation, refund, chargeback, and late payment do not activate Premium", () => {
  assert.equal(getCaktoEventDecision("refund", "refunded"), "REVOKE");
  assert.equal(getCaktoEventDecision("chargeback", "chargedback"), "REVOKE");
  assert.equal(getCaktoEventDecision("subscription_canceled", "canceled"), "REVOKE");
  assert.equal(getCaktoEventDecision("subscription_late", "waiting_payment"), "PAUSE");
  assert.equal(getCaktoEventDecision("purchase_refused", "refused"), "FAIL");
});

test("events for another product, non-subscription offer, or currency are rejected", () => {
  const valid = { productId: "premium", productType: "subscription", offerId: "monthly", currency: "BRL", expectedProductId: "premium", expectedOfferId: "monthly" };
  assert.equal(matchesCaktoPlan(valid), true);
  assert.equal(matchesCaktoPlan({ ...valid, productId: "other" }), false);
  assert.equal(matchesCaktoPlan({ ...valid, offerId: "other" }), false);
  assert.equal(matchesCaktoPlan({ ...valid, productType: "unique" }), false);
  assert.equal(matchesCaktoPlan({ ...valid, currency: "USD" }), false);
});

test("Cakto discounts are accepted only when the signed amounts reconcile to the plan price", () => {
  assert.equal(matchesCaktoPayment({ amount: 19.9, baseAmount: 19.9, discount: "0.00", expectedBaseAmount: 19.9 }), true);
  assert.equal(matchesCaktoPayment({ amount: 14.93, baseAmount: 19.9, discount: "4.97", expectedBaseAmount: 19.9 }), true);
  assert.equal(matchesCaktoPayment({ amount: 14.93, baseAmount: 19.9, discount: "4.96", expectedBaseAmount: 19.9 }), false);
  assert.equal(matchesCaktoPayment({ amount: 14.93, baseAmount: 20, discount: "5.07", expectedBaseAmount: 19.9 }), false);
  assert.equal(matchesCaktoPayment({ amount: "14.93", baseAmount: 19.9, discount: 4.97, expectedBaseAmount: 19.9 }), true);
});

test("old and duplicate events cannot move a subscription state backwards", () => {
  const approvedAt = new Date("2026-10-01T12:00:00Z");
  assert.equal(isNewerCaktoEvent(approvedAt, new Date("2026-10-02T12:00:00Z")), true);
  assert.equal(isNewerCaktoEvent(approvedAt, approvedAt), false);
  assert.equal(isNewerCaktoEvent(approvedAt, new Date("2026-09-30T12:00:00Z")), false);
  assert.equal(caktoEventKey("purchase_approved", "order-1"), "purchase_approved:order-1");
});
