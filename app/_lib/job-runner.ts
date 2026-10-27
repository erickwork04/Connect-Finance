export type ClaimedBackgroundJob = {
  id: string;
  type: string;
  attemptCount: number;
  userId: string | null;
  payload: unknown;
};

export type JobRunDependencies = {
  process: (progress: (value: number) => Promise<void>) => Promise<unknown>;
  setProgress: (value: number) => Promise<void>;
  succeed: (result: unknown, durationMs: number) => Promise<void>;
  retryOrFail: (errorCode: string, terminal: boolean, delayMs: number) => Promise<void>;
  log: (event: string, data: Record<string, unknown>) => void;
  now?: () => number;
  maxAttempts?: number;
  isTerminalError?: (error: unknown) => boolean;
};

export async function runClaimedJob(job: ClaimedBackgroundJob, dependencies: JobRunDependencies): Promise<"SUCCEEDED" | "REQUEUED" | "FAILED"> {
  const now = dependencies.now ?? Date.now;
  const maxAttempts = dependencies.maxAttempts ?? 3;
  const started = now();
  const base = { jobId: job.id, type: job.type, attempt: job.attemptCount };

  try {
    await dependencies.setProgress(5);
    const result = await dependencies.process(async (value) => {
      const progress = Math.max(5, Math.min(95, Math.round(value)));
      await dependencies.setProgress(progress);
    });
    const durationMs = Math.max(0, now() - started);
    await dependencies.setProgress(100);
    await dependencies.succeed(result, durationMs);
    dependencies.log("background_job_succeeded", { ...base, durationMs });
    return "SUCCEEDED";
  } catch (error) {
    const durationMs = Math.max(0, now() - started);
    const errorCode = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code.slice(0, 80)
      : "JOB_FAILED";
    const terminal = job.attemptCount >= maxAttempts || dependencies.isTerminalError?.(error) === true;
    const delayMs = Math.min(5 * 60_000, 10_000 * 2 ** Math.max(0, job.attemptCount - 1));
    await dependencies.retryOrFail(errorCode, terminal, delayMs);
    dependencies.log(terminal ? "background_job_failed" : "background_job_requeued", { ...base, durationMs, errorCode, delayMs: terminal ? 0 : delayMs });
    return terminal ? "FAILED" : "REQUEUED";
  }
}
