import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processNextBackgroundJob } from "@/app/_lib/background-jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function matchesSecret(received: string | null, expected: string): boolean {
  if (!received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Worker secret is not configured" }, { status: 503 });
  if (!matchesSecret(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processNextBackgroundJob();
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "unknown";
    console.error(JSON.stringify({ event: "background_worker_failed", code }));
    return NextResponse.json({ error: "Worker could not process a job" }, { status: 500 });
  }
}
