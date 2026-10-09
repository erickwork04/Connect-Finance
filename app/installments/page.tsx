import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import Navbar from "@/app/_components/navbar";
import PageHeader from "@/app/_components/page-header";
import FeatureEmptyState from "@/app/_components/feature-empty-state";
import { db } from "@/app/_lib/prisma";
import { monthsBetween, resolveYearMonth, shiftYearMonth } from "@/app/_lib/month-range";
import { ensureCommitmentOccurrences } from "@/app/_lib/commitments";
import { formatCurrency } from "@/app/_utils/currency";
import InstallmentsActions from "./_components/installments-actions";
import CancelInstallmentButton from "./_components/cancel-installment-button";

export const dynamic = "force-dynamic";

export default async function InstallmentsPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  if (params.month !== month) redirect(`/installments?month=${month}`);
  await ensureCommitmentOccurrences(userId, month);
  const [plans, cards] = await Promise.all([
    db.installmentPlan.findMany({ where: { userId, startMonth: { lte: shiftYearMonth(month, 1) } }, include: { card: { select: { name: true, dueDay: true } } }, orderBy: { createdAt: "desc" } }),
    db.creditCard.findMany({ where: { userId, isActive: true }, select: { id: true, name: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] }),
  ]);
  const items = plans.map((plan) => ({ ...plan, current: monthsBetween(plan.startMonth, month) + 1 }))
    .filter((plan) => plan.current >= 1 && (plan.status === "ACTIVE" ? true : plan.status === "COMPLETED"));
  const active = items.filter((item) => item.status === "ACTIVE" && item.current <= item.installmentCount);
  const monthlyTotal = active.reduce((sum, item) => sum + Number(item.installmentAmount), 0);

  return <><Navbar /><main className="app-shell-content mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
    <PageHeader title="Compras parceladas" actions={<InstallmentsActions cards={cards} month={month} />} />
    <p className="-mt-3 text-sm text-muted-foreground">Acompanhe as parcelas e o impacto no seu saldo mensal.</p>
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-[#141816] p-4"><p className="text-xs text-muted-foreground">Compras ativas</p><p className="mt-1 text-2xl font-semibold tabular-nums">{active.length}</p></div>
      <div className="rounded-xl border border-border bg-[#141816] p-4"><p className="text-xs text-muted-foreground">Compromisso deste mês</p><p className="mt-1 text-2xl font-semibold tabular-nums text-amber-300">{formatCurrency(monthlyTotal)}</p></div>
      <div className="rounded-xl border border-border bg-[#141816] p-4"><p className="text-xs text-muted-foreground">Próximo mês</p><p className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(plans.filter((plan) => plan.status === "ACTIVE" && monthsBetween(plan.startMonth, shiftYearMonth(month, 1)) + 1 <= plan.installmentCount).reduce((sum, plan) => sum + Number(plan.installmentAmount), 0))}</p></div>
    </section>
    {items.length === 0 ? <FeatureEmptyState icon={<CalendarClock className="h-6 w-6" />} title="Nenhuma compra parcelada" description="Cadastre uma compra para acompanhar as parcelas mês a mês e reservar esse valor no saldo disponível." /> : <section className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const finished = item.current > item.installmentCount || item.status === "COMPLETED";
        const current = Math.min(Math.max(item.current, 1), item.installmentCount);
        const elapsed = finished ? item.installmentCount : Math.max(0, current - 1);
        return <article key={item.id} className="min-w-0 rounded-xl border border-border bg-[#141816] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-semibold">{item.description}</h2><p className="mt-1 text-sm text-muted-foreground">{item.card?.name ?? "Sem cartão vinculado"}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${finished ? "bg-zinc-700/50 text-zinc-300" : "bg-emerald-500/10 text-emerald-300"}`}>{finished ? "Concluída" : "Ativa"}</span></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div><p className="text-xs text-muted-foreground">Parcela mensal</p><p className="mt-1 font-semibold tabular-nums">{formatCurrency(Number(item.installmentAmount))}</p></div><div><p className="text-xs text-muted-foreground">Parcela no mês</p><p className="mt-1 font-semibold tabular-nums">{finished ? item.installmentCount : current}/{item.installmentCount}</p></div></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, elapsed / item.installmentCount * 100)}%` }} /></div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground"><span>Início: {item.startMonth.slice(5)}/{item.startMonth.slice(0, 4)}</span><span>Total: {formatCurrency(Number(item.totalAmount))}</span></div>
          {!finished ? <p className="mt-3 text-xs leading-5 text-amber-200/80">A parcela do mês entra automaticamente nos compromissos e reduz o saldo disponível.</p> : null}
          {!finished && item.status === "ACTIVE" ? <CancelInstallmentButton planId={item.id} /> : null}
        </article>;
      })}
    </section>}
  </main></>;
}
