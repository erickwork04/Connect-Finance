"use client";

import { Button } from "@/app/_components/ui/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";

import { BotIcon, Loader2Icon } from "lucide-react";
import { generateAiReport } from "./_actions/generat-ai-report";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getNavHref } from "@/app/_lib/navigation";

interface AiReportButtonProps {
  month: string;
}

const AiReportButton = ({ month }: AiReportButtonProps) => {
  const router = useRouter();

  const [report, setReport] = useState<string | null>(null);
  const [reportIsLoanding, setReportIsLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportJobId, setReportJobId] = useState<string | null>(null);
  const [reportJobStatus, setReportJobStatus] = useState("QUEUED");
  const [reportProgress, setReportProgress] = useState(5);
  const [pollConnectionIssue, setPollConnectionIssue] = useState(false);
  const [pollRetry, setPollRetry] = useState(0);
  const requestIdRef = useRef<string | null>(null);
  const storageKey = `connectfinance.aiReportJob.${month}`;

  useEffect(() => {
    const savedJobId = sessionStorage.getItem(storageKey);
    if (savedJobId) {
      setReportJobId(savedJobId);
      setReportIsLoading(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!reportJobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let requestTimeout: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const poll = async () => {
      try {
        controller = new AbortController();
        requestTimeout = setTimeout(() => controller?.abort(), 10_000);
        const response = await fetch(`/api/jobs/${encodeURIComponent(reportJobId)}`, { cache: "no-store", signal: controller.signal });
        clearTimeout(requestTimeout);
        setPollConnectionIssue(false);
        if (!response.ok) {
          if (response.status === 401 || response.status === 404) {
            setReportError("Não foi possível consultar o estado deste relatório. Entre novamente e tente gerar outro.");
            setReportIsLoading(false);
            setReportJobId(null);
            sessionStorage.removeItem(storageKey);
            return;
          }
          throw new Error("Job status unavailable");
        }
        const job = await response.json() as { status: string; progress: number; result?: { report?: string } | null; error?: string | null };
        if (cancelled) return;
        setReportJobStatus(job.status);
        setReportProgress(job.progress);
        if (job.status === "SUCCEEDED" && typeof job.result?.report === "string") {
          setReport(job.result.report);
          setReportIsLoading(false);
          setReportJobId(null);
          setReportProgress(100);
          requestIdRef.current = null;
          sessionStorage.removeItem(storageKey);
          toast.success("Relatório gerado.");
          return;
        }
        if (job.status === "FAILED") {
          setReportError(job.error || "Não foi possível gerar o relatório. Tente novamente.");
          setReportIsLoading(false);
          setReportJobId(null);
          requestIdRef.current = null;
          sessionStorage.removeItem(storageKey);
          return;
        }
        timer = setTimeout(poll, 1500);
      } catch {
        if (!cancelled) {
          setPollConnectionIssue(true);
          timer = setTimeout(poll, 3000);
        }
      } finally {
        if (requestTimeout) clearTimeout(requestTimeout);
      }
    };
    void poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); if (requestTimeout) clearTimeout(requestTimeout); controller?.abort(); };
  }, [pollRetry, reportJobId, storageKey]);

  const handleGenerateAiReportClick = async () => {
    try {
      setReportError("");
      setPollConnectionIssue(false);
      setReportIsLoading(true);

      requestIdRef.current ??= crypto.randomUUID();
      const result = await generateAiReport({ month, requestId: requestIdRef.current });

      if (!result.success) {
        if (result.code === "SUBSCRIPTION_REQUIRED") {
          setReportIsLoading(false);
          toast.error(result.message, {
            action: {
              label: "Ver Premium",
              onClick: () => router.push(getNavHref("/subscription", month)),
            },
          });

          return;
        }

        if (result.code === "UNAUTHORIZED") {
          setReportIsLoading(false);
          toast.error(result.message);
          router.push("/login");
          return;
        }

        if (result.code === "INVALID_DATA") {
          toast.error(result.message);
          setReportIsLoading(false);
          return;
        }

        setReportError(result.message || "Não foi possível gerar o relatório. Tente novamente.");
        setReportIsLoading(false);
        toast.error(result.message);
        return;
      }

      setReportJobStatus(result.status);
      setReportJobId(result.jobId);
      setReportProgress(5);
      sessionStorage.setItem(storageKey, result.jobId);
    } catch {
      console.error("[AI Report Button] Unexpected error.");
      setReportError("Falha de conexão ao gerar o relatório. Tente novamente.");
      setReportIsLoading(false);

      toast.error(
        "Não foi possível gerar o relatório. Tente novamente em alguns instantes.",
      );
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setReport(null);
          setReportError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 sm:h-10 min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
        >
          Relatório IA
          <BotIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent aria-busy={reportIsLoanding} className="max-w-[600px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Relatório IA</DialogTitle>

          <DialogDescription>
            Use inteligência artificial para gerar um relatório com insights
            sobre suas finanças.
          </DialogDescription>
        </DialogHeader>

        {reportIsLoanding ? <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm text-muted-foreground"><Loader2Icon aria-hidden="true" className="h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none" />{pollConnectionIssue ? "Conexão instável ao consultar o relatório. Tentaremos novamente automaticamente." : "Gerando o relatório financeiro deste mês..."}</div> : null}
        {reportIsLoanding && pollConnectionIssue ? <Button type="button" variant="outline" onClick={() => setPollRetry((attempt) => attempt + 1)} className="min-h-11">Tentar consultar agora</Button> : null}
        {reportIsLoanding ? <div className="space-y-2"><div className="flex justify-between text-xs text-muted-foreground"><span>{reportJobStatus === "QUEUED" ? "Aguardando processamento" : "Analisando suas transações"}</span><span>{reportProgress}%</span></div><div role="progressbar" aria-label="Progresso da geração do relatório" aria-valuemin={0} aria-valuemax={100} aria-valuenow={reportProgress} className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${reportProgress}%` }} /></div></div> : null}
        {reportError ? <div className="space-y-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4" role="alert" aria-live="assertive"><p className="text-sm text-rose-300">{reportError}</p><Button type="button" variant="outline" disabled={reportIsLoanding} onClick={handleGenerateAiReportClick} className="min-h-11">Tentar gerar novamente</Button></div> : null}

        {report && (
          <ScrollArea className="max-h-[420px] prose prose-h3:text-white prose-h4:text-white text-white prose-strong:text-white">
            <Markdown>{report}</Markdown>
          </ScrollArea>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="ghost" className="h-11 sm:h-10">
              Cancelar
            </Button>
          </DialogClose>

          <Button
            onClick={handleGenerateAiReportClick}
            disabled={reportIsLoanding}
            className="h-11 sm:h-10"
          >
            {reportIsLoanding ? "Aguarde: gerando relatório" : "Gerar relatório"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiReportButton;
