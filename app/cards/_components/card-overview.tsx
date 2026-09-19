import { CreditCard } from "lucide-react";

import { Badge } from "@/app/_components/ui/badge";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { formatCurrency } from "@/app/_utils/currency";

export interface CardView {
  id: string;
  name: string;
  brand: string;
  limitTotal: number;
  limitUsed: number;
  limitAvailable: number;
  usedPercent: number;
  closingDay: number;
  dueDay: number;
  invoiceAmount: number;
  nextInvoiceAmount: number;
  invoiceStatusLabel: string;
  installmentsCount: number;
}

export default function CardOverview({ card }: { card: CardView }) {
  const usedPercent = Math.max(0, Math.min(card.usedPercent, 100));

  return (
    <Card className="min-w-0 border-border bg-zinc-950/70">
      <CardHeader className="border-b border-border p-5 sm:p-5 lg:p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary lg:h-10 lg:w-10">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="break-words text-lg font-semibold">{card.name}</h2>
              <p className="text-sm text-muted-foreground">{card.brand}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-border text-muted-foreground">Cartão de crédito</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-5 sm:p-6 lg:space-y-4 lg:p-4">
        <section aria-label={`Limite de ${card.name}`} className="space-y-4 lg:space-y-3">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Limite total</p>
              <p className="mt-1 break-words font-semibold tabular-nums">{formatCurrency(card.limitTotal)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Utilizado</p>
              <p className="mt-1 break-words font-semibold tabular-nums">{formatCurrency(card.limitUsed)}</p>
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <p className="text-xs text-muted-foreground">Disponível</p>
              <p className="mt-1 break-words font-semibold tabular-nums text-primary">{formatCurrency(card.limitAvailable)}</p>
            </div>
          </div>
          <Progress value={usedPercent} aria-label={`Limite utilizado de ${card.name}`} className="h-2 [&>div]:bg-primary" />
        </section>

        <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:pt-3">
          <p className="text-sm text-muted-foreground">Fechamento <span className="font-semibold text-foreground">dia {card.closingDay}</span></p>
          <p className="text-sm text-muted-foreground sm:text-right">Vencimento <span className="font-semibold text-foreground">dia {card.dueDay}</span></p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:gap-2">
          <section className="min-w-0 rounded-lg border border-border bg-background/60 p-4 lg:p-3" aria-label="Resumo da fatura">
            <p className="text-sm text-muted-foreground">Fatura atual</p>
            <p className="mt-1 break-words text-xl font-semibold tabular-nums lg:text-base">{formatCurrency(card.invoiceAmount)}</p>
            <p className="mt-2 text-xs text-muted-foreground">{card.invoiceStatusLabel}</p>
          </section>
          <section className="min-w-0 rounded-lg border border-border bg-background/60 p-4 lg:p-3" aria-label="Próxima fatura">
            <p className="text-sm text-muted-foreground">Próxima fatura</p>
            <p className="mt-1 break-words text-xl font-semibold tabular-nums lg:text-base">{formatCurrency(card.nextInvoiceAmount)}</p>
          </section>
          <section className="min-w-0 rounded-lg border border-border bg-background/60 p-4 sm:col-span-2 lg:p-3" aria-label="Compras parceladas">
            <p className="text-sm text-muted-foreground">Compras parceladas</p>
            <p className="mt-1 text-xl font-semibold tabular-nums lg:text-base">{card.installmentsCount}</p>
            <p className="mt-2 text-xs text-muted-foreground">Acompanhamento de parcelas vinculado ao cartão.</p>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
