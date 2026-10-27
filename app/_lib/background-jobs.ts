import { Prisma, type BackgroundJob, type BackgroundJobType } from "@prisma/client";
import { db } from "@/app/_lib/prisma";
import { runClaimedJob } from "./job-runner";
import { generateAiReportForUser } from "@/app/dashboard/_componets/_actions/generat-ai-report/report-service";
import { processCaktoWebhook } from "@/app/subscription/_lib/cakto-events";

const MAX_ATTEMPTS = 3;
const LEASE_MS = 2 * 60_000;

export async function enqueueBackgroundJob(input: {
  type: BackgroundJobType;
  userId?: string | null;
  idempotencyKey: string;
  payload: Prisma.InputJsonValue;
}): Promise<BackgroundJob> {
  try {
    const job = await db.backgroundJob.create({
      data: { type: input.type, userId: input.userId ?? null, idempotencyKey: input.idempotencyKey, payload: input.payload },
    });
    console.info(JSON.stringify({ event: "background_job_enqueued", jobId: job.id, type: job.type }));
    return job;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await db.backgroundJob.findUniqueOrThrow({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing.status === "FAILED") {
        await db.backgroundJob.updateMany({
          where: { id: existing.id, status: "FAILED" },
          data: { status: "QUEUED", progress: 0, attemptCount: 0, availableAt: new Date(), leaseUntil: null, completedAt: null, lastErrorCode: null, result: Prisma.DbNull },
        });
        return db.backgroundJob.findUniqueOrThrow({ where: { id: existing.id } });
      }
      return existing;
    }
    throw error;
  }
}

async function claimNextJob(): Promise<BackgroundJob | null> {
  const now = new Date();
  const retentionCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60_000);
  await db.backgroundJob.deleteMany({ where: { status: { in: ["SUCCEEDED", "FAILED"] }, completedAt: { lt: retentionCutoff } } });
  await db.backgroundJob.updateMany({
    where: { status: "RUNNING", leaseUntil: { lte: now }, attemptCount: { gte: MAX_ATTEMPTS } },
    data: { status: "FAILED", completedAt: now, leaseUntil: null, lastErrorCode: "LEASE_EXPIRED" },
  });
  const candidate = await db.backgroundJob.findFirst({
    where: {
      attemptCount: { lt: MAX_ATTEMPTS },
      OR: [
        { status: "QUEUED", availableAt: { lte: now } },
        { status: "RUNNING", leaseUntil: { lte: now } },
      ],
    },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
  });
  if (!candidate) return null;
  const eligible = candidate.status === "QUEUED"
    ? { id: candidate.id, status: "QUEUED" as const, attemptCount: candidate.attemptCount, availableAt: { lte: now } }
    : { id: candidate.id, status: "RUNNING" as const, attemptCount: candidate.attemptCount, leaseUntil: { lte: now } };
  const claimed = await db.backgroundJob.updateMany({
    where: eligible,
    data: { status: "RUNNING", attemptCount: { increment: 1 }, leaseUntil: new Date(now.getTime() + LEASE_MS), startedAt: candidate.startedAt ?? now },
  });
  if (!claimed.count) return null;
  return db.backgroundJob.findUnique({ where: { id: candidate.id } });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function executeJob(job: BackgroundJob): Promise<void> {
  const outcome = await runClaimedJob({
    id: job.id,
    type: job.type,
    userId: job.userId,
    payload: job.payload,
    attemptCount: job.attemptCount,
  }, {
    setProgress: async (progress) => {
      await db.backgroundJob.updateMany({ where: { id: job.id, status: "RUNNING" }, data: { progress } });
    },
    process: async (progress) => {
      if (job.type === "AI_REPORT") {
        if (!job.userId || !isRecord(job.payload) || typeof job.payload.month !== "string") throw Object.assign(new Error(), { code: "INVALID_JOB_PAYLOAD" });
        await progress(20);
        const storedReport = isRecord(job.result) && typeof job.result.report === "string" ? job.result.report : null;
        const report = storedReport ?? await generateAiReportForUser(job.userId, job.payload.month, async (generatedReport) => {
          await db.backgroundJob.updateMany({ where: { id: job.id, status: "RUNNING" }, data: { result: { report: generatedReport } } });
        });
        return { report };
      }
      if (job.type === "CAKTO_WEBHOOK") {
        if (!isRecord(job.payload) || typeof job.payload.event !== "string" || job.payload.data === undefined) throw Object.assign(new Error(), { code: "INVALID_JOB_PAYLOAD" });
        await progress(20);
        await processCaktoWebhook(job.payload as { event: string; data: unknown });
        await progress(90);
        return { processed: true };
      }
      throw Object.assign(new Error(), { code: "UNKNOWN_JOB_TYPE" });
    },
    succeed: async (result) => {
      const finishedAt = new Date();
      await db.backgroundJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data: { status: "SUCCEEDED", result: toJson(result), progress: 100, completedAt: finishedAt, leaseUntil: null, lastErrorCode: null },
      });
    },
    retryOrFail: async (errorCode, terminal, delayMs) => {
      await db.backgroundJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data: {
          status: terminal ? "FAILED" : "QUEUED",
          availableAt: new Date(Date.now() + delayMs),
          completedAt: terminal ? new Date() : null,
          leaseUntil: null,
          lastErrorCode: errorCode,
        },
      });
    },
    log: (event, data) => console.info(JSON.stringify({ event, ...data })),
    maxAttempts: MAX_ATTEMPTS,
    isTerminalError: (error) => typeof error === "object" && error !== null && "code" in error &&
      (error.code === "INVALID_JOB_PAYLOAD" || error.code === "SUBSCRIPTION_REQUIRED" || error.code === "UNKNOWN_JOB_TYPE"),
  });
  if (outcome === "SUCCEEDED") return;
}

export async function processNextBackgroundJob(): Promise<{ processed: boolean; jobId?: string }> {
  const job = await claimNextJob();
  if (!job) return { processed: false };
  await executeJob(job);
  return { processed: true, jobId: job.id };
}
