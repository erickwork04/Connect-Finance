import assert from "node:assert/strict";
import { test } from "node:test";
import { isNavActive, getNavHref, NAV_ITEMS } from "./navigation.ts";

test("aba ativa reconhece rota principal e páginas filhas", () => {
  assert.equal(isNavActive("/dashboard", "/dashboard"), true);
  assert.equal(isNavActive("/transactions/import", "/transactions"), true);
  assert.equal(isNavActive("/subscription", "/subscription"), true);
  assert.equal(isNavActive("/goals", "/goals"), true);
  assert.equal(isNavActive("/cards/details", "/cards"), true);
  assert.equal(isNavActive("/dashboard/commitments", "/dashboard"), true);
  assert.equal(isNavActive("/", "/dashboard"), false);
  assert.equal(isNavActive("/transactions-archive", "/transactions"), false);
});

test("navbar lista as cinco rotas privadas previstas", () => {
  assert.deepEqual(NAV_ITEMS.map(({ href }) => href), [
    "/dashboard", "/transactions", "/cards", "/goals", "/subscription",
  ]);
});

test("navegação preserva apenas mês canônico", () => {
  assert.equal(getNavHref("/dashboard", "2026-08"), "/dashboard?month=2026-08");
  assert.equal(getNavHref("/transactions", "2026-08"), "/transactions?month=2026-08");
  assert.equal(getNavHref("/dashboard", "08"), "/dashboard");
  assert.equal(getNavHref("/dashboard", null), "/dashboard");
});
