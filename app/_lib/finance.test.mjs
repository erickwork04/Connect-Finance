import assert from "node:assert/strict";
import { test } from "node:test";
import { monthlyBalance, percentChange, availableAfterCommitments, creditLimit, outstandingCommitmentAmounts } from "./finance.ts";
import { monthsBetween, shiftYearMonth } from "./month-range.ts";

test("saldo desconta receitas, despesas e investimentos uma vez", () => {
  assert.equal(monthlyBalance(5000, 1200, 300), 3500);
  assert.equal(availableAfterCommitments(3500, [400, 100]), 3000);
  const amounts = outstandingCommitmentAmounts([
    { amount: 400, status: "PENDING", transactionId: null },
    { amount: 100, status: "CONFIRMED", transactionId: null },
    { amount: 200, status: "PAID", transactionId: "transaction-1" },
  ]);
  assert.deepEqual(amounts, [400, 100]);
  assert.equal(availableAfterCommitments(3500, amounts), 3000);
});

test("comparações sem base válida não produzem Infinity ou NaN", () => {
  assert.equal(percentChange(20, 0), null);
  assert.equal(percentChange(120, 100), 20);
  assert.equal(percentChange(80, 100), -20);
});

test("meses e parcelas atravessam o ano", () => {
  assert.equal(shiftYearMonth("2026-01", -1), "2025-12");
  assert.equal(monthsBetween("2025-12", "2026-02"), 2);
});

test("limite do cartão evita divisão por zero", () => {
  assert.deepEqual(creditLimit(1000, 250), { available: 750, percent: 25 });
  assert.deepEqual(creditLimit(0, 0), { available: 0, percent: 0 });
});
