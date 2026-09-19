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
import CommitmentsDialog from "./commitments-dialog";

const panel = "min-w-0 rounded-2xl border border-white/10 bg-[#141816] p-4 sm:p-5 xl:p-6";

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
  return <section className={`${panel} relative overflow-hidden bg-[#19231d] lg:p-5`}>
    <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
    <div className="relative flex flex-col gap-7 lg:gap-4">
      <div>
        <PanelTitle icon={<Wallet className="h-5 w-5" />}>Saldo</PanelTitle>
        <p className="mt-5 break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl lg:mt-3 xl:text-[2.5rem]">{formatCurrency(data.values.balance)}</p>
        <div className="mt-2"><Comparison current={data.values.balance} previous={data.previous.balance} /></div>
      </div>
      <div className="flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-end sm:justify-between lg:gap-2 lg:pt-3">
        <div><p className="text-xs text-muted-foreground">Disponível após compromissos</p><p className="mt-1 text-lg font-semibold tabular-nums text-emerald-300">{formatCurrency(data.available)}</p></div>
        <AddTransactionButton userCanAddTransaction={canAdd} />
      </div>
    </div>
  </section>;
}

const metricConfig = [
  { key: "invested", label: "Investido", icon: PiggyBank, color: "text-sky-300" },
  { key: "revenue", label: "Receita", icon: TrendingUp, color: "text-emerald-400" },
  { key: "expenses", label: "Despesas", icon: TrendingDown, color: "text-rose-400" },
  { key: "fixed", label: "Gastos fixos do mês", icon: ReceiptText, color: "text-amber-300" },
] as const;

