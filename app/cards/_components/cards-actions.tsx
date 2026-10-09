"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ReceiptText } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { CardForm, InvoiceForm } from "@/app/_components/finance-forms";
import PremiumUpgradeDialog from "@/app/_components/premium-upgrade-dialog";

type ActionMode = "card" | "invoice" | null;

export default function CardsActions({ cards, month, canCreateCard = true }: { cards: { id: string; name: string }[]; month: string; canCreateCard?: boolean }) {
  const [mode, setMode] = useState<ActionMode>(null);
  const [premiumNoticeOpen, setPremiumNoticeOpen] = useState(false);
  const router = useRouter();
  const done = () => { setMode(null); router.refresh(); };

  return <><div className="grid w-full grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap">
    <Button type="button" onClick={() => canCreateCard ? setMode("card") : setPremiumNoticeOpen(true)} className="min-h-11 border border-blue-500 bg-blue-500 px-4 text-white hover:bg-blue-600"><Plus aria-hidden="true" />Adicionar Cartão</Button>
    <Button type="button" variant="outline" disabled={cards.length === 0} onClick={() => setMode("invoice")} className="min-h-11 border-slate-700 bg-[#171c23] px-3 text-slate-200 hover:bg-slate-800"><ReceiptText aria-hidden="true" />Lançar fatura</Button>
    <Button asChild variant="outline" className="min-h-11 border-slate-700 bg-[#171c23] px-3 text-slate-200 hover:bg-slate-800 min-[480px]:col-span-2 sm:col-auto"><Link href={`/installments?month=${month}`}>Compras parceladas</Link></Button>
  </div>
    <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) setMode(null); }}>
      <DialogContent className="w-[calc(100%-24px)] max-w-lg max-h-[90vh] overflow-y-auto border-slate-700 bg-[#0e1319] p-4 sm:p-6">
        <DialogHeader><DialogTitle>{mode === "card" ? "Adicionar cartão" : "Lançar fatura"}</DialogTitle><DialogDescription>{mode === "invoice" ? "Informe o valor e o mês da fatura do cartão." : "Cadastre um cartão para acompanhar limites e faturas."}</DialogDescription></DialogHeader>
        {mode === "card" ? <CardForm onSuccess={done} /> : mode === "invoice" ? <InvoiceForm key={month} cards={cards} month={month} onSuccess={done} /> : null}
      </DialogContent>
    </Dialog>
    <PremiumUpgradeDialog open={premiumNoticeOpen} onOpenChange={setPremiumNoticeOpen} title="Limite do plano gratuito atingido" description="O plano Free permite cadastrar até 1 cartão de crédito. Assine o Premium para cadastrar cartões ilimitados." />
  </>;
}
