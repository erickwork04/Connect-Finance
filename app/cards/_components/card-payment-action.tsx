"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign } from "lucide-react";
import { payCardInvoice, type FinanceActionState } from "@/app/_actions/dashboard-v2";
import { CurrencyInput } from "@/app/_components/money-input";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { formatCurrency } from "@/app/_utils/currency";

const initialState: FinanceActionState = { message: "", success: false };
const mask = "••••••";

export default function CardPaymentAction({
  cardId,
  cardName,
  month,
  outstanding,
  paidAmount,
  limitTotal,
  limitAvailable,
  showLimits,
}: {
  cardId: string;
  cardName: string;
  month: string;
  outstanding: number;
  paidAmount: number;
  limitTotal: number;
  limitAvailable: number;
  showLimits: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [payment, setPayment] = useState<number | undefined>(showLimits ? outstanding : undefined);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (_previous: FinanceActionState, formData: FormData) => {
    const result = await payCardInvoice(_previous, formData);
    if (result.success) {
      setOpen(false);
      router.refresh();
    }
    return result;
  }, initialState);

  const canPay = outstanding > 0;
  const availableAfterPayment = limitAvailable + (payment ?? 0);
  const changePayment = (percentage: number) => {
    const cents = Math.round(outstanding * percentage);
    setPayment(cents / 100);
  };

  return (
    <>
      <Button
        type="button"
        disabled={!canPay}
        onClick={() => {
          setPayment(showLimits ? outstanding : undefined);
          setOpen(true);
        }}
        title={canPay ? "Registrar um pagamento feito no banco" : "Não há saldo de fatura em aberto neste mês"}
        className="min-h-11 w-full border border-blue-500 bg-blue-500 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
      >
        <CircleDollarSign aria-hidden="true" className="h-4 w-4" />
        {canPay ? "Pagar Fatura" : "Fatura em dia"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-24px)] max-w-md border-slate-700 bg-[#0e1319] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Pagar Fatura</DialogTitle>
            <DialogDescription>
              Registre o pagamento que você já fez no banco para a fatura do cartão {cardName}.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="cardId" value={cardId} />
            <input type="hidden" name="month" value={month} />

            <section aria-label="Resumo da fatura" className="space-y-2 rounded-xl bg-slate-700/90 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300">Fatura atual em aberto:</span>
                <strong className="tabular-nums text-white">{showLimits ? formatCurrency(outstanding) : mask}</strong>
              </div>
              {paidAmount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-300">Já pago nesta fatura:</span>
                  <strong className="tabular-nums text-white">{showLimits ? formatCurrency(paidAmount) : mask}</strong>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300">Limite total:</span>
                <strong className="tabular-nums text-white">{showLimits ? formatCurrency(limitTotal) : mask}</strong>
              </div>
            </section>

            <div className="grid gap-1.5">
              <label htmlFor={`payment-${cardId}`} className="text-sm font-medium text-slate-100">
                Valor do pagamento
              </label>
              <CurrencyInput
                id={`payment-${cardId}`}
                name="amount"
                value={payment}
                onChange={setPayment}
                disabled={pending}
                aria-describedby={`payment-help-${cardId}`}
                className="h-11 border-slate-700 bg-slate-800 text-white focus-visible:ring-blue-400"
                placeholder="R$ 0,00"
              />
              <p id={`payment-help-${cardId}`} className="text-xs text-slate-400">
                {showLimits
                  ? `Informe até ${formatCurrency(outstanding)}. Pagamentos parciais deixam o restante em aberto.`
                  : "Informe o valor pago. Pagamentos parciais deixam o restante em aberto."}
              </p>
            </div>

            {showLimits ? (
              <div className="grid grid-cols-3 gap-2" aria-label="Sugestões de pagamento">
                {[50, 75, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => changePayment(percentage / 100)}
                    className="min-h-10 bg-slate-800 text-slate-100 hover:bg-slate-700"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            ) : null}

            <p aria-live="polite" className="rounded-xl bg-blue-100 px-3.5 py-3 text-sm font-medium text-blue-950">
              Limite disponível após o pagamento: {showLimits && payment !== undefined ? formatCurrency(availableAfterPayment) : mask}
            </p>

            {state.message ? (
              <p role={state.success ? "status" : "alert"} className={`text-sm ${state.success ? "text-emerald-400" : "text-rose-400"}`}>
                {state.message}
              </p>
            ) : null}

            <DialogFooter className="flex-row gap-2 sm:space-x-0">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)} className="min-h-11 flex-1 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800">
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || !payment || payment <= 0 || payment > outstanding} className="min-h-11 flex-1 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50">
                {pending ? "Salvando..." : "Confirmar Pagamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
