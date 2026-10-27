"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { deleteCommitment, endRecurringCommitment, getCommitmentsForMonth, type CommitmentManagerData } from "@/app/_actions/dashboard-v2";
import { CommitmentEditForm, CommitmentForm, CommitmentLinkForm, ConfirmCommitmentForm } from "@/app/_components/finance-forms";
import { formatCurrency } from "@/app/_utils/currency";
import { formatYearMonthPtBr } from "@/app/_lib/month-range";
import PremiumUpgradeDialog from "@/app/_components/premium-upgrade-dialog";
import PaginationControls from "@/app/_components/pagination-controls";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/_components/ui/alert-dialog";

export default function CommitmentsManager({ month, page, pageSize, initialData }: { month: string; page: number; pageSize: number; initialData: CommitmentManagerData | null }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [premiumNoticeOpen, setPremiumNoticeOpen] = useState(false);
  const router = useRouter();

  const refresh = async () => {
    setIsRefreshing(true);
    setRefreshFailed(true);
    setError("");
    try {
      setData(await getCommitmentsForMonth(month, page, pageSize));
      setError("");
      setRefreshFailed(false);
      router.refresh();
    } catch {
      setError("Não foi possível atualizar os compromissos. Reabra o painel para tentar novamente.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const remove = async (id: string) => {
    if (deletingId) return;
    setError("");
    setMutationError("");
    setRefreshFailed(false);
    setDeletingId(id);
    const formData = new FormData();
    formData.set("commitmentId", id);
    try {
      const result = await deleteCommitment({ message: "", success: false }, formData);
      if (result.success) {
        setActiveDialog(null);
        await refresh();
      } else setMutationError(result.message);
    } catch {
      setMutationError("Não foi possível excluir o compromisso. Ele continua nesta lista; tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  const endRecurrence = async (id: string) => {
    if (deletingId) return;
    setError("");
    setMutationError("");
    setRefreshFailed(false);
    setDeletingId(id);
    const formData = new FormData();
    formData.set("recurrenceId", id);
    formData.set("lastMonth", month);
    try {
      const result = await endRecurringCommitment({ message: "", success: false }, formData);
      if (result.success) {
        setActiveDialog(null);
        await refresh();
      } else setMutationError(result.message);
    } catch {
      setMutationError("Não foi possível encerrar a recorrência. O compromisso continua ativo; tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  if (data === null) return <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Compromissos indisponíveis no momento.</p>;

  return <div className="min-w-0 space-y-4">
    <h2 className="text-lg font-semibold">Compromissos · {formatYearMonthPtBr(month)}</h2>
    <p className="text-sm leading-5 text-muted-foreground">Compromissos mensais têm status separado em cada mês. Vincule manualmente uma despesa do mesmo mês e valor quando ela for paga; o saldo considera apenas a transação.</p>
    {data.activeCommitmentLimit !== null ? <p className="text-xs text-muted-foreground">{data.activeCommitmentCount} de {data.activeCommitmentLimit} compromissos ativos no plano Free.</p> : null}
    {data.canCreateCommitment ? <details className="rounded-xl border border-border bg-white/[.03] p-4">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Plus aria-hidden="true" className="h-4 w-4" />Adicionar compromisso</summary>
      <div className="mt-4"><CommitmentForm month={month} onSuccess={refresh} /></div>
    </details> : <button type="button" aria-haspopup="dialog" onClick={() => setPremiumNoticeOpen(true)} className="min-h-11 rounded-lg border border-primary/30 px-4 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Limite do plano gratuito atingido · Conhecer o Premium</button>}
    <PremiumUpgradeDialog open={premiumNoticeOpen} onOpenChange={setPremiumNoticeOpen} title="Limite do plano gratuito atingido" description="O plano Free permite até 3 compromissos financeiros ativos. Assine o Premium para ter compromissos ilimitados." />
    {isRefreshing ? <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Atualizando compromissos...</p> : null}
    {error ? <div role="alert" aria-live="assertive" className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300"><p>{error}</p>{refreshFailed && !isRefreshing ? <button type="button" onClick={() => void refresh()} className="min-h-11 rounded-md px-3 font-semibold text-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Tentar atualizar novamente</button> : null}</div> : null}
    {data.commitments.length === 0 ? <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">Nenhum compromisso registrado neste mês. Use “Adicionar compromisso” para começar.</p> : <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-label="Compromissos do mês">
      {data.commitments.map((item) => {
        const candidates = data.expenses.filter((expense) => Math.abs(expense.amount - item.amount) <= 0.01);
        return <section key={item.id} className="min-w-0 rounded-xl border border-border bg-white/[.03] p-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words font-semibold">{item.description}</h3><p className="mt-1 text-xs text-muted-foreground">Vence {new Date(item.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })} · {item.recurrenceId ? item.recurrenceEndMonth ? "Mensal · encerrada" : "Mensal" : item.recurring ? "Mensal · cadastro anterior" : "Não recorrente"}</p></div><strong className="shrink-0 whitespace-nowrap text-sm tabular-nums">{formatCurrency(item.amount)}</strong></div>
          <div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "PAID" ? "bg-emerald-500/10 text-emerald-300" : item.status === "CONFIRMED" ? "bg-sky-500/10 text-sky-300" : "bg-amber-500/10 text-amber-300"}`}>{item.status === "PENDING" ? "Pendente" : item.status === "CONFIRMED" ? "Confirmado" : "Pago"}</span></div>
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            {item.status === "PENDING" ? <ConfirmCommitmentForm commitmentId={item.id} onSuccess={refresh} /> : null}
            <details><summary className="min-h-11 cursor-pointer rounded-md py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Editar compromisso {item.description}</summary><div className="mt-3"><CommitmentEditForm key={`${item.id}-${item.dueDate}-${item.amount}-${item.recurring}`} commitment={item} onSuccess={refresh} /></div></details>
            {item.status !== "PAID" ? <details><summary className="min-h-11 cursor-pointer rounded-md py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Vincular despesa paga a {item.description}</summary><div className="mt-3">{candidates.length ? <CommitmentLinkForm commitmentId={item.id} transactions={candidates} onSuccess={refresh} /> : <p className="text-xs text-muted-foreground">Nenhuma despesa não vinculada do mesmo valor neste mês.</p>}</div></details> : null}
            <AlertDialog open={activeDialog === `delete:${item.id}`} onOpenChange={(open) => { if (!deletingId) { setActiveDialog(open ? `delete:${item.id}` : null); setMutationError(""); } }}>
              <AlertDialogTrigger asChild><button type="button" aria-label={`Excluir o compromisso ${item.description} deste mês`} title={`Excluir ${item.description} deste mês`} disabled={Boolean(deletingId)} className="min-h-11 rounded-md px-2 text-sm text-rose-300 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60">Excluir deste mês</button></AlertDialogTrigger>
              <AlertDialogContent className="max-w-[calc(100vw-24px)] sm:max-w-lg">
                <AlertDialogHeader><AlertDialogTitle>Excluir {item.description} deste mês?</AlertDialogTitle><AlertDialogDescription>Esta ocorrência será removida do mês. Os outros meses e a transação vinculada, se houver, serão preservados.</AlertDialogDescription></AlertDialogHeader>
                {deletingId === item.id ? <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Excluindo {item.description} deste mês...</p> : null}
                {activeDialog === `delete:${item.id}` && mutationError ? <p role="alert" aria-live="assertive" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{mutationError}</p> : null}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingId === item.id}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={deletingId === item.id} aria-busy={deletingId === item.id} onClick={(event) => { event.preventDefault(); void remove(item.id); }} className="bg-rose-600 hover:bg-rose-700">{deletingId === item.id ? "Excluindo compromisso..." : "Excluir compromisso deste mês"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {item.recurrenceId && !item.recurrenceEndMonth ? <AlertDialog open={activeDialog === `end:${item.recurrenceId}`} onOpenChange={(open) => { if (!deletingId) { setActiveDialog(open ? `end:${item.recurrenceId}` : null); setMutationError(""); } }}>
              <AlertDialogTrigger asChild><button type="button" aria-label={`Encerrar recorrência de ${item.description}`} title={`Encerrar recorrência de ${item.description}`} disabled={Boolean(deletingId)} className="min-h-11 rounded-md px-2 text-sm text-amber-300 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60">Encerrar recorrência</button></AlertDialogTrigger>
              <AlertDialogContent className="max-w-[calc(100vw-24px)] sm:max-w-lg">
                <AlertDialogHeader><AlertDialogTitle>Encerrar a partir do próximo mês?</AlertDialogTitle><AlertDialogDescription>Este mês e os anteriores permanecem. Meses futuros pendentes serão ocultados. Se houver mês futuro confirmado ou pago, a operação será recusada.</AlertDialogDescription></AlertDialogHeader>
                {deletingId === item.recurrenceId ? <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Encerrando recorrência de {item.description}...</p> : null}
                {activeDialog === `end:${item.recurrenceId}` && mutationError ? <p role="alert" aria-live="assertive" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{mutationError}</p> : null}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingId === item.recurrenceId}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={deletingId === item.recurrenceId} aria-busy={deletingId === item.recurrenceId} onClick={(event) => { event.preventDefault(); void endRecurrence(item.recurrenceId!); }}>{deletingId === item.recurrenceId ? "Encerrando recorrência..." : "Encerrar recorrência"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog> : null}
          </div>
        </section>;
      })}
    </div>}
    {data.total > 0 ? <PaginationControls page={page} pageSize={pageSize} total={data.total} noun="compromissos" /> : null}
  </div>;
}
