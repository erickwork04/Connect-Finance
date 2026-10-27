import { z } from "zod";

export const deleteTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  cardInvoiceId: z.string().uuid().optional(),
});

export type DeleteTransactionSchema = z.infer<typeof deleteTransactionSchema>;
