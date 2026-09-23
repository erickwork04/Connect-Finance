import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Bot, CalendarClock, CreditCard, PiggyBank, ReceiptText, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import AddTransactionButton from "@/app/_components/add-transaction-button";
import { TRANSACTION_CATEGORY_COLORS, TRANSACTION_CATEGORY_LABELS, TRANSACTION_PAYMENT_METHOD_ICONS } from "@/app/_constanst/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import { getNavHref } from "@/app/_lib/navigation";
import { percentChange } from "@/app/_lib/finance";
import type { DashboardData } from "@/app/_data/get-dashboard";
import type { ReactNode } from "react";
import Image from "next/image";
import AiReportButton from "./ai-report-button";

const panel = "min-w-0 rounded-2xl border border-white/10 bg-[#141816] p-4 sm:p-5";
const specialBackgrounds = {
  balance: "radial-gradient(circle at 95% 5%, rgba(85, 176, 46, 0.19), transparent 43%), linear-gradient(115deg, #1c3022 0%, #17231c 58%, #141b17 100%)",
  insight: "radial-gradient(circle at 92% 7%, rgba(85, 176, 46, 0.13), transparent 42%), linear-gradient(130deg, #19241d 0%, #141a17 70%)",
  invested: "radial-gradient(circle at 95% 15%, rgba(79, 151, 155, 0.13), transparent 42%), linear-gradient(115deg, #182421 0%, #141b19 100%)",
} as const;

