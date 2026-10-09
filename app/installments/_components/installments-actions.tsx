"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import { InstallmentForm } from "@/app/_components/finance-forms";

export default function InstallmentsActions({ cards, month }: { cards: { id: string; name: string }[]; month: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return <>
    <Button type="button" onClick={() => setOpen(true)} className="min-h-11"><Plus aria-hidden="true" />Nova compra parcelada</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-24px)] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader><DialogTitle>Nova compra parcelada</DialogTitle><DialogDescription>Cadastre a compra. As parcelas serão reservadas automaticamente no saldo dos meses correspondentes.</DialogDescription></DialogHeader>
        <InstallmentForm key={month} cards={cards} month={month} onSuccess={() => { setOpen(false); router.refresh(); }} />
      </DialogContent>
    </Dialog>
  </>;
}
