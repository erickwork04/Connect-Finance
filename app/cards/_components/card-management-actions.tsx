"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ActionTooltip from "@/app/_components/action-tooltip";
import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import { CardDeleteForm, CardEditForm } from "@/app/_components/finance-forms";
import type { CardView } from "./card-overview";

type Mode = "edit" | "delete" | null;

export default function CardManagementActions({ card }: { card: CardView }) {
  const [mode, setMode] = useState<Mode>(null);
  const done = () => setMode(null);

  return <>
    <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
      <ActionTooltip content={`Editar cartão ${card.name}`}>
        <Button type="button" variant="outline" aria-label={`Editar cartão ${card.name}`} aria-haspopup="dialog" onClick={() => setMode("edit")} className="min-h-11 border-white/15 bg-[#1c211e] text-slate-200 hover:bg-[#252c27]">
          <Pencil aria-hidden="true" /> Editar
        </Button>
      </ActionTooltip>
      <ActionTooltip content={`Arquivar cartão ${card.name}`}>
        <Button type="button" variant="outline" size="icon" aria-label={`Arquivar cartão ${card.name}`} aria-haspopup="dialog" onClick={() => setMode("delete")} className="min-h-11 border-slate-700 bg-[#1c211e] text-rose-400 hover:bg-rose-950/40 hover:text-rose-300">
          <Trash2 aria-hidden="true" />
        </Button>
      </ActionTooltip>
    </div>
    <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) setMode(null); }}>
      <DialogContent className="border-white/10 bg-[#141816]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? `Editar ${card.name}` : `Arquivar cartão ${card.name}?`}</DialogTitle>
          <DialogDescription>{mode === "edit" ? "Atualize os dados do cartão. A edição não altera o limite de cartões do plano." : "O cartão deixará de aparecer entre os ativos. Faturas e parcelamentos vinculados serão mantidos."}</DialogDescription>
        </DialogHeader>
        {mode === "edit" ? <CardEditForm key={card.id} card={card} onSuccess={done} /> : mode === "delete" ? <CardDeleteForm cardId={card.id} onSuccess={done} /> : null}
      </DialogContent>
    </Dialog>
  </>;
}
