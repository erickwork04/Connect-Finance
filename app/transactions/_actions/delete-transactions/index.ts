"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { deleteTransactionSchema, type DeleteTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";

export const deleteTransaction = async ({
  transactionId,
  cardInvoiceId,
}: DeleteTransactionSchema): Promise<{
  success: boolean;
  error?: string;
  invoiceChoices?: { id: string; cardName: string; month: string }[];
}> => {
  const parsed = deleteTransactionSchema.safeParse({ transactionId, cardInvoiceId });
  if (!parsed.success) return { success: false, error: "Transação inválida." };

  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sua sessão expirou. Entre novamente." };

  try {
    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: parsed.data.transactionId, userId },
        select: {
          id: true,
          amount: true,
          type: true,
          source: true,
          date: true,
          commitment: { select: { id: true } },
        },
      });
      if (!transaction) return { error: "Transação não encontrada." };

      if (transaction.source === "CARD_INVOICE") {
        const month = `${transaction.date.getUTCFullYear()}-${String(transaction.date.getUTCMonth() + 1).padStart(2, "0")}`;
        let invoices = await tx.cardInvoice.findMany({
          where: { userId, month },
          select: { id: true, month: true, amount: true, paidAmount: true, status: true, card: { select: { name: true } } },
          take: 20,
        });

        if (invoices.length === 0) {
          // Billing month can differ from the transaction date. Offer open
          // invoices for an explicit choice instead of blocking the delete.
          invoices = await tx.cardInvoice.findMany({
            where: { userId, status: "OPEN" },
            select: { id: true, month: true, amount: true, paidAmount: true, status: true, card: { select: { name: true } } },
            orderBy: { month: "desc" },
            take: 20,
          });
        }

        if (!cardInvoiceId && invoices.length > 1) {
          return {
            error: "Selecione a fatura do cartão usada nesta compra para continuar.",
            invoiceChoices: invoices.map((invoice) => ({ id: invoice.id, cardName: invoice.card.name, month: invoice.month })),
          };
        }

        const invoice = cardInvoiceId
          ? invoices.find((candidate) => candidate.id === cardInvoiceId)
          : invoices[0];
        if (cardInvoiceId && !invoice) return { error: "A fatura selecionada não pertence a esta conta." };
        if (invoice?.status === "OPEN") {
          const transactionAmount = Number(transaction.amount);
          const nextAmount = Math.round((Number(invoice.amount) + (
            transaction.type === "EXPENSE" ? -transactionAmount :
              transaction.type === "DEPOSIT" ? transactionAmount : 0
          )) * 100) / 100;
          const paidAmount = Number(invoice.paidAmount);

          if (nextAmount < 0) {
            return { error: "O valor desta transação é maior que o total da fatura; confira os dados antes de excluir." };
          }
          if (nextAmount < paidAmount) {
            return { error: "A fatura já tem pagamentos que ultrapassariam o novo total. Ajuste o pagamento antes de excluir esta transação." };
          }

          await tx.cardInvoice.update({
            where: { id: invoice.id },
            data: { amount: nextAmount, status: paidAmount >= nextAmount ? "PAID" : "OPEN" },
          });
        }
      }

      // Keep the commitment and installment plan, but remove the restrictive FK.
      if (transaction.commitment) {
        await tx.monthlyCommitment.update({
          where: { id: transaction.commitment.id },
          data: { transactionId: null },
        });
      }
      await tx.transaction.delete({ where: { id: transaction.id } });
      return { error: null };
    }, { isolationLevel: "Serializable" });

    if (result.error) return {
      success: false,
      error: result.error,
      ...("invoiceChoices" in result ? { invoiceChoices: result.invoiceChoices } : {}),
    };
  } catch (error) {
    console.error("[delete_transaction_failed]", error instanceof Error ? error.name : "unknown");
    return { success: false, error: "Não foi possível excluir a transação. Tente novamente." };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/cards");
  revalidatePath("/installments");
  revalidatePath("/dashboard/commitments");
  return { success: true };
};
