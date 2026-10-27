import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { after } from "next/server";
import type { Prisma } from "@prisma/client";
import { enqueueBackgroundJob, processNextBackgroundJob } from "@/app/_lib/background-jobs";
import { verifyCaktoSignature } from "./verify-signature";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.CAKTO_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Cakto webhook is not configured" }, { status: 503 });

  const rawBody = await request.text();
  if (rawBody.length > 1024 * 1024) return NextResponse.json({ error: "Webhook payload is too large" }, { status: 413 });
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
    const items = Array.isArray(body.data) ? body.data : [body.data];
    if (items.length > 100) return NextResponse.json({ error: "Too many webhook items" }, { status: 413 });
    const jobs = await Promise.all(items.map(async (item) => {
      const providerId = typeof item === "object" && item !== null && !Array.isArray(item) && "id" in item && typeof item.id === "string"
        ? item.id
        : createHash("sha256").update(JSON.stringify(item)).digest("hex");
      const idempotencyKey = `cakto:${createHash("sha256").update(`${body.event}:${providerId}`).digest("hex")}`;
      return enqueueBackgroundJob({
        type: "CAKTO_WEBHOOK",
        idempotencyKey,
        payload: { event: body.event, data: item } as Prisma.InputJsonValue,
      });
    }));
    console.info(JSON.stringify({ event: "cakto_webhook_queued", count: jobs.length }));
    if (jobs.some((job) => job.status === "QUEUED")) {
      after(async () => {
        try { await processNextBackgroundJob(); }
        catch (error) {
          const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "unknown";
          console.error(JSON.stringify({ event: "background_job_dispatch_failed", code }));
        }
      });
    }
    return NextResponse.json({ received: true, queued: jobs.length }, { status: 202 });
  } catch (error) {
    console.error("Cakto webhook processing failed", { code: typeof error === "object" && error && "code" in error ? error.code : "unknown" });
    return NextResponse.json({ error: "Could not process Cakto webhook" }, { status: 500 });
  }
}
