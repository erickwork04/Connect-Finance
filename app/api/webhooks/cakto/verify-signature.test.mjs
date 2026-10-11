import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { verifyCaktoSignature } from "./verify-signature.ts";

const secret = "cakto-test-secret";
const now = 1_800_000_000_000;
const timestamp = String(Math.floor(now / 1000));
const rawBody = '{"event":"purchase_approved","data":{"id":"order-1"}}';
const digest = createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest("hex");
const valid = { rawBody, timestamp, signature: `v1=${digest}`, secret, now };

test("accepts the documented HMAC for the exact raw body", () => {
  assert.equal(verifyCaktoSignature(valid), true);
});

test("rejects modified bodies, signatures, and secrets", () => {
  assert.equal(verifyCaktoSignature({ ...valid, rawBody: `${rawBody} ` }), false);
  assert.equal(verifyCaktoSignature({ ...valid, signature: `v1=${"0".repeat(64)}` }), false);
  assert.equal(verifyCaktoSignature({ ...valid, secret: "wrong-secret" }), false);
});

test("rejects missing, malformed, duplicate, and stale headers", () => {
  assert.equal(verifyCaktoSignature({ ...valid, timestamp: null }), false);
  assert.equal(verifyCaktoSignature({ ...valid, signature: "v2=not-supported" }), false);
  assert.equal(verifyCaktoSignature({ ...valid, signature: `${valid.signature},${valid.signature}` }), false);
  assert.equal(verifyCaktoSignature({ ...valid, now: now + 301_000 }), false);
});
