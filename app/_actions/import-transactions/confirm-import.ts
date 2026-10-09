"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { ConfirmImportResult, ParsedTransaction } from "@/app/_lib/import/types";
import { revalidatePath } from "next/cache";
import { getPlanPermissions } from "@/app/_lib/plan-permissions";
import { TransactionSource } from "@prisma/client";
import { monthlyDueDate, shiftYearMonth, YEAR_MONTH_PATTERN } from "@/app/_lib/month-range";

export async function confirmImportTransactions(
  transactionsToImport: ParsedTransaction[],
  totalCandidates: number,
  importBatchId?: string,
  fileName?: string,
  source?: TransactionSource,
  invoiceMonth?: string,
): Promise<ConfirmImportResult> {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      importedCount: 0,
      ignoredCount: 0,
      alreadyExistedCount: 0,
      errorMessage: "Usuário não autenticado.",
    };
  }

  if (!transactionsToImport || transactionsToImport.length === 0) {
    return {
      success: false,
      importedCount: 0,
      ignoredCount: 0,
      alreadyExistedCount: 0,
      errorMessage: "Nenhuma transação foi selecionada para importação.",
    };
  }

  // Check subscription limits for free users
  const permissions = await getPlanPermissions(userId);
  if (!permissions.canImportFiles) {
    return { success: false, importedCount: 0, ignoredCount: 0, alreadyExistedCount: 0, errorMessage: "Importação exclusiva do Premium. Assine o Premium para importar faturas e arquivos bancários." };
  }

  // Re-verify already imported items in database to prevent concurrent duplication
  const hashesToImport = transactionsToImport
    .map((t) => t.importHash)
    .filter(Boolean);
  const extIdsToImport = transactionsToImport
    .filter((t) => !!t.externalId)
    .map((t) => t.externalId!);

  const existingInDb = await db.transaction.findMany({
    where: {
      userId,
      OR: [
        { importHash: { in: hashesToImport } },
        ...(extIdsToImport.length > 0
          ? [{ externalId: { in: extIdsToImport } }]
          : []),
      ],
    },
    select: {
      importHash: true,
      externalId: true,
    },
  });

  // Track counts of existing hashes to allow multiple legitimate identical transactions
  const existingHashCounts = new Map<string, number>();
  const existingExtIds = new Set<string>();

  for (const t of existingInDb) {
    if (t.importHash) {
      existingHashCounts.set(
        t.importHash,
        (existingHashCounts.get(t.importHash) || 0) + 1,
      );
    }
    if (t.externalId) {
      existingExtIds.add(t.externalId);
    }
  }

  const finalBatchId = importBatchId || crypto.randomUUID();
  const batchSource = source || transactionsToImport[0]?.source || TransactionSource.CSV;
  const batchFileName = fileName || "importacao";
  const selectedInvoiceMonth = batchSource === TransactionSource.CARD_INVOICE && invoiceMonth && YEAR_MONTH_PATTERN.test(invoiceMonth)
    ? invoiceMonth
    : undefined;

  const toCreate: Array<{
    name: string;
    amount: number;
    type: ParsedTransaction["type"];
    category: ParsedTransaction["selectedCategory"];
    paymentMethod: ParsedTransaction["paymentMethod"];
    date: Date;
    userId: string;
    source: ParsedTransaction["source"];
    externalId?: string | null;
    importHash?: string | null;
    importBatchId: string;
    installmentInfo?: ParsedTransaction["installmentInfo"];
  }> = [];

  let alreadyExistedCount = 0;
  let installmentsAdded = 0;

  for (const t of transactionsToImport) {
    // Check externalId uniqueness first
    if (t.externalId && existingExtIds.has(t.externalId)) {
      alreadyExistedCount++;
      continue;
    }

    // Check hash count
    const remainingInDb = t.importHash ? existingHashCounts.get(t.importHash) || 0 : 0;
    if (remainingInDb > 0) {
      // Consume one existing match
      existingHashCounts.set(t.importHash, remainingInDb - 1);
      alreadyExistedCount++;
      continue;
    }

    toCreate.push({
      name: t.name,
      amount: t.amount,
      type: t.type,
      category: t.selectedCategory,
      paymentMethod: t.paymentMethod,
      date: new Date(t.date),
      userId,
      source: t.source,
      externalId: t.externalId || null,
      importHash: t.importHash || null,
      importBatchId: finalBatchId,
      installmentInfo: t.source === TransactionSource.CARD_INVOICE && t.type === "EXPENSE" && t.installmentInfo &&
        Number.isInteger(t.installmentInfo.current) && Number.isInteger(t.installmentInfo.total) &&
        t.installmentInfo.current >= 1 && t.installmentInfo.total >= t.installmentInfo.current && t.installmentInfo.total <= 120 &&
        typeof t.installmentInfo.description === "string" && t.installmentInfo.description.trim().length > 0
        ? { ...t.installmentInfo, description: t.installmentInfo.description.trim().slice(0, 120) }
        : undefined,
    });
  }

  if (toCreate.length > 0) {
    await db.$transaction(async (tx) => {
      // Create batch record
      await tx.importBatch.create({
        data: {
          id: finalBatchId,
          userId,
          fileName: batchFileName,
          source: batchSource,
          totalTransactions: toCreate.length,
        },
      });

      // Keep regular rows batched; installment rows need a transaction id so the
      // already billed installment can be recorded as paid without double-counting.
      const regularRows = toCreate.filter((item) => !item.installmentInfo).map((item) => {
        const row = { ...item };
        delete row.installmentInfo;
        return row;
      });
      if (regularRows.length) await tx.transaction.createMany({ data: regularRows });

      for (const item of toCreate) {
        if (!item.installmentInfo) continue;
        const { installmentInfo, ...transactionData } = item;
        const createdTransaction = await tx.transaction.create({ data: transactionData, select: { id: true } });
        const existingPlan = item.importHash
          ? await tx.installmentPlan.findUnique({ where: { sourceImportHash: item.importHash }, select: { id: true } })
          : null;
        if (existingPlan) continue;

        const billedMonth = selectedInvoiceMonth ?? item.date.toISOString().slice(0, 7);
        const plan = await tx.installmentPlan.create({ data: {
          userId,
          description: installmentInfo.description,
          totalAmount: Math.round(item.amount * installmentInfo.total * 100) / 100,
          installmentAmount: item.amount,
          installmentCount: installmentInfo.total,
          startMonth: shiftYearMonth(billedMonth, 1 - installmentInfo.current),
          sourceImportHash: item.importHash,
          status: "ACTIVE",
        }, select: { id: true } });
        installmentsAdded++;

        await tx.monthlyCommitment.create({ data: {
          userId,
          installmentPlanId: plan.id,
          occurrenceMonth: billedMonth,
          description: `${installmentInfo.description} · parcela ${installmentInfo.current}/${installmentInfo.total}`,
          amount: item.amount,
          dueDate: monthlyDueDate(billedMonth, 1),
          category: item.category,
          status: "PAID",
          transactionId: createdTransaction.id,
        } });
      }
    });
  }

  const importedCount = toCreate.length;
  const ignoredCount = Math.max(0, totalCandidates - importedCount - alreadyExistedCount);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/cards");
  revalidatePath("/installments");

  return {
    success: true,
    importedCount,
    installmentsAdded,
    ignoredCount,
    alreadyExistedCount,
  };
}
