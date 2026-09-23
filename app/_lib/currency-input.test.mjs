import assert from "node:assert/strict";
import { test } from "node:test";
import { appendCurrencyDigit, centsFromAmount, centsFromDigits, decimalFromCents, formatCurrencyCents } from "./currency-input.ts";

test("desloca os dígitos para centavos e formata em pt-BR", () => {
  for (const [digits, expected] of [["1", "R$ 0,01"], ["10", "R$ 0,10"], ["100", "R$ 1,00"], ["1000", "R$ 10,00"], ["10000", "R$ 100,00"]]) {
    assert.equal(formatCurrencyCents(centsFromDigits(digits)), expected);
  }
  assert.equal(appendCurrencyDigit(1234, "5"), 12345);
});

test("edição preserva o valor decimal; limpeza difere de zero", () => {
  assert.equal(formatCurrencyCents(centsFromAmount(1234.56)), "R$ 1.234,56");
  assert.equal(decimalFromCents(centsFromAmount(1234.56)), "1234.56");
  assert.equal(centsFromDigits(""), undefined);
  assert.equal(decimalFromCents(undefined), "");
  assert.equal(formatCurrencyCents(centsFromDigits("0")), "R$ 0,00");
  assert.equal(decimalFromCents(0), "0.00");
});

test("valores grandes continuam seguros e entrada inválida não vira dinheiro", () => {
  assert.equal(formatCurrencyCents(centsFromDigits("999999999999")), "R$ 9.999.999.999,99");
  assert.equal(decimalFromCents(centsFromAmount(9999999999.99)), "9999999999.99");
  assert.equal(centsFromAmount(Number.NaN), undefined);
  assert.equal(centsFromDigits("9999999999999999999"), undefined);
  assert.equal(centsFromDigits("R$ 1.234,56"), 123456);
});
