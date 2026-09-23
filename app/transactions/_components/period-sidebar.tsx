import { TRANSACTION_CATEGORY_COLORS, TRANSACTION_CATEGORY_LABELS } from "@/app/_constanst/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import type { PeriodMetrics } from "../_lib/period-metrics";

const panel = "min-w-0 rounded-xl border border-border bg-[#141816] p-4";

function PeriodSummary({ metrics }: { metrics: PeriodMetrics }) {
  const items = [
    { label: "Transações realizadas", value: metrics.count.toLocaleString("pt-BR") },
    { label: "Ticket médio", value: formatCurrency(metrics.averageTicket) },
  ];
  return <section className={panel} aria-labelledby="period-summary-title">
    <h2 id="period-summary-title" className="text-base font-semibold">Resumo do período</h2>
    <dl className="mt-3 space-y-3 text-sm">
      {items.map((item) => <div key={item.label} className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">{item.label}</dt><dd className="font-semibold tabular-nums">{item.value}</dd></div>)}
      <div className="border-t border-border pt-3"><dt className="text-muted-foreground">Maior despesa</dt><dd className="mt-1 font-semibold tabular-nums text-rose-300">{metrics.largestExpense ? formatCurrency(metrics.largestExpense.amount) : "—"}</dd>
        {metrics.largestExpense && <p className="mt-0.5 truncate text-xs text-muted-foreground" title={metrics.largestExpense.name}>{metrics.largestExpense.name}</p>}</div>
      <div><dt className="text-muted-foreground">Maior receita</dt><dd className="mt-1 font-semibold tabular-nums text-emerald-300">{metrics.largestRevenue ? formatCurrency(metrics.largestRevenue.amount) : "—"}</dd>
        {metrics.largestRevenue && <p className="mt-0.5 truncate text-xs text-muted-foreground" title={metrics.largestRevenue.name}>{metrics.largestRevenue.name}</p>}</div>
    </dl>
  </section>;
}

function ExpensesDistribution({ metrics }: { metrics: PeriodMetrics }) {
  let cursor = 0;
  const slices = metrics.categories.map((item) => {
    const from = cursor;
    cursor += item.percent;
    return `${TRANSACTION_CATEGORY_COLORS[item.category]} ${from}% ${cursor}%`;
  });
  return <section className={panel} aria-labelledby="expense-distribution-title">
    <h2 id="expense-distribution-title" className="text-base font-semibold">Distribuição de despesas</h2>
    {metrics.expenses === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhuma despesa neste período.</p> : <>
      <div className="mx-auto mt-3 h-[184px] w-[184px] rounded-full p-[21px]" role="img" aria-label={`Despesas totais: ${formatCurrency(metrics.expenses)}`} style={{ background: `conic-gradient(${slices.join(", ")})` }}>
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#141816] text-center"><strong className="text-sm font-semibold tabular-nums">{formatCurrency(metrics.expenses)}</strong><span className="text-[11px] text-muted-foreground">em despesas</span></div>
      </div>
      <ul className="mt-3 space-y-2">
        {metrics.categories.map((item) => <li key={item.category} className="flex min-w-0 items-center gap-2 text-xs">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: TRANSACTION_CATEGORY_COLORS[item.category] }} />
          <span className="min-w-0 flex-1 truncate">{TRANSACTION_CATEGORY_LABELS[item.category]}</span>
          <span className="text-muted-foreground tabular-nums">{item.percent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%</span>
          <span className="min-w-[76px] text-right font-medium tabular-nums">{formatCurrency(item.amount)}</span>
        </li>)}
      </ul>
    </>}
  </section>;
}

function PeriodInsights({ metrics }: { metrics: PeriodMetrics }) {
  const insights: string[] = [];
  if (metrics.count >= 2) {
    const topCategory = metrics.categories[0];
    if (topCategory) insights.push(`${TRANSACTION_CATEGORY_LABELS[topCategory.category]} representa ${topCategory.percent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% das despesas.`);
    if (metrics.largestExpense) insights.push(`Sua maior despesa foi ${formatCurrency(metrics.largestExpense.amount)}.`);
    if (metrics.expenseCount >= 2) insights.push(`Você registrou ${metrics.expenseCount} despesas neste período.`);
    if (metrics.largestRevenue) insights.push(`Sua maior receita foi ${formatCurrency(metrics.largestRevenue.amount)}.`);
  }
  return <section className={panel} aria-labelledby="period-insights-title">
    <h2 id="period-insights-title" className="text-base font-semibold">Insights do período</h2>
    {insights.length === 0 ? <p className="mt-3 text-sm leading-5 text-muted-foreground">Não há dados suficientes para gerar insights neste período.</p> :
      <ul className="mt-3 space-y-2.5 text-sm leading-5 text-muted-foreground">{insights.slice(0, 4).map((insight) => <li key={insight} className="border-l-2 border-primary/60 pl-3">{insight}</li>)}</ul>}
  </section>;
}

export default function PeriodSidebar({ metrics }: { metrics: PeriodMetrics }) {
  return <aside aria-label="Análise das transações" className="min-w-0 space-y-4">
    <PeriodSummary metrics={metrics} />
    <ExpensesDistribution metrics={metrics} />
    <PeriodInsights metrics={metrics} />
  </aside>;
}
