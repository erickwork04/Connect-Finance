"use client";

import { useState, type FormEvent } from "react";
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
import { toast } from "sonner";

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
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setState(initialState);
    setPending(true);
    try {
      const result = await payCardInvoice(state, new FormData(event.currentTarget));
      setState(result);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      }
    } catch {
      setState({ message: "Falha de conexão ao registrar o pagamento. O valor informado foi mantido; tente novamente.", success: false });
    } finally {
      setPending(false);
    }
  };

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
        aria-haspopup="dialog"
        onClick={() => {
          setState(initialState);
          setPayment(showLimits ? outstanding : undefined);
          setOpen(true);
        }}
        title={canPay ? `Registra no Connect Finance um pagamento já feito no banco para ${cardName}` : "Não há saldo de fatura em aberto neste mês"}
        className="min-h-11 w-full border border-primary bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
      >
        <CircleDollarSign aria-hidden="true" className="h-4 w-4" />
        {canPay ? "Registrar pagamento" : "Fatura em dia"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeDisabled={pending} className="w-[calc(100%-24px)] max-w-md border-white/10 bg-[#141816] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Registrar pagamento da fatura</DialogTitle>
            <DialogDescription>
              Registre o pagamento que você já fez no banco para a fatura do cartão {cardName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} aria-busy={pending} className="space-y-4">
            <input type="hidden" name="cardId" value={cardId} />
            <input type="hidden" name="month" value={month} />

            <section aria-label="Resumo da fatura" className="space-y-2 rounded-xl border border-white/10 bg-[#1c211e] p-4 text-sm">
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
                className="h-11 border-white/15 bg-[#1c211e] text-white focus-visible:ring-primary"
                placeholder="R$ 0,00"
              />
              <p id={`payment-help-${cardId}`} className="text-xs text-slate-400">
                {showLimits
                  ? `Informe até ${formatCurrency(outstanding)}. Pagamentos parciais deixam o restante em aberto.`
                  : "Informe o valor pago. Pagamentos parciais deixam o restante em aberto."}
              </p>
            </div>

            {showLimits ? (
              <div role="group" aria-label="Preencher valor como parte da fatura em aberto" className="grid grid-cols-3 gap-2">
                {[50, 75, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    aria-label={`Preencher ${percentage}% da fatura em aberto`}
                    title={`Preencher ${percentage}% do valor em aberto`}
                    onClick={() => changePayment(percentage / 100)}
                    className="min-h-10 bg-[#252c27] text-slate-100 hover:bg-[#2e3831]"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            ) : null}

            <p aria-live="polite" className="rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-3 text-sm font-medium text-emerald-200">
              Limite disponível após o pagamento: {showLimits && payment !== undefined ? formatCurrency(availableAfterPayment) : mask}
            </p>

            {state.message ? (
              <p role={state.success ? "status" : "alert"} className={`text-sm ${state.success ? "text-emerald-400" : "text-rose-400"}`}>
                {state.message}
              </p>
            ) : null}

            {pending ? <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Registrando pagamento desta fatura...</p> : null}
            <DialogFooter className="flex-row gap-2 sm:space-x-0">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)} className="min-h-11 flex-1 border-white/15 bg-transparent text-slate-100 hover:bg-[#1c211e]">
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || !payment || payment <= 0 || payment > outstanding} className="min-h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {pending ? "Registrando pagamento..." : "Confirmar pagamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
