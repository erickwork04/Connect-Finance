import assert from "node:assert/strict";
import { test } from "node:test";
import { computePeriodMetrics, filterTransactionRows } from "./period-metrics.ts";

const rows = [
  { id: "1", name: "Salário", type: "DEPOSIT", category: "SALARY", amount: "1469.32", date: "2026-09-03T12:00:00.000Z" },
  { id: "2", name: "Ônibus", type: "EXPENSE", category: "TRANSPORTATION", amount: "49.12", date: "2026-09-28T12:00:00.000Z" },
  { id: "3", name: "Mercado", type: "EXPENSE", category: "FOOD", amount: "100.88", date: "2026-09-24T12:00:00.000Z" },
  { id: "4", name: "Aplicação", type: "INVESTMENT", category: "OTHER", amount: "200.00", date: "2026-09-15T12:00:00.000Z" },
];

test("agrega uma única lista em centavos e distribui apenas despesas", () => {
  const metrics = computePeriodMetrics(rows);
  assert.equal(metrics.count, 4);
  assert.equal(metrics.revenue, 1469.32);
  assert.equal(metrics.expenses, 150);
  assert.equal(metrics.invested, 200);
  assert.equal(metrics.expenseCount, 2);
  assert.equal(metrics.largestExpense?.name, "Mercado");
  assert.equal(metrics.largestRevenue?.name, "Salário");
  assert.equal(metrics.categories.length, 2);
  assert.equal(metrics.categories.reduce((sum, category) => sum + category.amount, 0), 150);
  assert.equal(metrics.categories.reduce((sum, category) => sum + category.percent, 0), 100);
  assert.equal(metrics.averageTicket, (146932 + 4912 + 10088 + 20000) / 4 / 100);
});

test("busca ignora acentos e combina categoria com recorte local", () => {
  const found = filterTransactionRows(rows, "2026-09", { search: "ONIBUS", category: "TRANSPORTATION", period: "seven" }, new Date(2026, 9, 1));
  assert.deepEqual(found.map((row) => row.id), ["2"]);
  assert.deepEqual(filterTransactionRows(rows, "2026-09", { search: "", category: "FOOD", period: "seven" }, new Date(2026, 9, 1)).map((row) => row.id), ["3"]);
});

test("mês atual ancora os últimos dias em hoje; vazio não inventa indicadores", () => {
  const filtered = filterTransactionRows(rows, "2026-09", { search: "", category: "all", period: "seven" }, new Date(2026, 8, 20));
  assert.deepEqual(filtered.map((row) => row.id), ["4"]);
  const empty = computePeriodMetrics([]);
  assert.equal(empty.averageTicket, 0);
  assert.equal(empty.largestExpense, null);
  assert.deepEqual(empty.categories, []);
});
