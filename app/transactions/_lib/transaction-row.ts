import type { Transaction } from "@prisma/client";

export type TransactionRow = Pick<
  Transaction,
  "id" | "name" | "type" | "category" | "paymentMethod" | "source"
> & {
  amount: string;
  date: string;
};

export function toTransactionRow(
  transaction: Pick<
    Transaction,
    "id" | "name" | "type" | "category" | "paymentMethod" | "source" | "amount" | "date"
  >,
): TransactionRow {
  return {
    id: transaction.id,
    name: transaction.name,
    type: transaction.type,
    category: transaction.category,
    paymentMethod: transaction.paymentMethod,
    source: transaction.source,
    amount: transaction.amount.toString(),
    date: transaction.date.toISOString(),
  };
}

export function toTransactionFormValues(transaction: TransactionRow) {
  return {
    name: transaction.name,
    type: transaction.type,
    category: transaction.category,
    paymentMethod: transaction.paymentMethod,
    amount: Number(transaction.amount),
    date: new Date(transaction.date),
  };
}
