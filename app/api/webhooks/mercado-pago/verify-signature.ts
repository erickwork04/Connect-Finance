import { createHmac, timingSafeEqual } from "node:crypto";

type SignatureInput = {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
};

export function verifyMercadoPagoSignature({
  signature,
  requestId,
  dataId,
  secret,
}: SignatureInput): boolean {
  if (
    !signature ||
    !requestId ||
    !dataId ||
    !secret ||
    /[;\r\n]/.test(requestId) ||
    /[;\r\n]/.test(dataId)
  ) {
    return false;
  }

  const parts = new Map<string, string>();
  for (const part of signature.split(",")) {
    const separator = part.indexOf("=");
    if (separator < 0) return false;

    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (parts.has(key)) return false;
    parts.set(key, value);
  }

  const timestamp = parts.get("ts");
  const receivedHash = parts.get("v1");
  if (!timestamp || !/^\d+$/.test(timestamp) || !receivedHash || !/^[a-fA-F0-9]{64}$/.test(receivedHash)) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expectedHash = createHmac("sha256", secret).update(manifest).digest();
  const providedHash = Buffer.from(receivedHash, "hex");

  return timingSafeEqual(expectedHash, providedHash);
}
