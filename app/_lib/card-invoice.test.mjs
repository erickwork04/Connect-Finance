import assert from "node:assert/strict";
import { test } from "node:test";
import { applyInvoicePayment, invoiceRemainingAmount } from "./card-invoice.ts";

test("pagamento parcial acumula o valor pago e mantém a fatura aberta", () => {
  assert.deepEqual(applyInvoicePayment(850, 0, 300), { paidAmount: 300, status: "OPEN" });
  assert.equal(invoiceRemainingAmount(850, 300, "OPEN"), 550);
});

test("pagamento que quita o saldo marca a fatura como paga", () => {
  assert.deepEqual(applyInvoicePayment(850, 300, 550), { paidAmount: 850, status: "PAID" });
  assert.equal(invoiceRemainingAmount(850, 850, "PAID"), 0);
});

test("recusa pagamento zero, negativo ou acima do saldo em aberto", () => {
  assert.equal(applyInvoicePayment(100, 20, 0), null);
  assert.equal(applyInvoicePayment(100, 20, -1), null);
  assert.equal(applyInvoicePayment(100, 20, 80.01), null);
});
