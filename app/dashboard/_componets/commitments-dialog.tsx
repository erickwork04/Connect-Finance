"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/_components/ui/dialog";
import { getCommitmentsForMonth, type CommitmentManagerData } from "@/app/_actions/dashboard-v2";
import CommitmentsManager from "./commitments-manager";

export default function CommitmentsDialog({ month }: { month: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CommitmentManagerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;
    setLoading(true);
    setError("");
    try {
      setData(await getCommitmentsForMonth(month));
    } catch {
      setError("Não foi possível carregar os compromissos. Feche e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild><button type="button" className="min-h-10 shrink-0 rounded-md px-2 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Gerenciar</button></DialogTrigger>
    <DialogContent className="w-[calc(100%-24px)] max-w-3xl max-h-[min(90vh,840px)] overflow-y-auto p-4 sm:p-6">
      <DialogHeader><DialogTitle>Compromissos do mês</DialogTitle><DialogDescription>{month.slice(5)}/{month.slice(0, 4)} · cadastre, edite e vincule pagamentos.</DialogDescription></DialogHeader>
      {loading ? <p role="status" className="py-8 text-center text-sm text-muted-foreground">Carregando compromissos...</p> : error ? <p role="alert" className="py-5 text-sm text-rose-400">{error}</p> : <CommitmentsManager key={month} month={month} initialData={data} />}
    </DialogContent>
  </Dialog>;
}
