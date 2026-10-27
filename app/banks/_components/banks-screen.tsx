"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import ActionTooltip from "@/app/_components/action-tooltip";
import { formatCurrency } from "@/app/_utils/currency";
import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import FeatureEmptyState from "@/app/_components/feature-empty-state";
import { BankAccountArchiveForm, BankAccountEditForm, BankAccountForm } from "@/app/_components/finance-forms";
import PaginationControls from "@/app/_components/pagination-controls";

type Account = { id: string; name: string; institution: string; accountType: string; balance: number; color: string };
const typeLabel: Record<string, string> = { CHECKING: "Conta corrente", SAVINGS: "Poupança", CASH: "Dinheiro", INVESTMENT: "Investimentos", OTHER: "Outra conta" };
type Mode = "create" | "edit" | "archive" | null;

function AccountActions({ account }: { account: Account }) {
  const [mode, setMode] = useState<Mode>(null);
  const router = useRouter();
  const done = () => { setMode(null); router.refresh(); };
  return <>
    <div className="flex gap-2">
      <ActionTooltip content={`Editar conta ${account.name}`}>
        <Button type="button" variant="outline" size="sm" aria-label={`Editar conta ${account.name}`} aria-haspopup="dialog" onClick={() => setMode("edit")}><Pencil aria-hidden="true" className="h-4 w-4" />Editar</Button>
      </ActionTooltip>
      <ActionTooltip content={`Arquivar conta ${account.name}`}>
        <Button type="button" variant="outline" size="icon" aria-label={`Arquivar conta ${account.name}`} aria-haspopup="dialog" onClick={() => setMode("archive")}><Trash2 aria-hidden="true" className="h-4 w-4 text-rose-400" /></Button>
      </ActionTooltip>
    </div>
    <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) setMode(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === "edit" ? `Editar ${account.name}` : `Remover ${account.name}?`}</DialogTitle><DialogDescription>{mode === "edit" ? "Atualize os dados e o saldo desta conta." : "A conta será arquivada e deixará de aparecer entre as contas ativas."}</DialogDescription></DialogHeader>
        {mode === "edit" ? <BankAccountEditForm key={account.id} account={account} onSuccess={done} /> : mode === "archive" ? <BankAccountArchiveForm accountId={account.id} onSuccess={done} /> : null}
      </DialogContent>
    </Dialog>
  </>;
}

export default function BanksScreen({ accounts, page, pageSize, total, totalBalance, largestBalance }: { accounts: Account[]; page: number; pageSize: number; total: number; totalBalance: number; largestBalance: number }) {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const largest = largestBalance;
  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-muted-foreground">Gerencie suas contas bancárias e saldos.</p><Button type="button" aria-haspopup="dialog" onClick={() => setCreateOpen(true)} className="min-h-11"><Plus aria-hidden="true" />Adicionar conta bancária</Button></div>
    <section className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-border bg-[#141816] p-4"><p className="text-xs text-muted-foreground">Saldo total</p><p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-400">{formatCurrency(totalBalance)}</p></div>
      <div className="rounded-xl border border-border bg-[#141816] p-4"><p className="text-xs text-muted-foreground">Contas ativas</p><p className="mt-1 text-2xl font-semibold tabular-nums">{total}</p></div>
      <div className="rounded-xl border border-border bg-[#141816] p-4"><p className="text-xs text-muted-foreground">Maior saldo</p><p className="mt-1 truncate text-2xl font-semibold tabular-nums text-primary">{formatCurrency(largest)}</p></div>
    </section>
    {accounts.length === 0 ? <FeatureEmptyState icon={<Building2 className="h-6 w-6" />} title="Nenhuma conta cadastrada" description="Adicione sua conta corrente, poupança ou investimento para acompanhar o saldo total." /> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account) => <article key={account.id} className="rounded-xl border border-border bg-[#141816] p-5">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${account.color}22`, color: account.color }}><Wallet aria-hidden="true" className="h-5 w-5" /></span><div className="min-w-0"><h2 className="truncate font-semibold">{account.name}</h2><p className="truncate text-sm text-muted-foreground">{account.institution} · {typeLabel[account.accountType] ?? "Conta"}</p></div></div><span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Ativa</span></div>
        <div className="mt-6"><p className="text-xs text-muted-foreground">Saldo atual</p><p className="mt-1 break-words text-2xl font-semibold tabular-nums text-emerald-400">{formatCurrency(account.balance)}</p></div>
        <div className="mt-5 flex items-center justify-end border-t border-border pt-3"><AccountActions account={account} /></div>
      </article>)}
    </section>}
    {total > 0 ? <PaginationControls page={page} pageSize={pageSize} total={total} noun="contas" /> : null}
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Adicionar conta bancária</DialogTitle><DialogDescription>Informe os dados da conta e o saldo atual.</DialogDescription></DialogHeader>
        <BankAccountForm onSuccess={() => { setCreateOpen(false); router.refresh(); }} />
      </DialogContent>
    </Dialog>
  </div>;
}
