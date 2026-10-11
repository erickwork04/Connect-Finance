import { createHmac, timingSafeEqual } from "node:crypto";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

export function verifyCaktoSignature(input: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secret: string;
  now?: number;
}): boolean {
  const { rawBody, timestamp, signature, secret, now = Date.now() } = input;
  if (!timestamp || !/^\d{1,12}$/.test(timestamp) || !signature || !secret) return false;
  if (Math.abs(Math.floor(now / 1000) - Number(timestamp)) > TIMESTAMP_TOLERANCE_SECONDS) return false;

  const v1Signatures = signature.split(",").map((part) => part.trim()).filter((part) => part.startsWith("v1="));
  if (v1Signatures.length !== 1 || !/^v1=[a-fA-F0-9]{64}$/.test(v1Signatures[0])) return false;

  const expected = `v1=${createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest("hex")}`;
  const receivedBytes = Buffer.from(v1Signatures[0]);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}
