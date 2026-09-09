"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { ConfirmImportResult, ParsedTransaction } from "@/app/_lib/import/types";
import { revalidatePath } from "next/cache";
import { getCurrentMonthTransactions } from "@/app/_data/get-dashboard/get-current-month-transactions";
import { TransactionSource } from "@prisma/client";

export async function confirmImportTransactions(
  transactionsToImport: ParsedTransaction[],
  totalCandidates: number,
  importBatchId?: string,
  fileName?: string,
  source?: TransactionSource,
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
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const isPremium = user.publicMetadata?.subscriptionPlan === "premium";

  if (!isPremium) {
    const currentMonthCount = await getCurrentMonthTransactions();
    const availableSlots = Math.max(0, 10 - currentMonthCount);

    if (availableSlots <= 0) {
      return {
        success: false,
        importedCount: 0,
        ignoredCount: 0,
        alreadyExistedCount: 0,
        errorMessage:
          "Você atingiu o limite de 10 transações mensais do plano gratuito. Faça upgrade para o plano Premium para importar ilimitado.",
      };
    }

    if (transactionsToImport.length > availableSlots) {
      return {
        success: false,
        importedCount: 0,
        ignoredCount: 0,
        alreadyExistedCount: 0,
        errorMessage: `Você só possui ${availableSlots} ${availableSlots === 1 ? "vaga restante" : "vagas restantes"} no plano gratuito para este mês. Selecione no máximo ${availableSlots} transações ou assine o plano Premium.`,
      };
    }
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
  }> = [];

  let alreadyExistedCount = 0;

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

      // Bulk create transactions linked to the batch
      await tx.transaction.createMany({
        data: toCreate,
      });
    });
  }

  const importedCount = toCreate.length;
  const ignoredCount = Math.max(0, totalCandidates - importedCount - alreadyExistedCount);

  revalidatePath("/");
  revalidatePath("/transactions");

  return {
    success: true,
    importedCount,
    ignoredCount,
    alreadyExistedCount,
  };
}
