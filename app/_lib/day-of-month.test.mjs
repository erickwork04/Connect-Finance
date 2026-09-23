import assert from "node:assert/strict";
import { test } from "node:test";
import { isDayOfMonth, selectDayOfMonth } from "./day-of-month.ts";

test("seleciona os limites, altera o dia e preserva valor inicial", () => {
  assert.equal(selectDayOfMonth(undefined, 1), 1);
  assert.equal(selectDayOfMonth(1, 31), 31);
  assert.equal(selectDayOfMonth(15, 20), 20);
  assert.equal(isDayOfMonth(31), true);
});

test("bloqueia dias fora do intervalo e valores não inteiros", () => {
  for (const day of [0, 32, -1, 1.5, NaN, "20", undefined]) assert.equal(isDayOfMonth(day), false);
  assert.equal(selectDayOfMonth(15, 32), 15);
  assert.equal(selectDayOfMonth(15, 0), 15);
});
