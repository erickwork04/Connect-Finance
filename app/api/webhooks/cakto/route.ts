import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processCaktoWebhook } from "@/app/subscription/_lib/cakto-events";
import { verifyCaktoSignature } from "./verify-signature";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CAKTO_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Cakto webhook is not configured" }, { status: 503 });

  const rawBody = await request.text();
  if (!verifyCaktoSignature({
    rawBody,
    timestamp: request.headers.get("x-cakto-timestamp"),
    signature: request.headers.get("x-cakto-signature"),
    secret,
  })) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid webhook body" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid webhook body" }, { status: 400 });
  }

  const body = payload as { secret?: unknown; event?: unknown; data?: unknown };
  const receivedSecret = typeof body.secret === "string" ? Buffer.from(body.secret) : Buffer.alloc(0);
  const expectedSecret = Buffer.from(secret);
  const bodySecretIsValid = receivedSecret.length === expectedSecret.length && timingSafeEqual(receivedSecret, expectedSecret);
  if (!bodySecretIsValid ||
      typeof body.event !== "string" || body.data === undefined) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  try {
    await processCaktoWebhook(body);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Cakto webhook processing failed", { code: typeof error === "object" && error && "code" in error ? error.code : "unknown" });
    return NextResponse.json({ error: "Could not process Cakto webhook" }, { status: 500 });
  }
}
