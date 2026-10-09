import assert from "node:assert/strict";
import test from "node:test";
import { getPaymentFinalization, shouldUpdateClerkPremium } from "./payment-finalization.ts";

const fresh = (status, options = {}) => getPaymentFinalization({
  status,
  firstPaymentAlreadyRecorded: false,
  couponReserved: true,
  firstCycleOnly: false,
  couponRestored: false,
  ...options,
});

test("assinatura ACTIVE continua ativa e garante Premium após cobrança aprovada", () => {
  assert.deepEqual(fresh("ACTIVE"), {
    shouldRecordPayment: true,
    nextStatus: "ACTIVE",
    shouldGrantPremium: true,
    shouldConsumeCoupon: true,
    shouldRestorePrice: false,
  });
});

test("cobrança atrasada registra histórico sem reativar assinatura CANCELLED", () => {
  assert.deepEqual(fresh("CANCELLED"), {
    shouldRecordPayment: true,
    nextStatus: "CANCELLED",
    shouldGrantPremium: false,
    shouldConsumeCoupon: true,
    shouldRestorePrice: false,
  });
});

test("webhook duplicado não registra cobrança, uso ou restauração outra vez", () => {
  const result = getPaymentFinalization({
    status: "ACTIVE",
    firstPaymentAlreadyRecorded: true,
    couponReserved: false,
    firstCycleOnly: true,
    couponRestored: true,
  });
  assert.equal(result.shouldRecordPayment, false);
  assert.equal(result.shouldConsumeCoupon, false);
  assert.equal(result.shouldRestorePrice, false);
  // A atualização de metadata do Clerk é idempotente e só é escrita se divergir.
  assert.equal(result.shouldGrantPremium, true);
  assert.equal(shouldUpdateClerkPremium("mp-sub", "mp-sub", "premium", true), false);
});

test("firstCycleOnly restaura o preço ativo, mas não restaura nem reativa cancelada", () => {
  const active = fresh("PENDING", { firstCycleOnly: true });
  assert.equal(active.nextStatus, "ACTIVE");
  assert.equal(active.shouldRestorePrice, true);
  assert.equal(active.shouldGrantPremium, true);

  const canceled = fresh("CANCELLED", { firstCycleOnly: true });
  assert.equal(canceled.nextStatus, "CANCELLED");
  assert.equal(canceled.shouldRestorePrice, false);
  assert.equal(canceled.shouldGrantPremium, false);
});

test("nova assinatura tem decisão própria após cancelamento da anterior", () => {
  const oldSubscription = fresh("CANCELLED", { couponReserved: false });
  const newSubscription = fresh("PENDING", { couponReserved: false });

  assert.equal(oldSubscription.nextStatus, "CANCELLED");
  assert.equal(oldSubscription.shouldGrantPremium, false);
  assert.equal(newSubscription.nextStatus, "ACTIVE");
  assert.equal(newSubscription.shouldGrantPremium, true);
});

test("atualização do Clerk só escreve quando o estado diverge e respeita o ID da assinatura", () => {
  assert.equal(shouldUpdateClerkPremium("mp-new", "mp-new", "premium", true), false);
  assert.equal(shouldUpdateClerkPremium("mp-old", "mp-new", null, true), true);
  assert.equal(shouldUpdateClerkPremium("mp-new", "mp-old", "premium", false), false);
  assert.equal(shouldUpdateClerkPremium("mp-old", "mp-old", "premium", false), true);
});
