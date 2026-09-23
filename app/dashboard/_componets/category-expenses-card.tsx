import { ChartNoAxesCombined } from "lucide-react";
import type { CategoryPeriod, DashboardData } from "@/app/_data/get-dashboard";
import { TRANSACTION_CATEGORY_COLORS, TRANSACTION_CATEGORY_LABELS } from "@/app/_constanst/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import CategoryFilter from "./category-filter";

export default function CategoryExpensesCard({ data, period }: { data: DashboardData; period: CategoryPeriod }) {
  let displayedCategories = data.categories;
  if (data.categories.length > 6) {
    const leading = data.categories.filter((item) => item.category !== "OTHER").slice(0, 5);
    const leadingIds = new Set(leading.map((item) => item.category));
    const remaining = data.categories.filter((item) => !leadingIds.has(item.category));
    displayedCategories = [...leading, {
      category: "OTHER" as const,
      amount: remaining.reduce((sum, item) => sum + item.amount, 0),
      percent: remaining.reduce((sum, item) => sum + item.percent, 0),
    }];
  }
  let cursor = 0;
  const slices = displayedCategories.map((item) => {
    const from = cursor;
    cursor += item.percent;
    return `${TRANSACTION_CATEGORY_COLORS[item.category]} ${from}% ${cursor}%`;
  });
  const gradient = slices.length ? `conic-gradient(${slices.join(", ")})` : "conic-gradient(#343b36 0 100%)";
  return <section className="h-full min-w-0 rounded-2xl border border-white/10 bg-[#141816] p-4 sm:p-5 lg:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2.5 text-base font-semibold sm:text-lg"><ChartNoAxesCombined className="h-5 w-5 text-primary" />Gastos por categoria</h2><CategoryFilter value={period} /></div>
    <div className="mt-5 grid items-center gap-6 sm:grid-cols-[minmax(0,220px)_1fr] lg:mx-auto lg:mt-4 lg:max-w-[700px] lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-5">
      <div role="img" aria-label={`Total de despesas por categoria: ${formatCurrency(data.categoryTotal)}`} className="relative mx-auto aspect-square w-full max-w-[220px] rounded-full p-[24px] lg:max-w-[180px] lg:p-5" style={{ background: gradient }}><div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#141816] text-center"><span className="text-xs text-muted-foreground">Total de despesas</span><strong className="mt-1 break-words px-2 text-lg tabular-nums sm:text-xl lg:text-base">{formatCurrency(data.categoryTotal)}</strong></div></div>
      {displayedCategories.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma despesa registrada neste período.</p> : <div className="space-y-2.5 lg:space-y-2">{displayedCategories.map((item) => <div key={item.category} className="flex min-w-0 items-center gap-2 text-xs sm:text-sm"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: TRANSACTION_CATEGORY_COLORS[item.category] }} /><span className="min-w-0 flex-1 truncate">{TRANSACTION_CATEGORY_LABELS[item.category]}</span><span className="text-muted-foreground">{item.percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span><span className="min-w-[76px] text-right font-medium tabular-nums">{formatCurrency(item.amount)}</span></div>)}</div>}
    </div>
  </section>;
}
