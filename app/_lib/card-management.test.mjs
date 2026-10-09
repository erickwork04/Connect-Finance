import assert from "node:assert/strict";
import test from "node:test";
import { archiveOwnedCreditCard, updateOwnedCreditCard } from "./card-management.ts";
import { canCreateWithinLimit, permissionsForPlan } from "./plan-rules.ts";

const cardChanges = {
  name: "Cartão atualizado",
  brand: "Visa",
  limitTotal: 2500,
  closingDay: 10,
  dueDay: 20,
  isPrimary: true,
};

test("Free and Premium users can edit an owned card without consuming another card slot", async () => {
  for (const isPremium of [false, true]) {
    const calls = [];
    const tx = { creditCard: { updateMany: async (args) => { calls.push(args); return { count: 1 }; } } };
    const permissions = permissionsForPlan(isPremium);

    assert.equal(await updateOwnedCreditCard(tx, "owner-1", "card-1", cardChanges), true);
    assert.equal(calls[0].where.id, "card-1");
    assert.equal(calls[0].where.userId, "owner-1");
    assert.deepEqual(calls[0].data, cardChanges);
    assert.equal(calls.length, 2, "editing a primary card only clears primary on other cards");
    assert.equal(canCreateWithinLimit(1, permissions.creditCardLimit), isPremium);
    assert.equal(calls.some(({ create }) => create), false);
  }
});

test("editing another user's card is rejected by the ownership-scoped update", async () => {
  const calls = [];
  const tx = { creditCard: { updateMany: async (args) => { calls.push(args); return { count: 0 }; } } };
  assert.equal(await updateOwnedCreditCard(tx, "owner-1", "foreign-card", cardChanges), false);
  assert.deepEqual(calls[0].where, { id: "foreign-card", userId: "owner-1", isActive: true });
});

test("card removal archives the owned card and preserves invoice, installment, and transaction data", async () => {
  const calls = [];
  const tx = { creditCard: { updateMany: async (args) => { calls.push(args); return { count: 1 }; } } };
  assert.equal(await archiveOwnedCreditCard(tx, "owner-1", "card-1"), true);
  assert.deepEqual(calls, [{
    where: { id: "card-1", userId: "owner-1", isActive: true },
    data: { isActive: false, isPrimary: false },
  }]);
  assert.equal(calls.some(({ delete: remove }) => remove), false);
});

test("removal of a missing or foreign card does not change records", async () => {
  const tx = { creditCard: { updateMany: async () => ({ count: 0 }) } };
  assert.equal(await archiveOwnedCreditCard(tx, "owner-1", "foreign-card"), false);
});
