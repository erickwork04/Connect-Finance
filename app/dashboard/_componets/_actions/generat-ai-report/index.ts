"use server";

import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { enqueueBackgroundJob, processNextBackgroundJob } from "@/app/_lib/background-jobs";
import { getPlanPermissions } from "@/app/_lib/plan-permissions";
import { generateAiReportSchema } from "./schema";

export type GenerateAiReportResult =
  | { success: true; jobId: string; status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" }
  | { success: false; code: "UNAUTHORIZED" | "SUBSCRIPTION_REQUIRED" | "INVALID_DATA" | "JOB_ERROR"; message: string };

export async function generateAiReport({ month, requestId }: { month: string; requestId: string }): Promise<GenerateAiReportResult> {
  const validation = generateAiReportSchema.safeParse({ month });
  if (!validation.success || !/^[0-9a-f-]{36}$/i.test(requestId)) {
    return { success: false, code: "INVALID_DATA", message: "Os dados do relatório são inválidos." };
  }
  const { userId } = await auth();
  if (!userId) return { success: false, code: "UNAUTHORIZED", message: "Sua sessão expirou. Entre novamente para continuar." };

  const permissions = await getPlanPermissions(userId);
  if (!permissions.isPremium) {
    return { success: false, code: "SUBSCRIPTION_REQUIRED", message: "Você não possui o plano Premium. Assine para gerar relatórios com IA." };
  }

  try {
    const job = await enqueueBackgroundJob({
      type: "AI_REPORT",
      userId,
      idempotencyKey: `ai-report:${userId}:${requestId}`,
      payload: { month: validation.data.month },
    });
    if (job.status === "QUEUED") after(async () => { await processNextBackgroundJob(); });
    return { success: true, jobId: job.id, status: job.status };
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "unknown";
    console.error(JSON.stringify({ event: "ai_report_enqueue_failed", code }));
    return { success: false, code: "JOB_ERROR", message: "Não foi possível iniciar o relatório. Tente novamente." };
  }
}
