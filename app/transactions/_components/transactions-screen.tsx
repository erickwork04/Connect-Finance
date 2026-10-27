"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PiggyBank, Search, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import AddTransactionButton from "@/app/_components/add-transaction-button";
import { DataTable } from "@/app/_components/ui/data-table";
import { Input } from "@/app/_components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { TRANSACTION_CATEGORY_OPTIONS, TRANSACTION_PAYMENT_METHOD_LABELS } from "@/app/_constanst/transactions";
import { monthlyBalance } from "@/app/_lib/finance";
import { updatePaginationQuery } from "@/app/_lib/pagination";
import PaginationControls from "@/app/_components/pagination-controls";
import { formatCurrency } from "@/app/_utils/currency";
import { transactionColumns } from "../_columns";
import type { LocalPeriod, PeriodMetrics } from "../_lib/period-metrics";
import type { TransactionRow } from "../_lib/transaction-row";
import DeleteTransactionButton from "./delete-transaction-button";
import EditTransactionButton from "./edit-transaction-button";
import PeriodSidebar from "./period-sidebar";
import TransactionTypeBadge from "./type-badge";
import { TransactionAmount, TransactionCategoryLabel, TransactionDate, TransactionSourceBadge } from "./transaction-row-parts";

const periods: { value: LocalPeriod; label: string }[] = [
  { value: "month", label: "Todo o mês" },
  { value: "seven", label: "Últimos 7 dias" },
  { value: "fifteen", label: "Últimos 15 dias" },
  { value: "thirty", label: "Últimos 30 dias" },
];

