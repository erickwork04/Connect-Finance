"use client";

import { useMemo, useState } from "react";
import { PiggyBank, Search, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import AddTransactionButton from "@/app/_components/add-transaction-button";
import { DataTable } from "@/app/_components/ui/data-table";
import { Input } from "@/app/_components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { TRANSACTION_CATEGORY_OPTIONS, TRANSACTION_PAYMENT_METHOD_LABELS } from "@/app/_constanst/transactions";
import { monthlyBalance } from "@/app/_lib/finance";
import { formatCurrency } from "@/app/_utils/currency";
import { transactionColumns } from "../_columns";
import { computePeriodMetrics, filterTransactionRows, type LocalPeriod } from "../_lib/period-metrics";
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
      <div className="flex shrink-0 items-center"><EditTransactionButton transaction={transaction} /><DeleteTransactionButton transactionId={transaction.id} /></div>
    </div>
  </article>;
}

export default function TransactionsScreen({ rows, month, canAdd }: { rows: TransactionRow[]; month: string; canAdd: boolean }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [period, setPeriod] = useState<LocalPeriod>("month");
  const filtered = useMemo(() => filterTransactionRows(rows, month, { search, category: category as TransactionRow["category"] | "all", period }), [rows, month, search, category, period]);
  const metrics = useMemo(() => computePeriodMetrics(filtered), [filtered]);
  const emptyMessage = rows.length ? "Nenhuma transação corresponde aos filtros." : "Nenhuma transação neste mês.";

  return <div className="min-w-0">
    <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px] xl:gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <SummaryCards revenue={metrics.revenue} expenses={metrics.expenses} invested={metrics.invested} />
        <section aria-label="Filtros de transações" className="grid min-w-0 grid-cols-1 items-center gap-2 rounded-xl border border-border bg-[#141816] p-3 sm:grid-cols-2 xl:grid-cols-[minmax(140px,1fr)_190px_165px_auto]">
          <div className="relative min-w-0"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground sm:top-3" /><Input aria-label="Buscar transações" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar transações..." className="h-11 min-w-0 pl-9 sm:h-10" /></div>
          <Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Categoria" className="h-11 min-w-0 sm:h-10"><SelectValue placeholder="Todas as categorias" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{TRANSACTION_CATEGORY_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
          <Select value={period} onValueChange={(value) => setPeriod(value as LocalPeriod)}><SelectTrigger aria-label="Período dentro do mês selecionado" className="h-11 min-w-0 sm:h-10"><SelectValue placeholder="Todo o mês" /></SelectTrigger><SelectContent>{periods.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
          <div className="min-w-0 sm:col-span-2 xl:col-span-1 xl:justify-self-end"><AddTransactionButton userCanAddTransaction={canAdd} /></div>
        </section>
        <section aria-label="Lista de transações" className="min-w-0">
          <div className="hidden min-w-0 lg:block [&_table]:table-fixed [&_th]:h-10 [&_th]:px-2.5 [&_th]:text-xs [&_td]:px-2.5 [&_td]:py-2 [&_th:nth-child(1)]:w-[100px] [&_th:nth-child(3)]:w-[130px] [&_th:nth-child(4)]:w-[116px] [&_th:nth-child(5)]:w-[98px] [&_th:nth-child(6)]:w-[145px] [&_th:nth-child(7)]:w-[86px]">
            <DataTable columns={transactionColumns} data={filtered} emptyMessage={emptyMessage} />
          </div>
          <div className="space-y-2 lg:hidden">{filtered.length ? filtered.map((transaction) => <MobileTransactionCard key={transaction.id} transaction={transaction} />) :
            <p className="rounded-xl border border-border bg-[#141816] p-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>}</div>
        </section>
      </div>
      <PeriodSidebar metrics={metrics} />
    </div>
  </div>;
}
