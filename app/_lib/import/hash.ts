import crypto from "crypto";
import { TransactionType } from "@prisma/client";

interface HashInput {
  userId: string;
  date: Date;
  amount: number;
  name: string;
  type: TransactionType;
  externalId?: string;
  time?: string;
}

/**
 * Normalizes description for consistent hashing:
 * Lowercases, strips punctuation and multiple spaces.
 */
export function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates a consistent, deterministic SHA-256 fingerprint for a transaction.
 */
export function generateTransactionHash(input: HashInput): string {
  const dateStr = input.date.toISOString().split("T")[0]; // YYYY-MM-DD
  const timeStr = input.time ? input.time.trim() : "";
  const amountStr = Number(Math.abs(input.amount)).toFixed(2);
  const normalizedDesc = normalizeDescription(input.name);
  const extId = input.externalId ? input.externalId.trim() : "";

  // If there's an externalId from the bank (FITID), incorporate it for extreme precision
  const payload = [
    input.userId,
    dateStr,
    timeStr,
    amountStr,
    input.type,
    normalizedDesc,
    extId,
  ].join("|");

  return crypto.createHash("sha256").update(payload).digest("hex");
}
