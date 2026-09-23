import type { TransactionCategory, TransactionSource, TransactionType } from "@prisma/client";
import { Banknote, CarFront, Clapperboard, GraduationCap, HeartPulse, House, Shapes, ShoppingBasket, type LucideIcon } from "lucide-react";
import { TRANSACTION_CATEGORY_COLORS, TRANSACTION_CATEGORY_LABELS } from "@/app/_constanst/transactions";
import { formatCurrency } from "@/app/_utils/currency";

const CATEGORY_ICONS: Record<TransactionCategory, LucideIcon> = {
  HOUSING: House,
  TRANSPORTATION: CarFront,
  FOOD: ShoppingBasket,
  ENTERTAINMENT: Clapperboard,
  HEALTH: HeartPulse,
  SALARY: Banknote,
  EDUCATION: GraduationCap,
  OTHER: Shapes,
};

export function TransactionSourceBadge({ source }: { source: TransactionSource | null }) {
  if (!source || source === "MANUAL") return null;
  const label = source === "CARD_INVOICE" ? "Fatura" : source;
  return <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{label}</span>;
}

export function TransactionCategoryLabel({ category }: { category: TransactionCategory }) {
  const Icon = CATEGORY_ICONS[category];
  return <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-foreground/80">
    <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color: TRANSACTION_CATEGORY_COLORS[category] }} />
    <span className="truncate">{TRANSACTION_CATEGORY_LABELS[category]}</span>
  </span>;
}

export function TransactionAmount({ amount, type }: { amount: string; type: TransactionType }) {
  return <span className={`inline-block whitespace-nowrap font-semibold tabular-nums ${type === "DEPOSIT" ? "text-emerald-400" : type === "EXPENSE" ? "text-rose-400" : "text-sky-300"}`}>
    {type === "DEPOSIT" ? "+" : "−"}{formatCurrency(Number(amount))}
  </span>;
}

export function TransactionDate({ date }: { date: string }) {
  return <time dateTime={date.slice(0, 10)} className="whitespace-nowrap tabular-nums text-muted-foreground">
    {new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" })}
  </time>;
}
