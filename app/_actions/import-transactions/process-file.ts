"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { suggestCategory } from "@/app/_lib/import/categorizer";
import { generateTransactionHash, normalizeDescription } from "@/app/_lib/import/hash";
import { parseOfx } from "@/app/_lib/import/ofx-parser";
import { parseCsv } from "@/app/_lib/import/csv-parser";
import {
  ImportMode,
  ParsedTransaction,
  ProcessFileResult,
} from "@/app/_lib/import/types";
import { TransactionSource } from "@prisma/client";

const THREE_MINUTES_MS = 3 * 60 * 1000;

/**
 * Checks if two dates fall on the same calendar day (checking both local and UTC)
 */
function isSameDay(d1: Date, d2: Date): boolean {
  const localMatch =
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const utcMatch =
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate();

  return localMatch || utcMatch;
}

/**
 * Server action to process an uploaded file content, run duplicate checks,
 * auto-categorize, and prepare preview data with a unique importBatchId.
 */
export async function processImportFile(
  fileContent: string,
  fileName: string,
  mode: ImportMode,
): Promise<ProcessFileResult> {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      transactions: [],
      totalFound: 0,
      newCount: 0,
      possibleDuplicateCount: 0,
      alreadyImportedCount: 0,
      errorMessage: "Usuário não autenticado.",
    };
  }

  if (!fileContent || fileContent.trim().length === 0) {
    return {
      success: false,
      transactions: [],
      totalFound: 0,
      newCount: 0,
      possibleDuplicateCount: 0,
      alreadyImportedCount: 0,
      errorMessage: "O arquivo selecionado está vazio.",
    };
  }

  // Generate unique import batch identifier
  const importBatchId = crypto.randomUUID();

  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  let rawItems = [];

  try {
    if (extension === "ofx") {
      rawItems = parseOfx(fileContent);
    } else if (extension === "csv" || extension === "txt") {
      rawItems = parseCsv(fileContent, mode);
    } else {
      return {
        success: false,
        transactions: [],
        totalFound: 0,
        newCount: 0,
        possibleDuplicateCount: 0,
        alreadyImportedCount: 0,
        errorMessage: `Formato de arquivo .${extension} não suportado. Por favor, envie um arquivo OFX ou CSV.`,
      };
    }
  } catch (err) {
    console.error("Error parsing file:", err);
    return {
      success: false,
      transactions: [],
      totalFound: 0,
      newCount: 0,
      possibleDuplicateCount: 0,
      alreadyImportedCount: 0,
      errorMessage: "Não foi possível interpretar os dados do arquivo. Verifique se o arquivo está corrompido.",
    };
  }

  if (rawItems.length === 0) {
    return {
      success: false,
      transactions: [],
      totalFound: 0,
      newCount: 0,
      possibleDuplicateCount: 0,
      alreadyImportedCount: 0,
      errorMessage: "Nenhuma transação financeira válida foi encontrada no arquivo.",
    };
  }

  // Determine source
  let source: TransactionSource = TransactionSource.CSV;
  if (extension === "ofx") {
    source = TransactionSource.OFX;
  } else if (mode === "CARD_INVOICE") {
    source = TransactionSource.CARD_INVOICE;
  }

  // Pre-calculate hashes and collect externalIds for targeted queries
  const itemsWithHashes = rawItems.map((item) => {
    const importHash = generateTransactionHash({
      userId,
      date: item.date,
      time: item.time,
      amount: item.amount,
      name: item.name,
      type: item.type,
      externalId: item.externalId,
    });
    return { ...item, importHash };
  });

  const fileHashes = Array.from(new Set(itemsWithHashes.map((i) => i.importHash)));
  const fileExtIds = Array.from(
    new Set(
      itemsWithHashes
        .map((i) => i.externalId)
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0),
    ),
  );

  // Find min and max date of imported items with 7 days buffer for manual duplicate checking
  const dates = rawItems.map((item) => item.date.getTime());
  const minDate = new Date(Math.min(...dates) - 7 * 24 * 60 * 60 * 1000);
  const maxDate = new Date(Math.max(...dates) + 7 * 24 * 60 * 60 * 1000);

  // Query existing transactions in date window
  const existingTransactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: minDate,
        lte: maxDate,
      },
    },
  });

  // Targeted query for transactions already imported with matching hash or externalId
  const orConditions = [];
  if (fileHashes.length > 0) {
    orConditions.push({ importHash: { in: fileHashes } });
  }
  if (fileExtIds.length > 0) {
    orConditions.push({ externalId: { in: fileExtIds } });
  }

  const allHashed =
    orConditions.length > 0
      ? await db.transaction.findMany({
          where: {
            userId,
            OR: orConditions,
          },
          select: {
            id: true,
            name: true,
            amount: true,
            date: true,
            category: true,
            paymentMethod: true,
            type: true,
            importHash: true,
            externalId: true,
          },
        })
      : [];

  type HashedRecord = (typeof allHashed)[number];
  // Use arrays to handle potential multiple records with the same hash
  const existingByHash = new Map<string, HashedRecord[]>();
  const existingByExtId = new Map<string, HashedRecord[]>();

  for (const t of allHashed) {
    if (t.importHash) {
      const list = existingByHash.get(t.importHash) || [];
      list.push(t);
      existingByHash.set(t.importHash, list);
    }
    if (t.externalId) {
      const list = existingByExtId.get(t.externalId) || [];
      list.push(t);
      existingByExtId.set(t.externalId, list);
    }
  }

  // Track matched existing IDs so a single existing transaction is not paired multiple times
  const usedExistingIds = new Set<string>();

  const parsedTransactions: ParsedTransaction[] = [];
  let newCount = 0;
  let possibleDuplicateCount = 0;
  let alreadyImportedCount = 0;

  for (let i = 0; i < itemsWithHashes.length; i++) {
    const item = itemsWithHashes[i];
    const tempId = `imported_${Date.now()}_${i}`;
    const suggestedCat = suggestCategory(item.name);
    const importHash = item.importHash;

    let duplicateStatus: ParsedTransaction["duplicateStatus"] = "NEW";
    let duplicateReason: string | undefined = undefined;
    let existingMatch: ParsedTransaction["existingMatch"] = undefined;
    let selected = true;

    // NÍVEL 1 — TRANSAÇÃO JÁ IMPORTADA
    let matchedRecord: HashedRecord | undefined = undefined;

    // Check by externalId first
    if (item.externalId && existingByExtId.has(item.externalId)) {
      const candidates = existingByExtId.get(item.externalId)!;
      matchedRecord = candidates.find((c) => !usedExistingIds.has(c.id));
    }

    // Check by importHash if not matched by externalId
    if (!matchedRecord && existingByHash.has(importHash)) {
      const candidates = existingByHash.get(importHash)!;
      matchedRecord = candidates.find((c) => !usedExistingIds.has(c.id));
    }

    if (matchedRecord) {
      usedExistingIds.add(matchedRecord.id);
      duplicateStatus = "ALREADY_IMPORTED";
      duplicateReason = "Essa movimentação já foi importada anteriormente com o mesmo identificador/hash.";
      existingMatch = {
        id: matchedRecord.id,
        name: matchedRecord.name,
        amount: Number(matchedRecord.amount),
        date: matchedRecord.date.toISOString(),
        category: matchedRecord.category,
        paymentMethod: matchedRecord.paymentMethod,
        type: matchedRecord.type,
      };
      selected = false;
      alreadyImportedCount++;
    } else {
      // NÍVEL 2 — POSSÍVEL DUPLICADA (Mesmo valor, mesma data, horário próximo ou descrição semelhante)
      const potentialMatch = existingTransactions.find((existing) => {
        if (usedExistingIds.has(existing.id)) return false;

        const existingAmount = Number(existing.amount);
        const amountDiff = Math.abs(existingAmount - item.amount);
        if (amountDiff > 0.01) return false;

        const sameDay = isSameDay(existing.date, item.date);
        if (!sameDay) return false;

        // If both have time details
        const timeDiff = Math.abs(existing.date.getTime() - item.date.getTime());
        if (item.time && timeDiff <= THREE_MINUTES_MS) {
          return true;
        }

        // Check description similarity
        const normExisting = normalizeDescription(existing.name);
        const normItem = normalizeDescription(item.name);
        const descMatch =
          normExisting.includes(normItem) ||
          normItem.includes(normExisting) ||
          normExisting.slice(0, 5) === normItem.slice(0, 5);

        // Same amount on same day (increases match confidence if description matches or no exact time)
        return descMatch || !item.time || timeDiff <= 30 * 60 * 1000;
      });

      if (potentialMatch) {
        usedExistingIds.add(potentialMatch.id);
        duplicateStatus = "POSSIBLE_DUPLICATE";
        const dateFormatted = potentialMatch.date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const timeFormatted = potentialMatch.date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        duplicateReason = `Já existe uma transação de R$ ${Number(potentialMatch.amount).toFixed(2).replace(".", ",")} em ${dateFormatted} às ${timeFormatted}.`;
        existingMatch = {
          id: potentialMatch.id,
          name: potentialMatch.name,
          amount: Number(potentialMatch.amount),
          date: potentialMatch.date.toISOString(),
          category: potentialMatch.category,
          paymentMethod: potentialMatch.paymentMethod,
          type: potentialMatch.type,
        };
        selected = false;
        possibleDuplicateCount++;
      } else {
        // NÍVEL 3 — NOVA TRANSAÇÃO
        duplicateStatus = "NEW";
        selected = true;
        newCount++;
      }
    }

    parsedTransactions.push({
      tempId,
      date: item.date.toISOString(),
      time: item.time,
      name: item.name,
      amount: item.amount,
      type: item.type,
      suggestedCategory: suggestedCat,
      selectedCategory: suggestedCat,
      paymentMethod: item.paymentMethod,
      source,
      externalId: item.externalId,
      importHash,
      duplicateStatus,
      duplicateReason,
      existingMatch,
      selected,
      importBatchId,
    });
  }

  return {
    success: true,
    transactions: parsedTransactions,
    totalFound: parsedTransactions.length,
    newCount,
    possibleDuplicateCount,
    alreadyImportedCount,
    importBatchId,
  };
}
