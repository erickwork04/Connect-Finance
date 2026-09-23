import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getCurrentMonthRangeLocal,
  getMonthRangeUtc,
  getYearMonthRangeUtc,
  resolveYearMonth,
  formatYearMonthPtBr,
  monthlyDueDate,
} from "./month-range.ts";

test("recorrência mensal preserva o dia original e limita meses curtos", () => {
  assert.equal(monthlyDueDate("2026-01", 31).toISOString(), "2026-01-31T12:00:00.000Z");
  assert.equal(monthlyDueDate("2026-02", 31).toISOString(), "2026-02-28T12:00:00.000Z");
  assert.equal(monthlyDueDate("2026-03", 31).toISOString(), "2026-03-31T12:00:00.000Z");
  assert.equal(monthlyDueDate("2028-02", 29).toISOString(), "2028-02-29T12:00:00.000Z");
  assert.throws(() => monthlyDueDate("2026-13", 10), RangeError);
  assert.throws(() => monthlyDueDate("2026-02", 32), RangeError);
});

test("inclui todo fevereiro em ano bissexto e exclui 1º de março", () => {
  const { gte, lt } = getMonthRangeUtc(2024, "02");
  assert.equal(gte.toISOString(), "2024-02-01T00:00:00.000Z");
  assert.equal(lt.toISOString(), "2024-03-01T00:00:00.000Z");
  assert.ok(new Date("2024-02-29T23:59:59.999Z") >= gte);
  assert.ok(new Date("2024-02-29T23:59:59.999Z") < lt);
  assert.ok(!(new Date("2024-03-01T00:00:00.000Z") < lt));
});

test("fevereiro não bissexto e virada de dezembro", () => {
  assert.equal(getMonthRangeUtc(2025, "02").lt.toISOString(), "2025-03-01T00:00:00.000Z");
  assert.equal(getMonthRangeUtc(2025, "12").lt.toISOString(), "2026-01-01T00:00:00.000Z");
});

test("rejeita meses inválidos", () => {
  for (const month of ["00", "13", "2", "abc"]) {
    assert.throws(() => getMonthRangeUtc(2025, month), RangeError);
  }
});

test("a franquia no fuso local inclui o último instante do mês", () => {
  const { gte, lt } = getCurrentMonthRangeLocal(new Date(2024, 1, 29, 12));
  assert.deepEqual([gte.getFullYear(), gte.getMonth(), gte.getDate()], [2024, 1, 1]);
  assert.deepEqual([lt.getFullYear(), lt.getMonth(), lt.getDate()], [2024, 2, 1]);
  assert.ok(new Date(2024, 1, 29, 23, 59, 59, 999) < lt);
  assert.ok(!(new Date(2024, 2, 1) < lt));
});

test("resolve o mês da URL e preserva o ano escolhido", () => {
  const now = new Date(2026, 8, 19);
  assert.equal(resolveYearMonth("2025-08", now), "2025-08");
  assert.equal(resolveYearMonth("08", now), "2026-08");
  assert.equal(resolveYearMonth(undefined, now), "2026-09");
  assert.equal(resolveYearMonth("2026-13", now), "2026-09");
  assert.equal(resolveYearMonth(["2026-08"], now), "2026-09");
});

test("o intervalo da URL inclui o último dia e respeita a virada de ano", () => {
  const august = getYearMonthRangeUtc("2026-08");
  assert.equal(august.gte.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(august.lt.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.ok(new Date("2026-08-31T23:59:59.999Z") < august.lt);
  assert.equal(getYearMonthRangeUtc("2026-12").lt.toISOString(), "2027-01-01T00:00:00.000Z");
  assert.throws(() => getYearMonthRangeUtc("08"), RangeError);
});

test("rótulo do seletor usa mês e ano em português sem alterar a URL", () => {
  assert.equal(formatYearMonthPtBr("2026-09"), "Setembro de 2026");
  assert.equal(formatYearMonthPtBr("2025-01"), "Janeiro de 2025");
  assert.throws(() => formatYearMonthPtBr("2026-13"), RangeError);
});