function SummaryCards({ revenue, expenses, invested }: { revenue: number; expenses: number; invested: number }) {
  const balance = monthlyBalance(revenue, expenses, invested);
  const cards = [
    { label: "Total Receita", value: revenue, icon: TrendingUp, tone: "text-emerald-300" },
    { label: "Total Despesas", value: expenses, icon: TrendingDown, tone: "text-rose-300" },
    { label: "Total de Investimento", value: invested, icon: PiggyBank, tone: "text-sky-300" },
    { label: "Saldo do Período", value: balance, icon: Wallet, tone: balance < 0 ? "text-rose-300" : "text-primary" },
  ];
  return <section aria-label="Totais do período" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="min-w-0 rounded-xl border border-border bg-[#141816] p-3 xl:p-3.5">
      <div className="flex items-start gap-2"><Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${tone}`} /><h2 className="text-xs leading-4 text-muted-foreground">{label}</h2></div>
      <p className={`mt-2 break-words text-base font-semibold tabular-nums xl:text-lg ${tone}`}>{formatCurrency(value)}</p>
    </div>)}
  </section>;
}

function MobileTransactionCard({ transaction }: { transaction: TransactionRow }) {
  return <article className="min-w-0 rounded-xl border border-border bg-[#141816] p-4">
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0"><TransactionDate date={transaction.date} /><p className="mt-1 truncate font-semibold" title={transaction.name}>{transaction.name}</p></div>
      <div className="shrink-0 text-right text-sm"><TransactionAmount amount={transaction.amount} type={transaction.type} /></div>
    </div>
    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2"><TransactionCategoryLabel category={transaction.category} /><TransactionSourceBadge source={transaction.source} /></div>
    <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-border pt-2">
      <div className="min-w-0"><p className="truncate text-xs text-muted-foreground" title={TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod]}>{TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod]}</p><div className="mt-1"><TransactionTypeBadge type={transaction.type} /></div></div>
      <div className="flex shrink-0 items-center"><EditTransactionButton transaction={transaction} /><DeleteTransactionButton transactionId={transaction.id} transactionName={transaction.name} /></div>
    </div>
  </article>;
}

export default function TransactionsScreen({ rows, metrics, pagination, canAdd, canImportFiles = false }: { rows: TransactionRow[]; metrics: PeriodMetrics; pagination: { page: number; pageSize: number; total: number }; canAdd: boolean; canImportFiles?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const currentSearch = searchParams.get("search") ?? "";
  const requestedPeriod = searchParams.get("period");
  const period = requestedPeriod === "seven" || requestedPeriod === "fifteen" || requestedPeriod === "thirty" ? requestedPeriod : "month";
  const requestedCategory = searchParams.get("category");
  const category = TRANSACTION_CATEGORY_OPTIONS.some((item) => item.value === requestedCategory) ? requestedCategory! : "all";
  const [searchDraft, setSearchDraft] = useState(currentSearch);
  const searchMatchesUrl = searchDraft.trim() === currentSearch;
  const navigate = useCallback((updates: Record<string, string | null>, push = true) => {
    const query = updatePaginationQuery(searchParams.toString(), updates);
    startTransition(() => {
      const href = query ? `${pathname}?${query}` : pathname;
      if (push) router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    });
  }, [pathname, router, searchParams]);
  useEffect(() => setSearchDraft(currentSearch), [currentSearch]);
  useEffect(() => {
    if (searchDraft.trim() === currentSearch) return;
    const timer = window.setTimeout(() => navigate({ search: searchDraft.trim() || null, page: "1" }, false), 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft, currentSearch, navigate]);
  const emptyMessage = pagination.total ? "Nenhuma transação nesta página corresponde aos filtros." : "Nenhuma transação corresponde aos filtros deste período.";

  return <div className="min-w-0">
    <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px] xl:gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <SummaryCards revenue={metrics.revenue} expenses={metrics.expenses} invested={metrics.invested} />
        <section aria-label="Filtros de transações" className="grid min-w-0 grid-cols-1 items-center gap-2 rounded-xl border border-border bg-[#141816] p-3 sm:grid-cols-2 xl:grid-cols-[minmax(140px,1fr)_190px_165px_auto]">
          <div className="relative min-w-0"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground sm:top-3" /><Input aria-label="Buscar transações" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Buscar transações..." className="h-11 min-w-0 pl-9 sm:h-10" /></div>
          <Select value={category} onValueChange={(value) => navigate({ category: value === "all" ? null : value, page: "1" }, false)}><SelectTrigger aria-label="Categoria" className="h-11 min-w-0 sm:h-10"><SelectValue placeholder="Todas as categorias" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{TRANSACTION_CATEGORY_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
          <Select value={period} onValueChange={(value) => navigate({ period: value === "month" ? null : value, page: "1" }, false)}><SelectTrigger aria-label="Período dentro do mês selecionado" className="h-11 min-w-0 sm:h-10"><SelectValue placeholder="Todo o mês" /></SelectTrigger><SelectContent>{periods.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
          <div className="min-w-0 sm:col-span-2 xl:col-span-1 xl:justify-self-end"><AddTransactionButton userCanAddTransaction={canAdd} canImportFiles={canImportFiles} /></div>
        </section>
        <section aria-label="Lista de transações" aria-busy={isPending || !searchMatchesUrl} className="min-w-0">
          {isPending || !searchMatchesUrl ? <p role="status" aria-live="polite" className="mb-2 text-sm text-muted-foreground">{isPending ? "Atualizando resultados. Os filtros continuam aplicados." : "Preparando a busca; os resultados atuais continuam visíveis."}</p> : null}
          <div className="hidden min-w-0 lg:block [&_table]:table-fixed [&_th]:h-10 [&_th]:px-2.5 [&_th]:text-xs [&_td]:px-2.5 [&_td]:py-2 [&_th:nth-child(1)]:w-[100px] [&_th:nth-child(3)]:w-[130px] [&_th:nth-child(4)]:w-[116px] [&_th:nth-child(5)]:w-[98px] [&_th:nth-child(6)]:w-[145px] [&_th:nth-child(7)]:w-[86px]">
            <DataTable columns={transactionColumns} data={rows} emptyMessage={emptyMessage} />
          </div>
          <div className="space-y-2 lg:hidden">{rows.length ? rows.map((transaction) => <MobileTransactionCard key={transaction.id} transaction={transaction} />) :
            <p className="rounded-xl border border-border bg-[#141816] p-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>}</div>
          <div className="mt-4"><PaginationControls page={pagination.page} pageSize={pagination.pageSize} total={pagination.total} noun="transações" /></div>
        </section>
      </div>
      <PeriodSidebar metrics={metrics} />
    </div>
  </div>;
}