function Comparison({ current, previous, lowerIsBetter = false }: { current: number; previous: number; lowerIsBetter?: boolean }) {
  const change = percentChange(current, previous);
  if (change === null) return <span className="text-xs text-muted-foreground">— vs. mês anterior</span>;
  const positive = change >= 0;
  const favorable = lowerIsBetter ? change < 0 : change > 0;
  return <span className={`inline-flex items-center gap-1 text-xs ${change === 0 ? "text-muted-foreground" : favorable ? "text-emerald-400" : "text-rose-400"}`}>
    {change === 0 ? null : positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
    {Math.abs(change).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs. mês anterior
  </span>;
}

function PanelTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <h2 className="flex items-center gap-2.5 text-base font-semibold text-white sm:text-lg"><span className="text-primary">{icon}</span>{children}</h2>;
}

export function BalanceCard({ data, canAdd }: { data: DashboardData; canAdd: boolean }) {
  const pendingCount = data.commitments?.filter((item) => item.status === "PENDING" && !item.transactionId).length ?? 0;
  return <section className={`${panel} relative h-full`} style={{ background: specialBackgrounds.balance, borderColor: "rgba(85, 176, 46, 0.25)" }}>
    <svg aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[45%] sm:block" viewBox="0 0 360 180" preserveAspectRatio="none" fill="none">
      <path d="M0 150 C52 130 82 165 126 124 S190 84 230 96 S302 47 360 27" stroke="#70d94b" strokeOpacity="0.2" strokeWidth="1.5" />
      <path d="M0 170 C67 150 98 178 145 143 S211 112 255 120 S322 75 360 69" stroke="#70d94b" strokeOpacity="0.08" strokeWidth="1.5" />
      <circle cx="230" cy="96" r="3" fill="#70d94b" fillOpacity="0.3" />
    </svg>
    <div className="relative flex h-full flex-col gap-5 sm:flex-row sm:items-end sm:gap-6 lg:flex-col lg:items-start lg:gap-3 xl:flex-row xl:items-end xl:gap-8">
      <div className="min-w-0">
        <PanelTitle icon={<Wallet className="h-5 w-5" />}>Saldo</PanelTitle>
        <p className="mt-3 break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl xl:text-[2.5rem]">{formatCurrency(data.values.balance)}</p>
        <div className="mt-2"><Comparison current={data.values.balance} previous={data.previous.balance} /></div>
      </div>
      <div className="w-full min-w-0 sm:w-auto lg:w-full xl:w-auto">
        <AddTransactionButton userCanAddTransaction={canAdd} />
        <div className="mt-2.5 text-xs leading-5 text-muted-foreground">
          {data.commitments === null ? <p>Compromissos indisponíveis.</p> : pendingCount === 0 ? <p>Nenhum compromisso pendente.</p> : <><p>{pendingCount} compromisso{pendingCount === 1 ? "" : "s"} pendente{pendingCount === 1 ? "" : "s"}</p><p className="font-medium tabular-nums text-amber-100/80">{formatCurrency(data.commitmentsSummary?.pending ?? 0)} pendente{pendingCount === 1 ? "" : "s"}</p></>}
        </div>
      </div>
    </div>
  </section>;
}

const metricConfig = {
  revenue: { label: "Entradas", icon: TrendingUp, color: "text-emerald-400" },
  expenses: { label: "Total de gastos", icon: TrendingDown, color: "text-rose-400" },
  invested: { label: "Investido", icon: PiggyBank, color: "text-sky-300" },
} as const;

type Metric = keyof typeof metricConfig;

export function FinancialMetricCard({ data, metric }: { data: DashboardData; metric: Metric }) {
  const { label, icon: Icon, color } = metricConfig[metric];
  const invested = metric === "invested";
  return <section className={`${panel} relative flex h-full min-w-0 flex-col justify-between gap-4 overflow-hidden`} style={invested ? { background: specialBackgrounds.invested, borderColor: "rgba(125, 211, 252, 0.15)" } : undefined}>
    {invested && <PiggyBank aria-hidden="true" className="pointer-events-none absolute -right-4 bottom-1 hidden h-32 w-32 text-sky-200/10 lg:block" />}
    <h2 className="relative flex items-center gap-2 text-sm font-medium text-muted-foreground"><Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${color}`} />{label}</h2>
    <div className="relative"><p className={`break-words font-semibold tracking-tight tabular-nums ${invested ? "text-2xl sm:text-[1.75rem]" : "text-2xl sm:text-3xl"}`}>{formatCurrency(data.values[metric])}</p><div className="mt-1"><Comparison current={data.values[metric]} previous={data.previous[metric]} lowerIsBetter={metric === "expenses"} /></div>{invested && <p className="mt-3 hidden text-xs text-muted-foreground lg:block">Investimentos registrados no mês selecionado.</p>}</div>
  </section>;
}

export function LatestTransactionsCard({ data }: { data: DashboardData }) {
  return <section className={`${panel} flex h-full min-w-0 flex-col lg:h-[348px] lg:p-5 xl:p-5`}>
    <div className="flex items-center justify-between gap-2"><PanelTitle icon={<ReceiptText className="h-5 w-5" />}>Últimas transações</PanelTitle><Link className="shrink-0 text-xs font-semibold text-primary hover:underline" href={getNavHref("/transactions", data.month)}>Ver todas</Link></div>
    <div className="mt-4 max-h-[270px] min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:#46574a_transparent] [scrollbar-width:thin] lg:max-h-none">
      {data.latest.length === 0 && <p className="flex h-full min-h-24 items-center text-sm text-muted-foreground">Nenhuma transação neste mês.</p>}
      {data.latest.map((item) => <div key={item.id} className="flex min-w-0 items-center justify-between gap-2 border-b border-white/5 py-2.5 last:border-b-0">
        <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5"><Image src={`/${TRANSACTION_PAYMENT_METHOD_ICONS[item.paymentMethod]}`} alt="" width={18} height={18} /></span><div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="truncate text-xs text-muted-foreground"><span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: TRANSACTION_CATEGORY_COLORS[item.category] }} />{TRANSACTION_CATEGORY_LABELS[item.category]} · {new Date(item.date).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" })}{item.source && item.source !== "MANUAL" ? ` · ${item.source}` : ""}</p></div></div>
        <span className={`shrink-0 whitespace-nowrap text-right text-xs font-semibold tabular-nums sm:text-sm ${item.type === "DEPOSIT" ? "text-emerald-400" : item.type === "EXPENSE" ? "text-rose-400" : "text-sky-300"}`}>{item.type === "DEPOSIT" ? "+" : "−"}{formatCurrency(item.amount)}</span>
      </div>)}
    </div>
  </section>;
}

export function AiInsightCard({ data, premium }: { data: DashboardData; premium: boolean }) {
  const expensesChanged = percentChange(data.values.expenses, data.previous.expenses);
  const insight = data.values.revenue === 0 && data.values.expenses === 0
    ? "Registre receitas e despesas para acompanhar seu mês."
    : expensesChanged !== null && expensesChanged > 0
      ? `Suas despesas subiram ${expensesChanged.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% em relação ao mês anterior.`
      : data.values.balance >= 0 ? "Seu saldo do mês está positivo." : "As saídas do mês superaram as receitas.";
  return <section className={`${panel} relative flex h-full flex-col justify-between gap-5 overflow-hidden lg:h-[348px]`} style={{ background: specialBackgrounds.insight, borderColor: "rgba(85, 176, 46, 0.15)" }}>
    <Bot aria-hidden="true" className="pointer-events-none absolute right-5 top-10 hidden h-32 w-32 text-primary/10 lg:block" />
    <div className="relative"><PanelTitle icon={<Bot className="h-5 w-5" />}>Insight IA</PanelTitle><p className="mt-1 text-xs text-muted-foreground">Prévia dos indicadores · {data.month.slice(5)}/{data.month.slice(0, 4)}</p>
      {premium ? <><p className="mt-7 text-lg font-medium leading-snug lg:mt-4 lg:text-base">{insight}</p><p className="mt-4 border-l-2 border-primary pl-3 text-sm leading-6 text-muted-foreground lg:mt-3 lg:leading-5">Dica: acompanhe as categorias com maior peso antes de assumir novos compromissos.</p></> : <div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-4 lg:mt-4 lg:p-3"><p className="font-medium text-primary">Disponível no Premium</p><p className="mt-2 text-sm text-muted-foreground">Gere um relatório completo para o mês selecionado.</p></div>}
    </div>
    <div className="relative sm:self-start">{premium ? <AiReportButton month={data.month} /> : <Link href={getNavHref("/subscription", data.month)} className="inline-flex h-11 items-center justify-center rounded-full border border-primary/40 px-4 text-sm font-semibold text-primary hover:bg-primary/10">Ver Premium</Link>}</div>
  </section>;
}

export function InstallmentsCard({ data }: { data: DashboardData }) {
  return <section className={`${panel} flex h-full flex-col lg:p-5 xl:p-5`}><PanelTitle icon={<CalendarClock className="h-5 w-5" />}>Parcelamentos ativos</PanelTitle>
    {data.installments === null || data.installments.length === 0 ? <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3"><CalendarClock aria-hidden="true" className="h-7 w-7 shrink-0 text-primary/60" /><p className="text-sm text-muted-foreground">{data.installments === null ? "Parcelamentos indisponíveis no momento." : "Nenhuma parcela ativa neste mês."}</p></div> : <div className="mt-4 space-y-4 lg:space-y-3">{data.installments.slice(0, 3).map((item) => <div key={item.id} className="min-w-0"><div className="flex justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.description}</p><p className="text-xs text-muted-foreground">Parcela {item.current}/{item.count}{item.cardName ? ` · ${item.cardName}` : ""} · termina em {item.endMonth.slice(5)}/{item.endMonth.slice(0, 4)}</p></div><p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(item.monthlyAmount)}</p></div><div role="progressbar" aria-valuenow={item.current} aria-valuemin={0} aria-valuemax={item.count} aria-label={`Progresso de ${item.description}`} className="mt-2 h-2 overflow-hidden rounded-full bg-white/10 lg:mt-1.5 lg:h-1.5"><div className="h-full rounded-full bg-primary" style={{ width: `${item.current / item.count * 100}%` }} /></div></div>)}</div>}
    <Link href={getNavHref("/cards", data.month)} className="mt-4 inline-block self-start text-xs font-semibold text-primary hover:underline">Gerenciar parcelas</Link>
  </section>;
}

export function CreditCardSummary({ data }: { data: DashboardData }) {
  const card = data.card;
  return <section className={`${panel} lg:p-5 xl:p-5`}><div className="flex items-center justify-between gap-2"><PanelTitle icon={<CreditCard className="h-5 w-5" />}>Cartão de crédito</PanelTitle><Link className="text-xs font-semibold text-primary hover:underline" href={getNavHref("/cards", data.month)}>Gerenciar</Link></div>
    {!card ? <p className="mt-4 text-sm text-muted-foreground">{data.cardsAvailable ? "Nenhum cartão ativo cadastrado." : "Cartões indisponíveis no momento."}</p> : <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] lg:gap-7">
      <div className="min-w-0"><p className="truncate text-lg font-semibold">{card.name}</p><p className="mt-0.5 text-sm text-muted-foreground">{card.brand}</p><p className="mt-3 text-xs text-muted-foreground">Fecha dia {card.closingDay} · vence dia {card.dueDay}</p></div>
      <div className="grid grid-cols-2 gap-3 text-sm lg:border-l lg:border-white/10 lg:pl-7"><div className="min-w-0"><p className="text-xs text-muted-foreground">Fatura atual</p><p className="mt-1 break-words font-semibold tabular-nums">{formatCurrency(card.currentInvoice)}</p></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Próxima fatura</p><p className="mt-1 break-words font-semibold tabular-nums">{formatCurrency(card.nextInvoice)}</p></div></div>
      <div className="min-w-0 lg:border-l lg:border-white/10 lg:pl-7"><div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs"><span>Limite utilizado <strong className="font-semibold text-foreground tabular-nums">{formatCurrency(card.limitUsed)}</strong></span><span>Total <strong className="font-semibold text-foreground tabular-nums">{formatCurrency(card.limitTotal)}</strong></span></div><div role="progressbar" aria-label="Limite utilizado" aria-valuenow={Math.min(100, Math.max(0, card.usedPercent))} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, card.usedPercent))}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{formatCurrency(card.limitAvailable)} disponível · {card.usedPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% utilizado</p></div>
    </div>}
  </section>;
}

export function MonthlyCommitmentsCard({ data }: { data: DashboardData }) {
  return <section className={`${panel} h-full`} style={{ backgroundColor: "#161c18", borderColor: "rgba(85, 176, 46, 0.15)" }}><div className="flex items-center justify-between gap-2"><PanelTitle icon={<CalendarClock className="h-5 w-5" />}>Compromissos do mês</PanelTitle><Link href={`/transactions?month=${data.month}&view=commitments`} className="inline-flex min-h-10 shrink-0 items-center rounded-md px-2 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Gerenciar</Link></div>
    {data.commitments === null ? <p className="mt-4 text-sm text-muted-foreground">Compromissos indisponíveis no momento.</p> : <><div className="mt-4 grid grid-cols-3 gap-2 text-xs">{[
      { label: "Previstos", amount: data.commitmentsSummary?.expected ?? 0, color: "text-foreground" },
      { label: "Confirmados", amount: data.commitmentsSummary?.confirmed ?? 0, color: "text-emerald-300" },
      { label: "Pendentes", amount: data.commitmentsSummary?.pending ?? 0, color: "text-amber-300" },
    ].map((item) => <div key={item.label} className="min-w-0 rounded-xl border border-white/5 bg-white/[0.035] p-2.5"><p className="text-muted-foreground">{item.label}</p><p className={`mt-1 break-words font-semibold tabular-nums ${item.color}`}>{formatCurrency(item.amount)}</p></div>)}</div>
      <p className="mt-3 border-b border-white/10 pb-3 text-xs text-muted-foreground">Gastos fixos previstos no mês: <span className="font-semibold tabular-nums text-foreground">{formatCurrency(data.values.fixed)}</span></p>
      {data.commitments.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nenhum compromisso neste mês.</p> : <div className="mt-1 space-y-1">{data.commitments.slice(0, 2).map((item) => <div key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm"><div className="min-w-0"><p className="truncate font-medium">{item.description}</p><p className="text-xs text-muted-foreground">Vence {new Date(item.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" })} · <span className={item.status === "PENDING" ? "text-amber-300" : "text-emerald-300"}>{item.status === "PENDING" ? "Pendente" : item.status === "CONFIRMED" ? "Confirmado" : "Pago"}</span></p></div><span className="shrink-0 whitespace-nowrap font-semibold tabular-nums">{formatCurrency(item.amount)}</span></div>)}</div>}</>}
  </section>;
}

export function CategoryLegend({ categories }: { categories: DashboardData["categories"] }) {
  return <div className="space-y-2.5">{categories.map((item) => <div key={item.category} className="flex items-center gap-2 text-xs sm:text-sm"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: TRANSACTION_CATEGORY_COLORS[item.category] }} /><span className="min-w-0 flex-1 truncate">{TRANSACTION_CATEGORY_LABELS[item.category]}</span><span className="text-muted-foreground">{item.percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span><span className="min-w-[78px] text-right font-medium tabular-nums">{formatCurrency(item.amount)}</span></div>)}</div>;
}

export { panel, PanelTitle, TRANSACTION_CATEGORY_COLORS };
