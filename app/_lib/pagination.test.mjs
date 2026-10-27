import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPage, getPageCount, parsePagination, updatePaginationQuery } from "./pagination.ts";

test("paginação limita tamanhos aceitos e corrige parâmetros inválidos", () => {
  assert.deepEqual(parsePagination("3", "50"), { page: 3, pageSize: 50 });
  assert.deepEqual(parsePagination("-2", "500"), { page: 1, pageSize: 25 });
  assert.deepEqual(parsePagination(["2"], ["10"]), { page: 1, pageSize: 25 });
});

test("página final acompanha o total filtrado sem produzir páginas inexistentes", () => {
  assert.equal(getPageCount(0, 25), 1);
  assert.equal(getPageCount(51, 25), 3);
  assert.equal(clampPage(7, 51, 25), 3);
  assert.equal(clampPage(2, 51, 25), 2);
});

test("alterar parâmetros mantém mês, filtros e outros estados da URL", () => {
  const next = updatePaginationQuery("month=2026-10&search=salario&category=SALARY&page=4", { page: "1", pageSize: "50" });
  assert.equal(next, "month=2026-10&search=salario&category=SALARY&page=1&pageSize=50");
  assert.equal(updatePaginationQuery(next, { search: null }), "month=2026-10&category=SALARY&page=1&pageSize=50");
});
