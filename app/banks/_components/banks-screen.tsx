"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { formatCurrency } from "@/app/_utils/currency";
import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import FeatureEmptyState from "@/app/_components/feature-empty-state";
import { BankAccountArchiveForm, BankAccountEditForm, BankAccountForm } from "@/app/_components/finance-forms";

type Account = { id: string; name: string; institution: string; accountType: string; balance: number; color: string };
const typeLabel: Record<string, string> = { CHECKING: "Conta corrente", SAVINGS: "Poupança", CASH: "Dinheiro", INVESTMENT: "Investimentos", OTHER: "Outra conta" };
type Mode = "create" | "edit" | "archive" | null;

function AccountActions({ account }: { account: Account }) {
  const [mode, setMode] = useState<Mode>(null);
  const router = useRouter();
  const done = () => { setMode(null); router.refresh(); };
  return <>
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setMode("edit")}><Pencil aria-hidden="true" className="h-4 w-4" />Editar</Button>
      <Button type="button" variant="outline" size="icon" aria-label={`Remover ${account.name}`} title="Remover conta" onClick={() => setMode("archive")}><Trash2 aria-hidden="true" className="h-4 w-4 text-rose-400" /></Button>
    </div>
    <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) setMode(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === "edit" ? `Editar ${account.name}` : `Remover ${account.name}?`}</DialogTitle><DialogDescription>{mode === "edit" ? "Atualize os dados e o saldo desta conta." : "A conta será arquivada e deixará de aparecer entre as contas ativas."}</DialogDescription></DialogHeader>
        {mode === "edit" ? <BankAccountEditForm key={account.id} account={account} onSuccess={done} /> : mode === "archive" ? <BankAccountArchiveForm accountId={account.id} onSuccess={done} /> : null}
      </DialogContent>
    </Dialog>
  </>;
}

export default function BanksScreen({ accounts }: { accounts: Account[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  const largest = accounts.reduce<Account | null>((current, account) => !current || account.balance > current.balance ? account : current, null);
  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-muted-foreground">Gerencie suas contas bancárias e saldos.</p><Button type="button" onClick={() => setCreateOpen(true)} className="min-h-11"><Plus aria-hidden="true" />Adicionar banco</Button></div>
    <section className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-border bg-[#141816] p-4"><p className="text-xs text-muted-foreground">Saldo total</p><p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-400">{formatCurrency(total)}</p></div>
      <div className="rounded-xl border border-border bg-[#141816] p-4"><p className="text-xs text-muted-foreground">Contas ativas</p><p className="mt-1 text-2xl font-semibold tabular-nums">{accounts.length}</p></div>
      <div className="rounded-xl border border-border bg-[#141816] p-4"><p className="text-xs text-muted-foreground">Maior saldo</p><p className="mt-1 truncate text-2xl font-semibold tabular-nums text-primary">{largest ? formatCurrency(largest.balance) : formatCurrency(0)}</p></div>
    </section>
    {accounts.length === 0 ? <FeatureEmptyState icon={<Building2 className="h-6 w-6" />} title="Nenhuma conta cadastrada" description="Adicione sua conta corrente, poupança ou investimento para acompanhar o saldo total." /> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account) => <article key={account.id} className="rounded-xl border border-border bg-[#141816] p-5">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${account.color}22`, color: account.color }}><Wallet aria-hidden="true" className="h-5 w-5" /></span><div className="min-w-0"><h2 className="truncate font-semibold">{account.name}</h2><p className="truncate text-sm text-muted-foreground">{account.institution} · {typeLabel[account.accountType] ?? "Conta"}</p></div></div><span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Ativa</span></div>
        <div className="mt-6"><p className="text-xs text-muted-foreground">Saldo atual</p><p className="mt-1 break-words text-2xl font-semibold tabular-nums text-emerald-400">{formatCurrency(account.balance)}</p></div>
        <div className="mt-5 flex items-center justify-end border-t border-border pt-3"><AccountActions account={account} /></div>
      </article>)}
    </section>}
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Adicionar conta bancária</DialogTitle><DialogDescription>Informe os dados da conta e o saldo atual.</DialogDescription></DialogHeader>
        <BankAccountForm onSuccess={() => { setCreateOpen(false); router.refresh(); }} />
      </DialogContent>
    </Dialog>
  </div>;
}
