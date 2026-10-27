import { randomUUID } from "node:crypto";
import type { Prisma, TransactionCategory, TransactionPaymentMethod, TransactionSource, TransactionType } from "@prisma/client";
import type { ImportInstallmentInfo } from "@/app/_lib/import/types";

export type ImportBatchRow = {
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
  userId: string;
  source: TransactionSource;
  externalId?: string | null;
  importHash?: string | null;
  importBatchId: string;
  installmentInfo?: ImportInstallmentInfo;
};

type ImportBatchInput = {
  userId: string;
  batchId: string;
  fileName: string;
  source: TransactionSource;
  rows: ImportBatchRow[];
  invoiceMonth?: string;
  shiftYearMonth: (month: string, offset: number) => string;
  monthlyDueDate: (month: string, day: number) => Date;
};

/**
 * Persists an import with a fixed number of Prisma operations, independent of
 * how many installment rows the file contains. IDs are allocated before the
 * bulk inserts so related commitments can reference the inserted rows.
 */
export async function persistImportBatch(tx: Prisma.TransactionClient, input: ImportBatchInput) {
  const installmentRows = input.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.installmentInfo !== undefined);
  const sourceHashes = [...new Set(installmentRows
    .map(({ row }) => row.importHash)
    .filter((hash): hash is string => Boolean(hash)))];

  const existingPlans = sourceHashes.length
    ? await tx.installmentPlan.findMany({
        where: { sourceImportHash: { in: sourceHashes } },
        select: { sourceImportHash: true },
      })
    : [];
  const knownHashes = new Set(existingPlans.flatMap((plan) => plan.sourceImportHash ? [plan.sourceImportHash] : []));

  const transactionRows = input.rows.map((row) => {
    const data = { ...row };
    delete data.installmentInfo;
    return { id: randomUUID(), ...data };
  });
  const plansToCreate: Prisma.InstallmentPlanCreateManyInput[] = [];
  const commitmentsToCreate: Prisma.MonthlyCommitmentCreateManyInput[] = [];

  for (const { row, index } of installmentRows) {
    const info = row.installmentInfo!;
    if (row.importHash && knownHashes.has(row.importHash)) continue;

    const billedMonth = input.invoiceMonth ?? row.date.toISOString().slice(0, 7);
    const planId = randomUUID();
    plansToCreate.push({
      id: planId,
      userId: input.userId,
      description: info.description,
      totalAmount: Math.round(row.amount * info.total * 100) / 100,
      installmentAmount: row.amount,
      installmentCount: info.total,
      startMonth: input.shiftYearMonth(billedMonth, 1 - info.current),
      sourceImportHash: row.importHash,
      status: "ACTIVE",
    });
    commitmentsToCreate.push({
      id: randomUUID(),
      userId: input.userId,
      installmentPlanId: planId,
      occurrenceMonth: billedMonth,
      description: `${info.description} · parcela ${info.current}/${info.total}`,
      amount: row.amount,
      dueDate: input.monthlyDueDate(billedMonth, 1),
      category: row.category,
      status: "PAID",
      transactionId: transactionRows[index].id,
    });
    if (row.importHash) knownHashes.add(row.importHash);
  }

  await tx.importBatch.create({
    data: {
      id: input.batchId,
      userId: input.userId,
      fileName: input.fileName,
      source: input.source,
      totalTransactions: input.rows.length,
    },
  });
  if (transactionRows.length) await tx.transaction.createMany({ data: transactionRows });
  if (plansToCreate.length) await tx.installmentPlan.createMany({ data: plansToCreate });
  if (commitmentsToCreate.length) await tx.monthlyCommitment.createMany({ data: commitmentsToCreate });

  return { installmentsAdded: plansToCreate.length };
}
