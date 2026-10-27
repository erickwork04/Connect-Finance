import assert from "node:assert/strict";
import { test } from "node:test";
import { activeInstallmentWindow, MAX_INSTALLMENT_COUNT } from "./installment-window.ts";
import { shiftYearMonth } from "./month-range.ts";

test("o filtro cobre somente parcelamentos ativos no mês e respeita o máximo de 120 parcelas", () => {
  const { OR } = activeInstallmentWindow("2026-10", shiftYearMonth);

  assert.equal(OR.length, MAX_INSTALLMENT_COUNT);
  assert.deepEqual(OR[0], { installmentCount: 1, startMonth: { gte: "2026-10", lte: "2026-10" } });
  assert.deepEqual(OR[9], { installmentCount: 10, startMonth: { gte: "2026-01", lte: "2026-10" } });
  assert.deepEqual(OR[119], { installmentCount: 120, startMonth: { gte: "2016-11", lte: "2026-10" } });
});
