import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionSource,
  TransactionType,
} from "@prisma/client";

export type ImportMode = "BANK_STATEMENT" | "CARD_INVOICE";

export type DuplicateStatus = "NEW" | "POSSIBLE_DUPLICATE" | "ALREADY_IMPORTED";

export interface ExistingTransactionMatch {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  type: TransactionType;
}

export interface ParsedTransaction {
  tempId: string;
  date: string; // ISO string
  time?: string; // HH:mm
  name: string;
  amount: number;
  type: TransactionType;
  suggestedCategory: TransactionCategory;
  selectedCategory: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  source: TransactionSource;
  externalId?: string;
  importHash: string;
  duplicateStatus: DuplicateStatus;
  duplicateReason?: string;
  existingMatch?: ExistingTransactionMatch;
  selected: boolean;
  importBatchId?: string;
}

export interface ProcessFileResult {
  success: boolean;
  transactions: ParsedTransaction[];
  totalFound: number;
  newCount: number;
  possibleDuplicateCount: number;
  alreadyImportedCount: number;
  importBatchId?: string;
  errorMessage?: string;
}

export interface ConfirmImportResult {
  success: boolean;
  importedCount: number;
  ignoredCount: number;
  alreadyExistedCount: number;
  errorMessage?: string;
}
