"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { deleteCommitment, endRecurringCommitment, getCommitmentsForMonth, type CommitmentManagerData } from "@/app/_actions/dashboard-v2";
import { CommitmentEditForm, CommitmentForm, CommitmentLinkForm, ConfirmCommitmentForm } from "@/app/_components/finance-forms";
import { formatCurrency } from "@/app/_utils/currency";
import { formatYearMonthPtBr } from "@/app/_lib/month-range";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/_components/ui/alert-dialog";

export default function CommitmentsManager({ month, initialData }: { month: string; initialData: CommitmentManagerData | null }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const refresh = async () => {
    try {
      setData(await getCommitmentsForMonth(month));
      setError("");
      router.refresh();
    } catch {
      setError("Não foi possível atualizar os compromissos. Reabra o painel para tentar novamente.");
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    const formData = new FormData();
    formData.set("commitmentId", id);
    try {
      const result = await deleteCommitment({ message: "", success: false }, formData);
      if (result.success) await refresh();
      else setError(result.message);
    } catch {
      setError("Não foi possível excluir o compromisso. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  const endRecurrence = async (id: string) => {
    setDeletingId(id);
    const formData = new FormData();
    formData.set("recurrenceId", id);
    formData.set("lastMonth", month);
    try {
      const result = await endRecurringCommitment({ message: "", success: false }, formData);
      if (result.success) await refresh();
      else setError(result.message);
    } catch {
      setError("Não foi possível encerrar a recorrência. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  if (data === null) return <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Compromissos indisponíveis no momento.</p>;

  return <div className="min-w-0 space-y-4">
    <h2 className="text-lg font-semibold">Compromissos · {formatYearMonthPtBr(month)}</h2>
    <p className="text-sm leading-5 text-muted-foreground">Compromissos mensais têm status separado em cada mês. Vincule manualmente uma despesa do mesmo mês e valor quando ela for paga; o saldo considera apenas a transação.</p>
    <details className="rounded-xl border border-border bg-white/[.03] p-4">
      <summary className="flex min-h-8 cursor-pointer items-center gap-2 font-semibold text-primary"><Plus aria-hidden="true" className="h-4 w-4" />Adicionar compromisso</summary>
      <div className="mt-4"><CommitmentForm month={month} onSuccess={refresh} /></div>
    </details>
    {error ? <p role="alert" className="text-sm text-rose-400">{error}</p> : null}
    {data.commitments.length === 0 ? <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">Nenhum compromisso registrado neste mês. Use “Adicionar compromisso” para começar.</p> : <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-label="Compromissos do mês">
      {data.commitments.map((item) => {
        const candidates = data.expenses.filter((expense) => Math.abs(expense.amount - item.amount) <= 0.01);
        return <section key={item.id} className="min-w-0 rounded-xl border border-border bg-white/[.03] p-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words font-semibold">{item.description}</h3><p className="mt-1 text-xs text-muted-foreground">Vence {new Date(item.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })} · {item.recurrenceId ? item.recurrenceEndMonth ? "Mensal · encerrada" : "Mensal" : item.recurring ? "Mensal · cadastro anterior" : "Não recorrente"}</p></div><strong className="shrink-0 whitespace-nowrap text-sm tabular-nums">{formatCurrency(item.amount)}</strong></div>
          <div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "PAID" ? "bg-emerald-500/10 text-emerald-300" : item.status === "CONFIRMED" ? "bg-sky-500/10 text-sky-300" : "bg-amber-500/10 text-amber-300"}`}>{item.status === "PENDING" ? "Pendente" : item.status === "CONFIRMED" ? "Confirmado" : "Pago"}</span></div>
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            {item.status === "PENDING" ? <ConfirmCommitmentForm commitmentId={item.id} onSuccess={refresh} /> : null}
            <details><summary className="min-h-11 cursor-pointer py-2 text-sm text-primary">Editar compromisso</summary><div className="mt-3"><CommitmentEditForm key={`${item.id}-${item.dueDate}-${item.amount}-${item.recurring}`} commitment={item} onSuccess={refresh} /></div></details>
            {item.status !== "PAID" ? <details><summary className="min-h-11 cursor-pointer py-2 text-sm text-primary">Vincular despesa paga</summary><div className="mt-3">{candidates.length ? <CommitmentLinkForm commitmentId={item.id} transactions={candidates} onSuccess={refresh} /> : <p className="text-xs text-muted-foreground">Nenhuma despesa não vinculada do mesmo valor neste mês.</p>}</div></details> : null}
            <AlertDialog><AlertDialogTrigger asChild><button type="button" disabled={deletingId === item.id} className="min-h-11 rounded-md px-2 text-sm text-rose-300 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60">Excluir deste mês</button></AlertDialogTrigger>
              <AlertDialogContent className="max-w-[calc(100vw-24px)] sm:max-w-lg"><AlertDialogHeader><AlertDialogTitle>Excluir este compromisso?</AlertDialogTitle><AlertDialogDescription>Esta ocorrência será removida do mês. Os outros meses e a transação vinculada, se houver, serão preservados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void remove(item.id)} className="bg-rose-600 hover:bg-rose-700">Excluir compromisso</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
            {item.recurrenceId && !item.recurrenceEndMonth ? <AlertDialog><AlertDialogTrigger asChild><button type="button" disabled={deletingId === item.recurrenceId} className="min-h-11 rounded-md px-2 text-sm text-amber-300 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60">Encerrar recorrência</button></AlertDialogTrigger>
              <AlertDialogContent className="max-w-[calc(100vw-24px)] sm:max-w-lg"><AlertDialogHeader><AlertDialogTitle>Encerrar a partir do próximo mês?</AlertDialogTitle><AlertDialogDescription>Este mês e os anteriores permanecem. Meses futuros pendentes serão ocultados. Se houver mês futuro confirmado ou pago, a operação será recusada.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void endRecurrence(item.recurrenceId!)}>Encerrar recorrência</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog> : null}
          </div>
        </section>;
      })}
    </div>}
  </div>;
}
