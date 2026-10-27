import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

export const dynamic = "force-dynamic";

function matchesSecret(received: string | null, expected: string): boolean {
  if (!received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Worker secret is not configured" }, { status: 503 });
  if (!matchesSecret(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await db.backgroundJob.findUnique({
    where: { id: jobId },
    select: { id: true, type: true, status: true, progress: true, attemptCount: true, availableAt: true, lastErrorCode: true, createdAt: true, completedAt: true },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({
    ...job,
    availableAt: job.availableAt.toISOString(),
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  }, { headers: { "Cache-Control": "no-store" } });
}
