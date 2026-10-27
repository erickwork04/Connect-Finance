"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import ActionTooltip from "@/app/_components/action-tooltip";
import { TrashIcon } from "lucide-react";
import { deleteTransaction } from "../_actions/delete-transactions";
import { toast } from "sonner";

interface DeleteTransactionButtonProps {
  transactionId: string;
  transactionName: string;
}

const DeleteTransactionButton = ({
  transactionId,
  transactionName,
}: DeleteTransactionButtonProps) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [invoiceChoices, setInvoiceChoices] = useState<{ id: string; cardName: string; month: string }[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const router = useRouter();

  const handleConfirmDeleteClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    setPending(true);
    try {
      const result = await deleteTransaction({ transactionId, cardInvoiceId: selectedInvoiceId || undefined });
      if (!result.success) {
        const message = result.error ?? "Não foi possível excluir a transação.";
        const choices = result.invoiceChoices ?? [];
        setInvoiceChoices(choices);
        if (!choices.some((invoice) => invoice.id === selectedInvoiceId)) setSelectedInvoiceId("");
        setError(message);
        if (choices.length === 0) toast.error(message);
        return;
      }
      setInvoiceChoices([]);
      setSelectedInvoiceId("");
      setOpen(false);
      router.refresh();
      toast.success("Transação deletada com sucesso!");
    } catch {
      setError("Falha ao excluir. A transação continua na lista; tente novamente.");
      console.error("Erro ao deletar transação.");
      toast.error("Ocorreu um erro ao deletar a transação");
    } finally {
      setPending(false);
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!pending) { setOpen(nextOpen); if (nextOpen) { setError(""); setInvoiceChoices([]); setSelectedInvoiceId(""); } } }}>
      <AlertDialogTrigger asChild>
        <ActionTooltip content={`Excluir transação ${transactionName}`}>
          <Button aria-label={`Excluir transação ${transactionName}`} variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-rose-400 sm:h-9 sm:w-9">
            <TrashIcon aria-hidden="true" />
          </Button>
        </ActionTooltip>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir a transação “{transactionName}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {pending ? <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Excluindo {transactionName}...</p> : null}
        {invoiceChoices.length > 0 ? <label className="grid gap-2 text-sm font-medium" htmlFor={`invoice-${transactionId}`}>
          Cartão desta compra
          <select id={`invoice-${transactionId}`} value={selectedInvoiceId} onChange={(event) => setSelectedInvoiceId(event.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <option value="">Selecione o cartão</option>
            {invoiceChoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.cardName} · {invoice.month}</option>)}
          </select>
        </label> : null}
        {error ? <p role="alert" aria-live="assertive" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={pending} aria-busy={pending} onClick={handleConfirmDeleteClick}>
            {invoiceChoices.length > 0 ? "Confirmar exclusão" : "Excluir transação"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTransactionButton;
