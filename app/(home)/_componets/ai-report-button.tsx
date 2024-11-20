"use cliente";

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
import { BotIcon } from "lucide-react";
import { generateAiReport } from "../_actions/generat-ai-report";
import { useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import Markdown from "react-markdown";

interface AiReportButtonProps {
  month: string;
}

const AiReportButton = ({ month }: AiReportButtonProps) => {
  const [report, setReport] = useState<string | null>(null);
  const handleGenerateAiReportClick = async () => {
    try {
      const aiReport = await generateAiReport({ month });
      setReport(aiReport);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          Relatório IA
          <BotIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Relatório IA</DialogTitle>
          <DialogDescription>
            Use inteligência artificial para gerar um relatório com insights
            sobre suas finanças.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="prose max-h[420x] prose-h3:text-wh prose-n4:text-white prose-strong:text-white text-white">
          <Markdown>{report}</Markdown>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleGenerateAiReportClick}>Gerar Relatório</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiReportButton;
