import {
  TransactionPaymentMethod,
  TransactionType,
 } from "@prisma/client";
import type { RawParsedTransaction } from "./ofx-parser";
import type { ImportMode } from "./types";

/**
 * Strips UTF-8 BOM if present
 */
function stripBom(content: string): string {
  return content.replace(/^\uFEFF/, "");
}

/**
 * Autodetects delimiter (, ; \t) from first non-empty lines, counting only
 * characters outside of quotes so that quoted values like "1.250,50" do not
 * skew semicolon or tab detection.
 */
function detectDelimiter(firstLines: string[]): string {
  let commaCount = 0;
  let semicolonCount = 0;
  let tabCount = 0;

  for (const line of firstLines) {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (char === ",") commaCount++;
        else if (char === ";") semicolonCount++;
        else if (char === "\t") tabCount++;
      }
    }
  }

  if (semicolonCount > commaCount && semicolonCount > tabCount) return ";";
  if (tabCount > commaCount && tabCount > semicolonCount) return "\t";
  return ",";
}

/**
 * Cleans an individual CSV cell, removing outer quotes and un-escaping inner quotes ("" -> ")
 */
function cleanCsvCell(cell: string): string {
  let trimmed = cell.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed.replace(/""/g, '"');
}

/**
 * Splits a CSV row taking quotes and escaped quotes into account (RFC 4180 compliant)
 */
function splitCsvRow(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped double quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(cleanCsvCell(current));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(cleanCsvCell(current));
  return result;
}

/**
 * Parses Brazilian and international numbers:
 * "R$ 1.250,50", "1.250,50", "1250,50", "1250.50", "-15,00", '"1.250,50"',
 * "- 15,00", "15,00-", "(15,00)", "15,00 D", "15,00 C", "1,250.50"
 */
