import assert from "node:assert/strict";
import test from "node:test";
import { canCreateWithinLimit, hasPremiumPlan, isActiveCommitment, permissionsForPlan } from "./plan-rules.ts";

test("only Clerk's premium metadata value grants Premium", () => {
  assert.equal(hasPremiumPlan("premium"), true);
  assert.equal(hasPremiumPlan("free"), false);
  assert.equal(hasPremiumPlan(undefined), false);
});

test("Free card and active commitment caps block only new records over the cap", () => {
  assert.equal(canCreateWithinLimit(0, 1), true);
  assert.equal(canCreateWithinLimit(1, 1), false);
  assert.equal(canCreateWithinLimit(2, 3), true);
  assert.equal(canCreateWithinLimit(3, 3), false);
  assert.equal(canCreateWithinLimit(100, null), true);
});

test("Free blocks imports while Premium enables imports and AI reports", () => {
  assert.equal(permissionsForPlan(false).canImportFiles, false);
  assert.equal(permissionsForPlan(true).canImportFiles, true);
  assert.equal(permissionsForPlan(false).isPremium, false);
  assert.equal(permissionsForPlan(true).isPremium, true);
});

test("transaction history remains uncapped", () => {
  assert.equal(canCreateWithinLimit(10_000_000, null), true);
});

test("paid and deleted commitments do not count as active", () => {
  assert.equal(isActiveCommitment("PENDING", null), true);
  assert.equal(isActiveCommitment("CONFIRMED", null), true);
  assert.equal(isActiveCommitment("PAID", null), false);
  assert.equal(isActiveCommitment("PENDING", new Date()), false);
});

test("downgrading applies Free limits without changing existing records; Premium restores unlimited access", () => {
  assert.deepEqual(permissionsForPlan(false), {
    isPremium: false,
    canImportFiles: false,
    creditCardLimit: 1,
    activeCommitmentLimit: 3,
  });
  assert.deepEqual(permissionsForPlan(true), {
    isPremium: true,
    canImportFiles: true,
    creditCardLimit: null,
    activeCommitmentLimit: null,
  });
});
