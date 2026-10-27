"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { ConfirmImportResult, ParsedTransaction } from "@/app/_lib/import/types";
import { revalidatePath } from "next/cache";
import { getPlanPermissions } from "@/app/_lib/plan-permissions";
import { TransactionSource } from "@prisma/client";
import { monthlyDueDate, shiftYearMonth, YEAR_MONTH_PATTERN } from "@/app/_lib/month-range";
import { persistImportBatch, type ImportBatchRow } from "./persist-import-batch";

export async function confirmImportTransactions(
  transactionsToImport: ParsedTransaction[],
  totalCandidates: number,
  importBatchId?: string,
  fileName?: string,
  source?: TransactionSource,
  invoiceMonth?: string,
  invoiceCardId?: string,
  invoiceAmount?: number,
): Promise<ConfirmImportResult> {
  const startedAt = performance.now();
  const batchSource = source || transactionsToImport[0]?.source || TransactionSource.CSV;
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

  const isCardInvoice = batchSource === TransactionSource.CARD_INVOICE;
  if ((!transactionsToImport || transactionsToImport.length === 0) && !(isCardInvoice && totalCandidates > 0)) {
    return {
      success: false,
      importedCount: 0,
      ignoredCount: 0,
      alreadyExistedCount: 0,
      errorMessage: "Nenhuma transação foi selecionada para importação.",
    };
  }
  if (transactionsToImport.length > 2_000) {
    return { success: false, importedCount: 0, ignoredCount: 0, alreadyExistedCount: 0,
      errorMessage: "A importação aceita até 2.000 transações por vez. Divida o arquivo e tente novamente." };
  }
  if (totalCandidates < 1 || totalCandidates > 2_000) {
    return { success: false, importedCount: 0, ignoredCount: 0, alreadyExistedCount: 0,
      errorMessage: "O arquivo precisa conter entre 1 e 2.000 transações." };
  }

  // Check subscription limits for free users
  const permissions = await getPlanPermissions(userId);
  if (!permissions.canImportFiles) {
    return { success: false, importedCount: 0, ignoredCount: 0, alreadyExistedCount: 0, errorMessage: "Importação exclusiva do Premium. Assine o Premium para importar faturas e arquivos bancários." };
  }

  let cardInvoice: { cardId: string; month: string; amount: number } | undefined;
  if (isCardInvoice) {
    const safeInvoiceAmount = typeof invoiceAmount === "number" && Number.isFinite(invoiceAmount)
      ? Math.round(invoiceAmount * 100) / 100
      : -1;
    if (!invoiceCardId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invoiceCardId)) {
      return { success: false, importedCount: 0, ignoredCount: 0, alreadyExistedCount: 0, errorMessage: "Selecione um cartão válido para esta fatura." };
    }
    if (!invoiceMonth || !YEAR_MONTH_PATTERN.test(invoiceMonth)) {
      return { success: false, importedCount: 0, ignoredCount: 0, alreadyExistedCount: 0, errorMessage: "Selecione um mês válido para a fatura." };
    }
    if (safeInvoiceAmount < 0 || safeInvoiceAmount > 9_999_999_999.99) {
      return { success: false, importedCount: 0, ignoredCount: 0, alreadyExistedCount: 0, errorMessage: "Não foi possível calcular o total da fatura. Confira os valores do arquivo." };
    }
    const card = await db.creditCard.findFirst({
      where: { id: invoiceCardId, userId, isActive: true },
      select: { id: true },
    });
    if (!card) {
      return { success: false, importedCount: 0, ignoredCount: 0, alreadyExistedCount: 0, errorMessage: "O cartão selecionado não está disponível para esta conta." };
    }
    cardInvoice = { cardId: card.id, month: invoiceMonth, amount: safeInvoiceAmount };
  }

  // Re-verify already imported items in database to prevent concurrent duplication
  const hashesToImport = transactionsToImport
    .map((t) => t.importHash)
    .filter(Boolean);
  const extIdsToImport = transactionsToImport
    .filter((t) => !!t.externalId)
    .map((t) => t.externalId!);

  const existingInDb = transactionsToImport.length > 0
    ? await db.transaction.findMany({
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
      })
    : [];

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
  const batchFileName = fileName || "importacao";
  const selectedInvoiceMonth = batchSource === TransactionSource.CARD_INVOICE && invoiceMonth && YEAR_MONTH_PATTERN.test(invoiceMonth)
    ? invoiceMonth
    : undefined;

  const toCreate: ImportBatchRow[] = [];

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

  if (toCreate.length > 0 || cardInvoice) {
    try {
      const persisted = await db.$transaction((tx) => persistImportBatch(tx, {
        userId,
        batchId: finalBatchId,
        fileName: batchFileName,
        source: batchSource,
        rows: toCreate,
        invoiceMonth: selectedInvoiceMonth,
        cardInvoice,
        shiftYearMonth,
        monthlyDueDate,
      }));
      if (persisted.invoiceUpdateRejected) {
        return { success: false, importedCount: 0, ignoredCount: 0, alreadyExistedCount: 0,
          errorMessage: "O total importado não pode ser menor que o valor já pago nesta fatura. Confira o mês e o arquivo selecionados." };
      }
      installmentsAdded = persisted.installmentsAdded;
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "unknown";
      console.error(JSON.stringify({ event: "import_persist_failed", code, rowCount: toCreate.length, durationMs: Math.round(performance.now() - startedAt) }));
      throw error;
    }
  }

  const importedCount = toCreate.length;
  const ignoredCount = Math.max(0, totalCandidates - importedCount - alreadyExistedCount);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/cards");
  revalidatePath("/installments");
  console.info(JSON.stringify({ event: "import_persist_succeeded", rowCount: importedCount, installmentCount: installmentsAdded,
    duplicateCount: alreadyExistedCount, durationMs: Math.round(performance.now() - startedAt) }));

  return {
    success: true,
    importedCount,
    installmentsAdded,
    ignoredCount,
    alreadyExistedCount,
  };
}
