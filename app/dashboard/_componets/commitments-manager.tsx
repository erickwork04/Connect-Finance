"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getCommitmentsForMonth, type CommitmentManagerData } from "@/app/_actions/dashboard-v2";
import { CommitmentEditForm, CommitmentForm, CommitmentLinkForm, ConfirmCommitmentForm } from "@/app/_components/finance-forms";
import { formatCurrency } from "@/app/_utils/currency";

export default function CommitmentsManager({ month, initialData }: { month: string; initialData: CommitmentManagerData | null }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");
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

  if (data === null) return <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Compromissos indisponíveis no momento.</p>;

  return <div className="min-w-0 space-y-4">
    <p className="text-sm leading-5 text-muted-foreground">Pagamentos são vinculados manualmente a uma despesa do mesmo mês e valor. O saldo considera apenas a transação vinculada.</p>
    <details className="rounded-xl border border-border bg-white/[.03] p-4">
      <summary className="flex min-h-8 cursor-pointer items-center gap-2 font-semibold text-primary"><Plus aria-hidden="true" className="h-4 w-4" />Adicionar compromisso</summary>
      <div className="mt-4"><CommitmentForm month={month} onSuccess={refresh} /></div>
    </details>
    {error ? <p role="alert" className="text-sm text-rose-400">{error}</p> : null}
    {data.commitments.length === 0 ? <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">Nenhum compromisso registrado neste mês.</p> : <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1" aria-label="Compromissos do mês">
      {data.commitments.map((item) => {
        const candidates = data.expenses.filter((expense) => Math.abs(expense.amount - item.amount) <= 0.01);
        return <section key={item.id} className="min-w-0 rounded-xl border border-border bg-white/[.03] p-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words font-semibold">{item.description}</h3><p className="mt-1 text-xs text-muted-foreground">Vence {new Date(item.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })} · {item.recurring ? "Fixo" : "Avulso"}</p></div><strong className="shrink-0 text-sm tabular-nums">{formatCurrency(item.amount)}</strong></div>
          <div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "PAID" ? "bg-emerald-500/10 text-emerald-300" : item.status === "CONFIRMED" ? "bg-sky-500/10 text-sky-300" : "bg-amber-500/10 text-amber-300"}`}>{item.status === "PENDING" ? "Pendente" : item.status === "CONFIRMED" ? "Confirmado" : "Pago"}</span></div>
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            {item.status === "PENDING" ? <ConfirmCommitmentForm commitmentId={item.id} onSuccess={refresh} /> : null}
            <details><summary className="min-h-9 cursor-pointer text-sm text-primary">Editar compromisso</summary><div className="mt-3"><CommitmentEditForm key={`${item.id}-${item.dueDate}-${item.amount}-${item.recurring}`} commitment={item} onSuccess={refresh} /></div></details>
            {item.status !== "PAID" ? <details><summary className="min-h-9 cursor-pointer text-sm text-primary">Vincular despesa paga</summary><div className="mt-3">{candidates.length ? <CommitmentLinkForm commitmentId={item.id} transactions={candidates} onSuccess={refresh} /> : <p className="text-xs text-muted-foreground">Nenhuma despesa não vinculada do mesmo valor neste mês.</p>}</div></details> : null}
          </div>
        </section>;
      })}
    </div>}
  </div>;
}
