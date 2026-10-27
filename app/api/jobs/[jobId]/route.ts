import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { jobId } = await params;
  const job = await db.backgroundJob.findFirst({
    where: { id: jobId, userId },
    select: { id: true, type: true, status: true, progress: true, result: true, lastErrorCode: true, createdAt: true, completedAt: true },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    result: job.status === "SUCCEEDED" ? job.result : null,
    error: job.status === "FAILED" ? "A tarefa falhou após algumas tentativas. Tente novamente." : null,
    errorCode: job.lastErrorCode,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  }, { headers: { "Cache-Control": "no-store" } });
}
