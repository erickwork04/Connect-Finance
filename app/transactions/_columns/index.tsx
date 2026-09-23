"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { TRANSACTION_PAYMENT_METHOD_LABELS } from "@/app/_constanst/transactions";
import type { TransactionRow } from "../_lib/transaction-row";
import TransactionTypeBadge from "../_components/type-badge";
import EditTransactionButton from "../_components/edit-transaction-button";
import DeleteTransactionButton from "../_components/delete-transaction-button";
import { TransactionAmount, TransactionCategoryLabel, TransactionDate, TransactionSourceBadge } from "../_components/transaction-row-parts";

export const transactionColumns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row: { original } }) => <TransactionDate date={original.date} />,
  },
  {
    accessorKey: "name",
    header: "Descrição",
    cell: ({ row: { original } }) => <div className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 max-w-[220px] truncate font-medium 2xl:max-w-[320px]" title={original.name}>{original.name}</span>
      <TransactionSourceBadge source={original.source} />
    </div>,
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row: { original } }) => <TransactionCategoryLabel category={original.category} />,
  },
  {
    accessorKey: "paymentMethod",
    header: "Método",
    cell: ({ row: { original } }) => <span className="block truncate text-xs text-muted-foreground" title={TRANSACTION_PAYMENT_METHOD_LABELS[original.paymentMethod]}>{TRANSACTION_PAYMENT_METHOD_LABELS[original.paymentMethod]}</span>,
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row: { original } }) => <TransactionTypeBadge type={original.type} />,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row: { original } }) => <div className="whitespace-nowrap text-right"><TransactionAmount amount={original.amount} type={original.type} /></div>,
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row: { original } }) => <div className="flex items-center justify-end gap-1">
      <EditTransactionButton transaction={original} />
      <DeleteTransactionButton transactionId={original.id} />
    </div>,
  },
];
