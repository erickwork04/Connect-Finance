import { Check, Sparkles, X } from "lucide-react";

import Navbar from "@/app/_components/navbar";
import PageHeader from "@/app/_components/page-header";
import { Badge } from "@/app/_components/ui/badge";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import AcquirePlanButton from "./acquire-plan-button";

interface SubscriptionScreenProps {
  hasPremiumPlan: boolean;
  currentMonthTransactions: number;
}

export default function SubscriptionScreen({
  hasPremiumPlan,
  currentMonthTransactions,
}: SubscriptionScreenProps) {
  const currentPlan = hasPremiumPlan ? "Premium" : "Gratuito";

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
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
                  ? "Transações ilimitadas e relatórios de IA liberados para sua conta."
                  : `Você usou ${currentMonthTransactions} de 10 transações disponíveis neste mês.`}
              </p>
            </div>
            <div className="shrink-0 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-xs text-muted-foreground">Valor mensal do plano</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums sm:text-4xl">
                {hasPremiumPlan ? "R$ 19,90" : "R$ 0,00"}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/mês</span>
              </p>
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
                <p className="flex items-start gap-3 text-sm leading-6"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" /> Até 10 transações por mês</p>
                <p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><X aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" /> Sem relatórios de IA</p>
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
                <div className="pt-2"><AcquirePlanButton hasPremiumPlan={hasPremiumPlan} /></div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
}
