"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, ReceiptText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { CardForm, InstallmentForm, InvoiceForm } from "@/app/_components/finance-forms";

type ActionMode = "card" | "invoice" | "installment" | null;

export default function CardsActions({ cards, month }: { cards: { id: string; name: string }[]; month: string }) {
  const [mode, setMode] = useState<ActionMode>(null);
  const router = useRouter();
  const done = () => { setMode(null); router.refresh(); };

  return <><div className="grid w-full grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap">
    <Button type="button" variant="outline" onClick={() => setMode("card")} className="min-h-11 px-3"><Plus aria-hidden="true" />Adicionar cartão</Button>
    <Button type="button" variant="outline" disabled={cards.length === 0} onClick={() => setMode("invoice")} className="min-h-11 px-3"><ReceiptText aria-hidden="true" />Lançar fatura</Button>
    <Button type="button" onClick={() => setMode("installment")} className="min-h-11 px-3 min-[480px]:col-span-2 sm:col-auto"><CreditCard aria-hidden="true" />Adicionar parcelamento</Button>
  </div>
    <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) setMode(null); }}>
      <DialogContent className="w-[calc(100%-24px)] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader><DialogTitle>{mode === "card" ? "Adicionar cartão" : mode === "invoice" ? "Lançar fatura" : "Adicionar parcelamento"}</DialogTitle><DialogDescription>{mode === "invoice" ? "Informe o valor e o mês da fatura do cartão." : mode === "installment" ? "Acompanhe o progresso da compra sem criar despesas automaticamente." : "Cadastre um cartão para acompanhar limites e faturas."}</DialogDescription></DialogHeader>
        {mode === "card" ? <CardForm onSuccess={done} /> : mode === "invoice" ? <InvoiceForm key={month} cards={cards} month={month} onSuccess={done} /> : mode === "installment" ? <InstallmentForm key={month} cards={cards} month={month} onSuccess={done} /> : null}
      </DialogContent>
    </Dialog>
  </>;
}