export function parseAmount(val: string): { amount: number; isNegative: boolean } {
  if (!val) return { amount: 0, isNegative: false };

  let clean = val
    .replace(/["']/g, "")
    .replace(/R\$/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  let isNegative = false;

  // Check negative indicators:
  // - leading minus: -15,00 or - 15,00
  // - trailing minus: 15,00-
  // - parentheses: (15,00)
  // - debit indicator: 15,00 D or 15,00 DEB
  if (
    clean.startsWith("-") ||
    clean.endsWith("-") ||
    (clean.startsWith("(") && clean.endsWith(")")) ||
    /\s+D$/i.test(clean) ||
    /D$/i.test(clean) && !/[a-zA-Z]{2,}$/.test(clean)
  ) {
    isNegative = true;
  }

  // Remove signs and credit/debit indicators
  clean = clean
    .replace(/^[-+]/, "")
    .replace(/[-+]$/, "")
    .replace(/^\(/, "")
    .replace(/\)$/, "")
    .replace(/\s*[CD]$/i, "")
    .replace(/\s+/g, "")
    .trim();

  // If there are both dots and commas:
  const lastDot = clean.lastIndexOf(".");
  const lastComma = clean.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // Brazilian format: 1.250,50 or 1.234.567,89
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      // US format: 1,250.50 or 1,234,567.89
      clean = clean.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Only comma present: 1250,50 or 15,00
    clean = clean.replace(",", ".");
  } else if (lastDot !== -1) {
    // Only dot present: e.g. 1250.50 or 1.250.000
    const dotCount = (clean.match(/\./g) || []).length;
    if (dotCount > 1) {
      clean = clean.replace(/\./g, "");
    }
  }

  const num = parseFloat(clean);
  const finalAmount = isNaN(num) ? 0 : Math.round(Math.abs(num) * 100) / 100;

  return {
    amount: finalAmount,
    isNegative,
  };
}

/**
 * Parses dates like "06/09/2026", "2026-09-06", "06/09/2026 14:32:00", "06-09-2026", "06/09/26"
 */
function parseDateAndOptionalTime(val: string): {
  date: Date;
  time?: string;
} | null {
  const clean = val.trim();
  if (!clean) return null;

  // Split date and time if present (e.g. "06/09/2026 14:30:00" or "2026-09-06T14:30:00")
  const parts = clean.split(/[ T]+/);
  const datePart = parts[0];
  let timeStr: string | undefined = undefined;

  if (parts.length > 1 && parts[1].includes(":")) {
    const timeTokens = parts[1].split(":");
    if (timeTokens.length >= 2) {
      const h = parseInt(timeTokens[0], 10);
      const m = parseInt(timeTokens[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    }
  }

  let year = 2026;
  let month = 0;
  let day = 1;

  if (datePart.includes("/")) {
    const tokens = datePart.split("/").map((t) => parseInt(t, 10));
    if (tokens.length >= 3) {
      day = tokens[0];
      month = tokens[1] - 1;
      year = tokens[2] < 100 ? 2000 + tokens[2] : tokens[2];
    }
  } else if (datePart.includes("-")) {
    const tokens = datePart.split("-").map((t) => parseInt(t, 10));
    if (tokens.length >= 3) {
      if (tokens[0] > 1000) {
        year = tokens[0];
        month = tokens[1] - 1;
        day = tokens[2];
      } else {
        day = tokens[0];
        month = tokens[1] - 1;
        year = tokens[2] < 100 ? 2000 + tokens[2] : tokens[2];
      }
    }
  } else {
    return null;
  }

  // Validate bounds
  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31 ||
    year < 1970 ||
    year > 2100
  ) {
    return null;
  }

  let date: Date;
  if (timeStr) {
    const [h, m] = timeStr.split(":").map((t) => parseInt(t, 10));
    date = new Date(year, month, day, h, m);
  } else {
    // If no time is present, use 12:00:00 UTC so timezone shifts never change the calendar day
    date = new Date(Date.UTC(year, month, day, 12, 0, 0));
  }

  return isNaN(date.getTime()) ? null : { date, time: timeStr };
}

/**
 * Guesses column indices based on header names
 */
function mapColumns(headers: string[]): {
  dateIndex: number;
  descIndex: number;
  amountIndex: number;
  idIndex: number;
  typeIndex: number;
} {
  const norm = headers.map((h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim(),
  );

  let dateIndex = -1;
  let descIndex = -1;
  let amountIndex = -1;
  let idIndex = -1;
  let typeIndex = -1;

  norm.forEach((h, i) => {
    if (
      dateIndex === -1 &&
      (h === "data" ||
        h === "date" ||
        h === "dt" ||
        h === "dia" ||
        h.includes("data") ||
        h.includes("posted"))
    ) {
      dateIndex = i;
    } else if (
      descIndex === -1 &&
      (h === "descricao" ||
        h === "historico" ||
        h === "estabelecimento" ||
        h === "detalhe" ||
        h === "memo" ||
        h === "titulo" ||
        h === "nome" ||
        h === "comprovante" ||
        h === "local" ||
        h.includes("desc") ||
        h.includes("memo") ||
        h.includes("transacao") ||
        h.includes("title"))
    ) {
      descIndex = i;
    } else if (
      amountIndex === -1 &&
      (h === "valor" ||
        h === "amount" ||
        h === "total" ||
        h === "quantia" ||
        h === "val" ||
        h.includes("valor") ||
        h.includes("total"))
    ) {
      amountIndex = i;
    } else if (
      idIndex === -1 &&
      (h === "documento" ||
        h === "doc" ||
        h === "id" ||
        h === "fitid" ||
        h === "codigo" ||
        h === "numdoc" ||
        h.includes("identificador"))
    ) {
      idIndex = i;
    } else if (
      typeIndex === -1 &&
      (h === "tipo" || h === "type" || h === "dc" || h === "operacao" || h.includes("tipo"))
    ) {
      typeIndex = i;
    }
  });

  // Fallback defaults if not found
  if (dateIndex === -1 && headers.length > 0) dateIndex = 0;
  if (descIndex === -1 && headers.length > 1) descIndex = 1;
  if (amountIndex === -1 && headers.length > 2) amountIndex = 2;

  return { dateIndex, descIndex, amountIndex, idIndex, typeIndex };
}

/**
 * Checks if a row is a summary or metadata line from bank exports:
 * e.g. "Saldo anterior", "Saldo do dia", "Total de debitos", "Limite disponivel"
 */
function isSummaryOrMetadataRow(rowText: string): boolean {
  const lower = rowText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    lower.includes("saldo anterior") ||
    lower.includes("saldo atual") ||
    lower.includes("saldo final") ||
    lower.includes("saldo do dia") ||
    lower.includes("saldo disponivel") ||
    lower.includes("total de debito") ||
    lower.includes("total de credito") ||
    lower.includes("total faturado") ||
    lower.includes("limite disponivel") ||
    lower.includes("limite total") ||
    lower.includes("resumo do mes") ||
    lower.includes("ouvidoria:") ||
    lower.includes("sac:")
  );
}

/**
 * Parses a CSV file for either Bank Statement or Credit Card Invoice
 */
export function parseCsv(
  content: string,
  mode: ImportMode = "BANK_STATEMENT",
): RawParsedTransaction[] {
  if (!content || !content.trim()) return [];

  const cleanContent = stripBom(content);

  const rawLines = cleanContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [];

  const delimiter = detectDelimiter(rawLines.slice(0, 5));

  // Find header row (the first row containing keywords like data, valor, date, etc.)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rawLines.length, 15); i++) {
    const lower = rawLines[i].toLowerCase();
    if (
      lower.includes("data") ||
      lower.includes("date") ||
      lower.includes("valor") ||
      lower.includes("amount")
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  const headers = splitCsvRow(rawLines[headerIndex], delimiter);
  const { dateIndex, descIndex, amountIndex, idIndex } = mapColumns(headers);

  const transactions: RawParsedTransaction[] = [];

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (isSummaryOrMetadataRow(line)) continue;

    const cols = splitCsvRow(line, delimiter);
    if (cols.length <= Math.max(dateIndex, amountIndex)) continue;

    const rawDate = cols[dateIndex];
    const rawAmt = cols[amountIndex];
    const rawDesc = descIndex !== -1 && cols[descIndex] !== undefined ? cols[descIndex] : "";
    const rawId = idIndex !== -1 && cols[idIndex] !== undefined ? cols[idIndex] : undefined;

    if (!rawDate || !rawAmt) continue;

    const parsedDate = parseDateAndOptionalTime(rawDate);
    if (!parsedDate) continue;

    const { amount, isNegative } = parseAmount(rawAmt);
    if (amount === 0 && !rawAmt.includes("0")) continue;

    // Default description if missing or empty
    let description = rawDesc.replace(/\s+/g, " ").trim();
    if (!description) {
      description = mode === "CARD_INVOICE" ? "Transação de Cartão" : "Transação sem descrição";
    }

    const lowerDesc = description.toLowerCase();

    let type: TransactionType;
    let paymentMethod: TransactionPaymentMethod;

    if (mode === "CARD_INVOICE") {
      paymentMethod = TransactionPaymentMethod.CREDIT_CARD;

      // In card invoices, positive amounts are purchases (EXPENSE)
      // Payments, refunds, chargebacks are DEPOSIT
      if (
        isNegative ||
        lowerDesc.includes("pagamento") ||
        lowerDesc.includes("estorno") ||
        lowerDesc.includes("reembolso") ||
        lowerDesc.includes("credito") ||
        lowerDesc.includes("cancelamento")
      ) {
        type = TransactionType.DEPOSIT;
      } else {
        type = TransactionType.EXPENSE;
      }
    } else {
      // BANK_STATEMENT
      if (
        lowerDesc.includes("estorno") ||
        lowerDesc.includes("reembolso") ||
        lowerDesc.includes("cancelamento") ||
        lowerDesc.includes("devolucao")
      ) {
        type = TransactionType.DEPOSIT;
      } else if (
        isNegative ||
        lowerDesc.includes("debito") ||
        lowerDesc.includes("saque") ||
        lowerDesc.includes("compra") ||
        lowerDesc.includes("pagamento efetuado") ||
        lowerDesc.includes("pix enviado")
      ) {
        type = TransactionType.EXPENSE;
      } else if (
        lowerDesc.includes("deposito") ||
        lowerDesc.includes("credito") ||
        lowerDesc.includes("salario") ||
        lowerDesc.includes("pix recebido") ||
        lowerDesc.includes("ted recebida")
      ) {
        type = TransactionType.DEPOSIT;
      } else {
        // Default based on sign
        type = isNegative ? TransactionType.EXPENSE : TransactionType.DEPOSIT;
      }

      // Detect payment method
      if (lowerDesc.includes("pix")) {
        paymentMethod = TransactionPaymentMethod.PIX;
      } else if (
        lowerDesc.includes("boleto") ||
        lowerDesc.includes("bloqueto")
      ) {
        paymentMethod = TransactionPaymentMethod.BANK_SLIP;
      } else if (
        lowerDesc.includes("ted") ||
        lowerDesc.includes("doc") ||
        lowerDesc.includes("transf")
      ) {
        paymentMethod = TransactionPaymentMethod.BANK_TRANSFER;
      } else if (
        lowerDesc.includes("cartao debito") ||
        lowerDesc.includes("debito")
      ) {
        paymentMethod = TransactionPaymentMethod.DEBIT_CARD;
      } else if (
        lowerDesc.includes("cartao credito") ||
        lowerDesc.includes("credito")
      ) {
        paymentMethod = TransactionPaymentMethod.CREDIT_CARD;
      } else if (lowerDesc.includes("dinheiro") || lowerDesc.includes("saque")) {
        paymentMethod = TransactionPaymentMethod.CASH;
      } else {
        paymentMethod = TransactionPaymentMethod.OTHER;
      }
    }

    if (
      lowerDesc.includes("investimento") ||
      lowerDesc.includes("aplicacao") ||
      lowerDesc.includes("tesouro") ||
      lowerDesc.includes("cdi") ||
      lowerDesc.includes("cdb")
    ) {
      type = TransactionType.INVESTMENT;
    }

    transactions.push({
      date: parsedDate.date,
      time: parsedDate.time,
      name: description,
      amount,
      type,
      paymentMethod,
      externalId: rawId && rawId.trim() ? rawId.trim() : undefined,
    });
  }

  return transactions;
}
