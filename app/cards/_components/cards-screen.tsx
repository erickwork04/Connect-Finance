import { CreditCard } from "lucide-react";
import FeatureEmptyState from "@/app/_components/feature-empty-state";
import Navbar from "@/app/_components/navbar";
import PageHeader from "@/app/_components/page-header";
import { formatCurrency } from "@/app/_utils/currency";
import CardOverview, { type CardView } from "./card-overview";
import CardsActions from "./cards-actions";

interface InstallmentView {
  id: string;
  description: string;
  current: number;
  count: number;
  monthlyAmount: number;
  cardName: string | null;
}

export default function CardsScreen({ cards, installments, month }: { cards: CardView[] | null; installments: InstallmentView[] | null; month: string }) {
  const cardOptions = cards?.map(({ id, name }) => ({ id, name })) ?? [];
  const limitTotal = cards?.reduce((sum, card) => sum + card.limitTotal, 0) ?? 0;
  const limitUsed = cards?.reduce((sum, card) => sum + card.limitUsed, 0) ?? 0;

  return <><Navbar /><main className="mx-auto flex w-full max-w-[1680px] min-w-0 flex-col gap-5 p-4 sm:p-6 xl:px-8">
    <PageHeader title={`Cartões · ${month.slice(5)}/${month.slice(0, 4)}`} actions={cards === null ? null : <CardsActions cards={cardOptions} month={month} />} />
    {cards === null ? <FeatureEmptyState icon={<CreditCard className="h-6 w-6" />} title="Cadastro de cartões indisponível" description="Os dados de cartões não estão disponíveis no momento." /> : <div className={`grid min-w-0 items-start gap-4 ${cards.length > 1 ? "lg:grid-cols-[minmax(0,1fr)_320px]" : "lg:grid-cols-2"}`}>
      <div className={`grid min-w-0 gap-4 ${cards.length > 1 ? "xl:grid-cols-2" : ""}`}>
        {cards.length === 0 ? <FeatureEmptyState icon={<CreditCard className="h-6 w-6" />} title="Nenhum cartão cadastrado" description="Adicione um cartão para acompanhar faturas e limites. Importações não criam cartões automaticamente." /> : cards.map((card) => <CardOverview key={card.id} card={card} />)}
      </div>
      <aside className="min-w-0 space-y-4">
        <section className="rounded-xl border border-border bg-[#141816] p-4 sm:p-5"><h2 className="font-semibold">Resumo dos cartões</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Cartões ativos</p><p className="mt-1 text-lg font-semibold tabular-nums">{cards.length}</p></div><div><p className="text-xs text-muted-foreground">Limite total</p><p className="mt-1 break-words font-semibold tabular-nums">{formatCurrency(limitTotal)}</p></div><div><p className="text-xs text-muted-foreground">Utilizado</p><p className="mt-1 break-words font-semibold tabular-nums">{formatCurrency(limitUsed)}</p></div><div><p className="text-xs text-muted-foreground">Disponível</p><p className="mt-1 break-words font-semibold tabular-nums text-primary">{formatCurrency(limitTotal - limitUsed)}</p></div></div>
        </section>
        <section className="rounded-xl border border-border bg-[#141816] p-4 sm:p-5"><h2 className="font-semibold">Parcelamentos do mês</h2>
          {installments === null ? <p className="mt-3 text-sm text-muted-foreground">Parcelamentos indisponíveis no momento.</p> : installments.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhuma parcela ativa neste mês.</p> : <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">{installments.map((item) => <div key={item.id} className="flex min-w-0 items-start justify-between gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.description}</p><p className="text-xs text-muted-foreground">Parcela {item.current}/{item.count}{item.cardName ? ` · ${item.cardName}` : ""}</p></div><span className="shrink-0 text-xs font-semibold tabular-nums">{formatCurrency(item.monthlyAmount)}</span></div>)}</div>}
        </section>
      </aside>
    </div>}
  </main></>;
}