export function Metrics({ data }: { data: DashboardData }) {
  return <section aria-label="Resumo financeiro" className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:gap-3">
    {metricConfig.map(({ key, label, icon: Icon, color }) => <div key={key} className={`${panel} flex flex-col justify-between gap-4 p-3 sm:p-4 lg:gap-2 lg:p-3.5`}>
      <div className="flex items-start gap-2"><Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${color}`} /><h2 className="text-xs leading-tight text-muted-foreground sm:text-sm">{label}</h2></div>
      <div><p className="whitespace-nowrap text-sm font-semibold tracking-tight tabular-nums min-[360px]:text-lg sm:text-xl xl:text-2xl">{formatCurrency(data.values[key])}</p><Comparison current={data.values[key]} previous={data.previous[key]} lowerIsBetter={key === "expenses" || key === "fixed"} /></div>
    </div>)}
  </section>;
}

export function LatestTransactionsCard({ data }: { data: DashboardData }) {
  return <section className={`${panel} lg:p-5`}>
    <div className="flex items-center justify-between gap-2"><PanelTitle icon={<ReceiptText className="h-5 w-5" />}>Últimas transações</PanelTitle><Link className="shrink-0 text-xs font-semibold text-primary hover:underline" href={getNavHref("/transactions", data.month)}>Ver todas</Link></div>
    <div className="mt-5 space-y-1 lg:mt-3 lg:max-h-[390px] lg:overflow-y-auto lg:pr-1">
      {data.latest.length === 0 && <p className="py-8 text-sm text-muted-foreground">Nenhuma transação neste mês.</p>}
      {data.latest.map((item, index) => <div key={item.id} className={`${index >= 6 ? "hidden lg:flex" : "flex"} min-w-0 items-center justify-between gap-2 border-b border-white/5 py-2.5 last:border-b-0 lg:py-2`}>
        <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5"><Image src={`/${TRANSACTION_PAYMENT_METHOD_ICONS[item.paymentMethod]}`} alt="" width={18} height={18} /></span><div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="truncate text-xs text-muted-foreground"><span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: TRANSACTION_CATEGORY_COLORS[item.category] }} />{TRANSACTION_CATEGORY_LABELS[item.category]} · {new Date(item.date).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" })}{item.source && item.source !== "MANUAL" ? ` · ${item.source}` : ""}</p></div></div>
        <span className={`shrink-0 text-xs font-semibold tabular-nums sm:text-sm ${item.type === "DEPOSIT" ? "text-emerald-400" : item.type === "EXPENSE" ? "text-rose-400" : "text-sky-300"}`}>{item.type === "DEPOSIT" ? "+" : "−"}{formatCurrency(item.amount)}</span>
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
  return <section className={`${panel} flex flex-col gap-5 lg:gap-4 lg:p-5`}>
    <div><PanelTitle icon={<Bot className="h-5 w-5" />}>Insight IA</PanelTitle><p className="mt-1 text-xs text-muted-foreground">Prévia dos indicadores · {data.month.slice(5)}/{data.month.slice(0, 4)}</p>
      {premium ? <><p className="mt-7 text-lg font-medium leading-snug lg:mt-4 lg:text-base">{insight}</p><p className="mt-4 border-l-2 border-primary pl-3 text-sm leading-6 text-muted-foreground lg:mt-3 lg:leading-5">Dica: acompanhe as categorias com maior peso antes de assumir novos compromissos.</p></> : <div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-4 lg:mt-4 lg:p-3"><p className="font-medium text-primary">Disponível no Premium</p><p className="mt-2 text-sm text-muted-foreground">Gere um relatório completo para o mês selecionado.</p></div>}
    </div>
    {premium ? <AiReportButton month={data.month} /> : <Link href={getNavHref("/subscription", data.month)} className="inline-flex h-11 items-center justify-center rounded-full border border-primary/40 px-4 text-sm font-semibold text-primary hover:bg-primary/10">Ver Premium</Link>}
  </section>;
}

export function InstallmentsCard({ data }: { data: DashboardData }) {
  return <section className={`${panel} lg:p-5`}><PanelTitle icon={<CalendarClock className="h-5 w-5" />}>Parcelamentos ativos</PanelTitle>
    {data.installments === null ? <p className="mt-4 text-sm text-muted-foreground">Parcelamentos indisponíveis no momento.</p> : data.installments.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nenhuma parcela ativa neste mês.</p> : <div className="mt-4 space-y-4 lg:space-y-3">{data.installments.slice(0, 3).map((item) => <div key={item.id} className="min-w-0"><div className="flex justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.description}</p><p className="text-xs text-muted-foreground">Parcela {item.current}/{item.count}{item.cardName ? ` · ${item.cardName}` : ""} · termina em {item.endMonth.slice(5)}/{item.endMonth.slice(0, 4)}</p></div><p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(item.monthlyAmount)}</p></div><div role="progressbar" aria-valuenow={item.current} aria-valuemin={0} aria-valuemax={item.count} aria-label={`Progresso de ${item.description}`} className="mt-2 h-2 overflow-hidden rounded-full bg-white/10 lg:mt-1.5 lg:h-1.5"><div className="h-full rounded-full bg-primary" style={{ width: `${item.current / item.count * 100}%` }} /></div></div>)}</div>}
    <Link href={getNavHref("/cards", data.month)} className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">Gerenciar parcelas</Link>
  </section>;
}

export function CreditCardSummary({ data }: { data: DashboardData }) {
  const card = data.card;
  return <section className={`${panel} lg:p-5`}><div className="flex items-center justify-between gap-2"><PanelTitle icon={<CreditCard className="h-5 w-5" />}>Cartão de crédito</PanelTitle><Link className="text-xs font-semibold text-primary hover:underline" href={getNavHref("/cards", data.month)}>Gerenciar</Link></div>
    {!card ? <p className="mt-4 text-sm text-muted-foreground">{data.cardsAvailable ? "Nenhum cartão ativo cadastrado." : "Cartões indisponíveis no momento."}</p> : <><div className="mt-5 flex items-baseline justify-between gap-2 lg:mt-3"><div><p className="font-semibold">{card.name}</p><p className="text-xs text-muted-foreground">{card.brand}</p></div><p className="text-xs text-muted-foreground">Fecha dia {card.closingDay} · vence dia {card.dueDay}</p></div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm lg:mt-3"><div><p className="text-xs text-muted-foreground">Fatura atual</p><p className="mt-1 font-semibold tabular-nums">{formatCurrency(card.currentInvoice)}</p></div><div><p className="text-xs text-muted-foreground">Próxima fatura</p><p className="mt-1 font-semibold tabular-nums">{formatCurrency(card.nextInvoice)}</p></div></div>
      <div className="mt-5 flex justify-between gap-2 text-xs lg:mt-3"><span>Limite utilizado {formatCurrency(card.limitUsed)}</span><span>{formatCurrency(card.limitTotal)} total</span></div><div role="progressbar" aria-label="Limite utilizado" aria-valuenow={Math.min(100, Math.max(0, card.usedPercent))} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, card.usedPercent))}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{formatCurrency(card.limitAvailable)} disponível · {card.usedPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% utilizado</p>
    </>}
  </section>;
}

export function MonthlyCommitmentsCard({ data }: { data: DashboardData }) {
  return <section className={`${panel} lg:p-5`}><div className="flex items-center justify-between gap-2"><PanelTitle icon={<CalendarClock className="h-5 w-5" />}>Compromissos do mês</PanelTitle><CommitmentsDialog key={data.month} month={data.month} /></div>
    {data.commitments === null ? <p className="mt-4 text-sm text-muted-foreground">Compromissos indisponíveis no momento.</p> : <><div className="mt-5 grid grid-cols-3 gap-2 border-b border-white/10 pb-4 text-xs lg:mt-3 lg:pb-3"><div><p className="text-muted-foreground">Previstos</p><p className="mt-1 font-semibold tabular-nums">{formatCurrency(data.commitmentsSummary?.expected ?? 0)}</p></div><div><p className="text-muted-foreground">Confirmados</p><p className="mt-1 font-semibold tabular-nums">{formatCurrency(data.commitmentsSummary?.confirmed ?? 0)}</p></div><div><p className="text-muted-foreground">Pendentes</p><p className="mt-1 font-semibold tabular-nums text-amber-300">{formatCurrency(data.commitmentsSummary?.pending ?? 0)}</p></div></div>
      {data.commitments.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nenhum compromisso neste mês.</p> : <div className="mt-2 space-y-1">{data.commitments.slice(0, 2).map((item) => <div key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm"><div className="min-w-0"><p className="truncate font-medium">{item.description}</p><p className="text-xs text-muted-foreground">Vence {new Date(item.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" })} · {item.status === "PENDING" ? "Pendente" : item.status === "CONFIRMED" ? "Confirmado" : "Pago"}</p></div><span className="shrink-0 font-semibold tabular-nums">{formatCurrency(item.amount)}</span></div>)}</div>}</>}
  </section>;
}

export function CategoryLegend({ categories }: { categories: DashboardData["categories"] }) {
  return <div className="space-y-2.5">{categories.map((item) => <div key={item.category} className="flex items-center gap-2 text-xs sm:text-sm"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: TRANSACTION_CATEGORY_COLORS[item.category] }} /><span className="min-w-0 flex-1 truncate">{TRANSACTION_CATEGORY_LABELS[item.category]}</span><span className="text-muted-foreground">{item.percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span><span className="min-w-[78px] text-right font-medium tabular-nums">{formatCurrency(item.amount)}</span></div>)}</div>;
}

export { panel, PanelTitle, TRANSACTION_CATEGORY_COLORS };
