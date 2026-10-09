import assert from "node:assert/strict";
import { test } from "node:test";
import { PREMIUM_BASE_CENTS, calculateCouponPrice, normalizeCouponCode } from "./coupon-pricing.ts";

test("normaliza código sem alterar a regra de preço", () => {
  assert.equal(normalizeCouponCode("  bemvindo50  "), "BEMVINDO50");
  assert.equal(PREMIUM_BASE_CENTS, 1990);
});

test("cupom percentual calcula em centavos com arredondamento", () => {
  assert.deepEqual(calculateCouponPrice(1990, { type: "PERCENTAGE", value: 50 }), { discountCents: 995, finalCents: 995 });
  assert.deepEqual(calculateCouponPrice(1990, { type: "PERCENTAGE", value: 20 }), { discountCents: 398, finalCents: 1592 });
});

test("cupom fixo e limite de valor pagável", () => {
  assert.deepEqual(calculateCouponPrice(1990, { type: "FIXED", value: 5 }), { discountCents: 500, finalCents: 1490 });
  assert.throws(() => calculateCouponPrice(1990, { type: "FIXED", value: 20 }), RangeError);
  assert.throws(() => calculateCouponPrice(1990, { type: "PERCENTAGE", value: 100 }), RangeError);
});
