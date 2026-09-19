import assert from "node:assert/strict";
import { test } from "node:test";
import { toTransactionFormValues, toTransactionRow } from "./transaction-row.ts";

for (const source of ["MANUAL", "OFX", "CSV", "CARD_INVOICE"]) {
  test(`edição de transação ${source} preserva valor em reais e data`, () => {
    const original = {
      id: "transaction-id",
      name: "Compra",
      type: "EXPENSE",
      category: "FOOD",
      paymentMethod: "CREDIT_CARD",
      source,
      amount: { toString: () => "1234.56" },
      date: new Date("2026-08-31T12:00:00.000Z"),
    };
    const row = toTransactionRow(original);
    const form = toTransactionFormValues(row);

    assert.equal(row.amount, "1234.56");
    assert.equal(form.amount, 1234.56);
    assert.equal(form.date.toISOString(), original.date.toISOString());
    assert.equal(form.name, original.name);
    assert.equal(row.source, source);
  });
}
