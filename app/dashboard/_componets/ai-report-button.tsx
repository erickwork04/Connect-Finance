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
import { useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AiReportButtonProps {
  month: string;
}

const AiReportButton = ({ month }: AiReportButtonProps) => {
  const router = useRouter();

  const [report, setReport] = useState<string | null>(null);
  const [reportIsLoanding, setReportIsLoading] = useState(false);

  const handleGenerateAiReportClick = async () => {
    try {
      setReportIsLoading(true);

      const result = await generateAiReport({ month });

      if (!result.success) {
        if (result.code === "SUBSCRIPTION_REQUIRED") {
          toast.error(result.message, {
            action: {
              label: "Ver Premium",
              onClick: () => router.push("/subscription"),
            },
          });

          return;
        }

        if (result.code === "UNAUTHORIZED") {
          toast.error(result.message);
          router.push("/login");
          return;
        }

        if (result.code === "INVALID_DATA") {
          toast.error(result.message);
          return;
        }

        toast.error(result.message);
        return;
      }

      setReport(result.report);
    } catch (error) {
      console.error("[AI Report Button] Unexpected error:", error);

      toast.error(
        "Não foi possível gerar o relatório. Tente novamente em alguns instantes.",
      );
    } finally {
      setReportIsLoading(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setReport(null);
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

      <DialogContent className="max-w-[600px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Relatório IA</DialogTitle>

          <DialogDescription>
            Use inteligência artificial para gerar um relatório com insights
            sobre suas finanças.
          </DialogDescription>
        </DialogHeader>

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
            {reportIsLoanding && (
              <Loader2Icon className="animate-spin" />
            )}

            {reportIsLoanding ? "Gerando..." : "Gerar Relatório"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiReportButton;