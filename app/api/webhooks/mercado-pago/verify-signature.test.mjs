import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyMercadoPagoSignature } from "./verify-signature.ts";

const secret = "test-webhook-secret";
const requestId = "request-123";
const dataId = "SUB123";
const timestamp = "1704908010";
const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
const hash = createHmac("sha256", secret).update(manifest).digest("hex");
const valid = {
  signature: `ts=${timestamp},v1=${hash}`,
  requestId,
  dataId,
  secret,
};

test("aceita a assinatura HMAC-SHA256 do manifesto oficial", () => {
  assert.equal(verifyMercadoPagoSignature(valid), true);
});

test("rejeita assinatura, request-id e data.id adulterados", () => {
  assert.equal(verifyMercadoPagoSignature({ ...valid, signature: `ts=${timestamp},v1=${"0".repeat(64)}` }), false);
  assert.equal(verifyMercadoPagoSignature({ ...valid, requestId: "other-request" }), false);
  assert.equal(verifyMercadoPagoSignature({ ...valid, dataId: "OTHER-SUB" }), false);
});

test("rejeita headers ausentes, malformados e campos duplicados", () => {
  assert.equal(verifyMercadoPagoSignature({ ...valid, signature: null }), false);
  assert.equal(verifyMercadoPagoSignature({ ...valid, requestId: null }), false);
  assert.equal(verifyMercadoPagoSignature({ ...valid, dataId: null }), false);
  assert.equal(verifyMercadoPagoSignature({ ...valid, signature: `${valid.signature},ts=${timestamp}` }), false);
  assert.equal(verifyMercadoPagoSignature({ ...valid, signature: `ts=invalid,v1=${hash}` }), false);
  assert.equal(verifyMercadoPagoSignature({ ...valid, dataId: "SUB123;ts=1" }), false);
});
