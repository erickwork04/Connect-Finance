"use client";

import { useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { formatCurrency } from "@/app/_utils/currency";
import { previewCoupon, type CouponPreview } from "../_actions/preview-coupon";
import { PREMIUM_BASE_CENTS } from "../_lib/coupon-pricing";
import { showCouponError } from "./coupon-toast";

const MercadoPagoPayment = dynamic(() => import("./mercado-pago-payment"), {
  ssr: false,
  loading: () => <p role="status" className="text-sm text-muted-foreground">Carregando formulário de pagamento...</p>,
});

export default function AcquirePlanButton({ hasPremiumPlan }: { hasPremiumPlan: boolean }) {
  const [showPayment, setShowPayment] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [quote, setQuote] = useState<Extract<CouponPreview, { ok: true }> | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (hasPremiumPlan) {
    return (
      <div className="space-y-2">
        <Button disabled type="button" className="h-11 w-full rounded-full">Gerenciar assinatura</Button>
        <p className="text-xs leading-5 text-muted-foreground">O gerenciamento online ainda não está disponível nesta aplicação.</p>
      </div>
    );
  }

  const applyCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsApplying(true);
    try {
      const result = await previewCoupon(couponCode);
      if (!result.ok) {
        setQuote(null);
        showCouponError(result.code);
        return;
      }
      setCouponCode(result.code);
      setQuote(result);
      toast.success("Cupom aplicado com sucesso", {
        description: `Você economizou ${formatCurrency(result.discountCents / 100)} neste pagamento.`,
      });
    } catch {
      setQuote(null);
      showCouponError("unavailable");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      <form onSubmit={applyCoupon} className="space-y-2">
        <label htmlFor="premium-coupon" className="text-sm font-medium">Cupom</label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <Input
            id="premium-coupon"
            name="coupon"
            autoComplete="off"
            maxLength={40}
            placeholder="Digite seu cupom"
            value={couponCode}
            onChange={(event) => {
              setCouponCode(event.target.value);
              setQuote(null);
              setShowPayment(false);
            }}
            className="h-11 min-w-0 flex-1 uppercase"
          />
          <Button type="submit" variant="outline" disabled={isApplying || !couponCode.trim()} className="h-11 shrink-0">
            {isApplying ? "Validando..." : "Aplicar"}
          </Button>
        </div>
      </form>

      <div className="space-y-2 rounded-lg border border-border bg-background/50 p-4 text-sm">
        <div className="flex justify-between gap-3 text-muted-foreground"><span>Plano Premium</span><span className="tabular-nums">{formatCurrency(PREMIUM_BASE_CENTS / 100)} / mês</span></div>
        {quote ? <div className="flex justify-between gap-3 text-primary"><span>Desconto ({quote.code})</span><span className="tabular-nums">−{formatCurrency(quote.discountCents / 100)}</span></div> : null}
        <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold"><span>Total hoje</span><span className="tabular-nums">{formatCurrency((quote?.finalCents ?? PREMIUM_BASE_CENTS) / 100)}</span></div>
        {quote ? <p className="text-xs leading-5 text-muted-foreground">
          {quote.firstCycleOnly
            ? `Hoje você paga ${formatCurrency(quote.finalCents / 100)}. Nos próximos meses, o valor será ${formatCurrency(PREMIUM_BASE_CENTS / 100)}.`
            : `Nos próximos meses, o valor será ${formatCurrency(quote.finalCents / 100)} por mês.`}
        </p> : null}
      </div>

      {showPayment ? (
        <div className="min-w-0 space-y-4">
          <div className="max-w-full overflow-x-auto">
            <MercadoPagoPayment key={quote?.code ?? "base"} couponCode={quote?.code} amountCents={quote?.finalCents ?? PREMIUM_BASE_CENTS} />
          </div>
          <Button type="button" variant="outline" className="h-11 w-full rounded-full" onClick={() => setShowPayment(false)}>Voltar</Button>
        </div>
      ) : (
        <Button type="button" className="h-11 w-full rounded-full font-bold" onClick={() => setShowPayment(true)}>Adquirir plano</Button>
      )}
      <p className="text-xs leading-5 text-muted-foreground">O cupom será confirmado antes da cobrança. A disponibilidade pode mudar até a contratação.</p>
    </div>
  );
}
