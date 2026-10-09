"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Wallet,
} from "lucide-react";
import FeatureEmptyState from "@/app/_components/feature-empty-state";
import Navbar from "@/app/_components/navbar";
import { Button } from "@/app/_components/ui/button";
import PageHeader from "@/app/_components/page-header";
import { creditLimit } from "@/app/_lib/finance";
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

function SummaryCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  icon: typeof Wallet;
  tone: "blue" | "red" | "green" | "slate";
}) {
  const tones = {
    blue: "text-blue-400",
    red: "text-rose-400",
    green: "text-emerald-400",
    slate: "text-slate-300",
  };

  return (
    <section className="flex min-h-[104px] min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-[#171c23] px-5 py-4 shadow-sm shadow-black/10">
      <div className="min-w-0">
        <p className="text-sm text-slate-400">{title}</p>
        <p className={`mt-1 truncate text-xl font-bold tabular-nums sm:text-2xl ${tones[tone]}`}>
          {value}
        </p>
      </div>
      <Icon aria-hidden="true" className={`h-7 w-7 shrink-0 opacity-75 ${tones[tone]}`} />
    </section>
  );
}

export default function CardsScreen({
  cards,
  installments,
  month,
  canCreateCard = true,
}: {
  cards: CardView[] | null;
  installments: InstallmentView[] | null;
  month: string;
  canCreateCard?: boolean;
}) {
  const [showLimits, setShowLimits] = useState(true);
  const cardOptions = cards?.map(({ id, name }) => ({ id, name })) ?? [];
  const limitTotal = cards?.reduce((sum, card) => sum + card.limitTotal, 0) ?? 0;
  const limitUsed = cards?.reduce((sum, card) => sum + card.limitUsed, 0) ?? 0;
  const totalLimit = creditLimit(limitTotal, limitUsed);
  const masked = "••••••";
  const usagePercent = limitTotal > 0 ? (limitUsed / limitTotal) * 100 : 0;
  const summaryValue = (value: number) => cards === null
    ? "Indisponível"
    : showLimits ? formatCurrency(value) : masked;

  return (
    <>
      <Navbar />
      <main className="app-shell-content mx-auto flex w-full max-w-[1680px] min-w-0 flex-col gap-5 p-4 sm:p-6 xl:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <PageHeader title="Cartão de Crédito" />
            <p className="mt-1 text-sm text-slate-400">
              Gerencie seus cartões de crédito e limites.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center">
            <button
              type="button"
              role="switch"
              aria-checked={showLimits}
              onClick={() => setShowLimits((visible) => !visible)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm text-slate-300 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span className={`relative h-5 w-9 rounded-full transition-colors ${showLimits ? "bg-blue-500" : "bg-slate-600"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showLimits ? "translate-x-[18px]" : "translate-x-0.5"}`} />
              </span>
              {showLimits ? <Eye aria-hidden="true" className="h-4 w-4" /> : <EyeOff aria-hidden="true" className="h-4 w-4" />}
              Mostrar limites
            </button>
            <CardsActions cards={cardOptions} month={month} canCreateCard={canCreateCard} />
          </div>
        </section>

        <section aria-label="Resumo dos limites dos cartões" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Limite Total" value={summaryValue(limitTotal)} icon={CreditCard} tone="blue" />
          <SummaryCard title="Total Usado" value={summaryValue(limitUsed)} icon={Activity} tone="red" />
          <SummaryCard title="Limite Disponível" value={summaryValue(totalLimit.available)} icon={Wallet} tone="green" />
          <SummaryCard title="Uso Total" value={cards === null ? "Indisponível" : showLimits ? `${usagePercent.toFixed(1).replace(".", ",")}%` : masked} icon={Landmark} tone="green" />
        </section>

        {cards === null ? (
          <FeatureEmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="Cadastro de cartões indisponível"
            description="Os dados de cartões não estão disponíveis no momento. Tente novamente mais tarde."
          />
        ) : cards.length === 0 ? (
          <FeatureEmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="Nenhum cartão cadastrado"
            description="Adicione seu primeiro cartão para acompanhar faturas, parcelas e limite disponível."
          />
        ) : (
          <section aria-label="Cartões ativos" className="grid min-w-0 items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {cards.map((card) => (
              <CardOverview key={card.id} card={card} month={month} showLimits={showLimits} />
            ))}
          </section>
        )}

        <section className="rounded-2xl border border-slate-700/80 bg-[#171c23] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Parcelas neste mês</h2>
              <p className="mt-1 text-sm text-slate-400">Compromissos vinculados aos cartões no período selecionado.</p>
            </div>
            <Button asChild variant="outline" className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800">
              <Link href={`/installments?month=${month}`}>Ver compras parceladas</Link>
            </Button>
          </div>
          {installments === null ? (
            <p className="mt-4 text-sm text-slate-400">Parcelamentos indisponíveis no momento.</p>
          ) : installments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Nenhuma parcela ativa neste mês.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {installments.map((item) => (
                <article key={item.id} className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{item.description}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Parcela {item.current}/{item.count}{item.cardName ? ` · ${item.cardName}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-200">
                    {showLimits ? formatCurrency(item.monthlyAmount) : masked}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
