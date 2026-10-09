import { CreditCard } from "lucide-react";
import { formatCurrency } from "@/app/_utils/currency";
import CardPaymentAction from "./card-payment-action";
import CardManagementActions from "./card-management-actions";

export interface CardView {
  id: string;
  name: string;
  brand: string;
  isPrimary: boolean;
  isActive: boolean;
  limitTotal: number;
  limitUsed: number;
  limitAvailable: number;
  usedPercent: number;
  closingDay: number;
  dueDay: number;
  invoiceAmount: number;
  invoicePaidAmount: number;
  nextInvoiceAmount: number;
  invoiceStatusLabel: string;
  installmentsCount: number;
}

const accentColors = ["#a855f7", "#eab308", "#f97316", "#22c55e", "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4"];

function accentForBrand(brand: string) {
  const key = brand.trim().toLocaleLowerCase("pt-BR");
  if (key.includes("nubank")) return "#a855f7";
  if (key.includes("inter")) return "#f97316";
  if (key.includes("brasil") || key === "bb") return "#eab308";
  if (key.includes("itaú") || key.includes("itau")) return "#3b82f6";
  const hash = Array.from(key).reduce((value, character) => value + character.charCodeAt(0), 0);
  return accentColors[hash % accentColors.length];
}

function money(value: number, visible: boolean) {
  return visible ? formatCurrency(value) : "••••••";
}

export default function CardOverview({
  card,
  month,
  showLimits,
}: {
  card: CardView;
  month: string;
  showLimits: boolean;
}) {
  const accent = accentForBrand(card.brand);
  const barPercent = Math.max(0, Math.min(card.usedPercent, 100));
  const overLimit = card.limitAvailable < 0;

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-700/80 bg-[#171c23] p-4 shadow-sm shadow-black/10 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            style={{ color: accent, backgroundColor: `${accent}18`, borderColor: `${accent}55` }}
          >
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white">{card.name}</h2>
            <p className="mt-0.5 truncate text-sm text-slate-400">{card.brand}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {card.isPrimary ? <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2 py-1 text-[10px] font-medium text-blue-300">Principal</span> : null}
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${card.isActive ? "bg-blue-500/15 text-blue-300" : "bg-slate-700 text-slate-300"}`}>
            {card.isActive ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <section aria-label={`Uso do limite de ${card.name}`} className="mt-6">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">Limite utilizado</span>
          <span className="truncate text-right font-medium tabular-nums text-emerald-400">
            {money(card.limitUsed, showLimits)} / {money(card.limitTotal, showLimits)}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`Utilização do limite de ${card.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={barPercent}
          className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-800"
        >
          <div className="h-full rounded-full bg-blue-500 transition-[width]" style={{ width: `${barPercent}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>0%</span>
          <span className={overLimit ? "font-medium text-rose-400" : "font-medium text-emerald-400"}>
            {showLimits ? `${card.usedPercent.toFixed(1).replace(".", ",")}%` : "•••"}
          </span>
          <span>100%</span>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-700/70 pt-4">
        <div>
          <p className="text-xs text-slate-500">Vencimento</p>
          <p className="mt-1 text-sm font-medium text-slate-200">Dia {card.dueDay}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Fechamento</p>
          <p className="mt-1 text-sm font-medium text-slate-200">Dia {card.closingDay}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-900/45 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Limite disponível</p>
            <p className={`mt-1 truncate text-lg font-bold tabular-nums ${overLimit ? "text-rose-400" : "text-emerald-400"}`}>
              {money(card.limitAvailable, showLimits)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total do cartão</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-200">
              {money(card.limitTotal, showLimits)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-xl border border-slate-700/60 px-3 py-2.5">
          <p className="text-[11px] text-slate-500">Fatura no mês</p>
          <p className="mt-1 truncate text-sm font-semibold tabular-nums text-slate-200">{money(card.invoiceAmount, showLimits)}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{card.invoiceStatusLabel}</p>
          {card.invoicePaidAmount > 0 ? <p className="mt-1 truncate text-[10px] font-medium tabular-nums text-emerald-400">Pago: {money(card.invoicePaidAmount, showLimits)}</p> : null}
        </div>
        <div className="min-w-0 rounded-xl border border-slate-700/60 px-3 py-2.5">
          <p className="text-[11px] text-slate-500">Próxima fatura</p>
          <p className="mt-1 truncate text-sm font-semibold tabular-nums text-slate-200">{money(card.nextInvoiceAmount, showLimits)}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{card.installmentsCount} parcelas ativas no mês</p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <CardPaymentAction
          cardId={card.id}
          cardName={card.name}
          month={month}
          outstanding={card.invoiceAmount}
          paidAmount={card.invoicePaidAmount}
          limitTotal={card.limitTotal}
          limitAvailable={card.limitAvailable}
          showLimits={showLimits}
        />
        <div className="mt-2">
          <CardManagementActions card={card} />
        </div>
      </div>
    </article>
  );
}
