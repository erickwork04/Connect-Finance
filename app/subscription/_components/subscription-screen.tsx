import { Check, Sparkles, X } from "lucide-react";

import Navbar from "@/app/_components/navbar";
import PageHeader from "@/app/_components/page-header";
import { Badge } from "@/app/_components/ui/badge";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import AcquirePlanButton from "./acquire-plan-button";
import SubscriptionCheckoutStatus from "./subscription-checkout-status";
import type { CheckoutStatus } from "./subscription-checkout-status";
import { formatCurrency } from "@/app/_utils/currency";

interface SubscriptionScreenProps {
  hasPremiumPlan: boolean;
  monthlyAmount: number | null;
  activeCouponCode: string | null;
  couponRestored: boolean;
  checkout: { id: string; status: CheckoutStatus; paid: boolean } | null;
}

export default function SubscriptionScreen({
  hasPremiumPlan,
  monthlyAmount,
  activeCouponCode,
  couponRestored,
  checkout,
}: SubscriptionScreenProps) {
  const currentPlan = hasPremiumPlan ? "Premium" : "Gratuito";

  return (
    <>
      {checkout ? <SubscriptionCheckoutStatus {...checkout} /> : null}
      <Navbar />
      <main className="app-shell-content mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        <PageHeader title="Assinatura" />
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Confira o plano ativo e os benefícios disponíveis para sua conta.
        </p>

        <Card className="min-w-0 border-primary/25 bg-zinc-950/80">
          <CardContent className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">Plano atual</span>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Ativo</Badge>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{currentPlan}</h2>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                {hasPremiumPlan
                  ? "Importação de arquivos, cartões e compromissos ilimitados, além de relatórios com IA."
                  : "Transações e histórico ilimitados, com até 1 cartão e 3 compromissos ativos."}
              </p>
            </div>
            <div className="shrink-0 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-xs text-muted-foreground">Valor mensal do plano</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums sm:text-4xl">
                {hasPremiumPlan ? formatCurrency(monthlyAmount ?? 19.9) : "R$ 0,00"}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/mês</span>
              </p>
              {hasPremiumPlan && activeCouponCode && monthlyAmount !== null
                ? <p className="mt-1 text-xs text-primary">{couponRestored ? `Cupom ${activeCouponCode} usado no primeiro mês` : `Cupom ${activeCouponCode} aplicado`}</p> : null}
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="plans-title" className="space-y-4">
          <h2 id="plans-title" className="text-lg font-semibold">Compare os planos</h2>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="min-w-0 border-border bg-zinc-950/70">
              <CardHeader className="gap-3 border-b border-border p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold">Gratuito</h3>
                  {!hasPremiumPlan ? <Badge variant="outline" className="border-primary/30 text-primary">Seu plano</Badge> : null}
                </div>
                <p className="text-2xl font-semibold tabular-nums">R$ 0,00 <span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </CardHeader>
              <CardContent className="space-y-4 p-5 sm:p-6">
                <p className="flex items-start gap-3 text-sm leading-6"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" /> Transações e histórico ilimitados</p>
                <p className="flex items-start gap-3 text-sm leading-6"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" /> Até 1 cartão de crédito</p>
                <p className="flex items-start gap-3 text-sm leading-6"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" /> Até 3 compromissos ativos</p>
                <p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><X aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" /> Sem importação de arquivos ou relatórios com IA</p>
              </CardContent>
            </Card>

            <Card className="min-w-0 border-primary/30 bg-zinc-950/70">
              <CardHeader className="gap-3 border-b border-border p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-xl font-semibold"><Sparkles aria-hidden="true" className="h-5 w-5 text-primary" /> Premium</h3>
                  {hasPremiumPlan ? <Badge variant="outline" className="border-primary/30 text-primary">Seu plano</Badge> : null}
                </div>
                <p className="text-2xl font-semibold tabular-nums">R$ 19,90 <span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </CardHeader>
              <CardContent className="space-y-4 p-5 sm:p-6">
                <p className="flex items-start gap-3 text-sm leading-6"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" /> Transações ilimitadas</p>
                <p className="flex items-start gap-3 text-sm leading-6"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" /> Relatórios de IA</p>
                <p className="flex items-start gap-3 text-sm leading-6"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" /> Importação de faturas, OFX e CSV</p>
                <p className="flex items-start gap-3 text-sm leading-6"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" /> Cartões e compromissos ilimitados</p>
                <div className="pt-2"><AcquirePlanButton hasPremiumPlan={hasPremiumPlan} /></div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
}
