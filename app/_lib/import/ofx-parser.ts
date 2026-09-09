import { TransactionPaymentMethod, TransactionType } from "@prisma/client";

export interface RawParsedTransaction {
  date: Date;
  time?: string; // HH:mm
  name: string;
  amount: number;
  type: TransactionType;
  paymentMethod: TransactionPaymentMethod;
  externalId?: string;
}

/**
 * Decodes XML/HTML entities
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Parses an OFX date string like:
 * "20260906143000[-3:BRT]"
 * "20260906143000[-03:BRT]"
 * "20260906143000[-0300]"
 * "20260906143000.123[-3:BRT]"
 * "20260906143000"
 * "20260906"
 */
export function parseOfxDate(dateStr: string): { date: Date; time?: string } {
  const clean = dateStr.trim();
  if (clean.length < 8) {
    return { date: new Date() };
  }

  const year = parseInt(clean.substring(0, 4), 10);
  const month = parseInt(clean.substring(4, 6), 10) - 1;
  const day = parseInt(clean.substring(6, 8), 10);

  let hours = 12;
  let minutes = 0;
  let seconds = 0;
  let timeFormatted: string | undefined = undefined;

  if (clean.length >= 12 && /^\d{4}/.test(clean.substring(8, 12))) {
    hours = parseInt(clean.substring(8, 10), 10);
    minutes = parseInt(clean.substring(10, 12), 10);
    if (clean.length >= 14 && /^\d{2}/.test(clean.substring(12, 14))) {
      seconds = parseInt(clean.substring(12, 14), 10);
    }
    timeFormatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  // Parse timezone offset if present: e.g. [-3:BRT], [-03:BRT], [-0300], [+0:UTC]
  const tzMatch = clean.match(/\[([+-]?\d+)(?::([A-Z0-9]+))?\]/i);
  let tzOffsetHours: number | null = null;
  if (tzMatch) {
    const rawOffset = tzMatch[1];
    if (rawOffset.length >= 4) {
      tzOffsetHours = parseInt(rawOffset, 10) / 100;
    } else {
      tzOffsetHours = parseInt(rawOffset, 10);
    }
  }

  let date: Date;
  if (timeFormatted && tzOffsetHours !== null && !isNaN(tzOffsetHours)) {
    // Local institution time adjusted by offset: UTC = local - offset
    date = new Date(Date.UTC(year, month, day, hours - tzOffsetHours, minutes, seconds));
  } else if (timeFormatted) {
    // If no timezone offset specified, construct local date
    date = new Date(year, month, day, hours, minutes, seconds);
  } else {
    // If only date (no time), use 12:00:00 UTC so calendar day never shifts across timezones
    date = new Date(Date.UTC(year, month, day, 12, 0, 0));
  }

  return { date, time: timeFormatted };
}

/**
 * Guesses payment method from description or OFX type
 */
function detectPaymentMethod(
  name: string,
  trntype: string,
): TransactionPaymentMethod {
  const normalized = name.toLowerCase();

  if (normalized.includes("pix")) {
    return TransactionPaymentMethod.PIX;
  }
  if (normalized.includes("boleto") || normalized.includes("bloqueto")) {
    return TransactionPaymentMethod.BANK_SLIP;
  }
  if (
    normalized.includes("ted") ||
    normalized.includes("doc") ||
    normalized.includes("transf") ||
    normalized.includes("transferencia")
  ) {
    return TransactionPaymentMethod.BANK_TRANSFER;
  }
  if (normalized.includes("deb") || normalized.includes("debito")) {
    return TransactionPaymentMethod.DEBIT_CARD;
  }
  if (
    normalized.includes("cred") ||
    normalized.includes("credito") ||
    normalized.includes("cartao")
  ) {
    return TransactionPaymentMethod.CREDIT_CARD;
  }
  if (normalized.includes("saque") || normalized.includes("especie")) {
    return TransactionPaymentMethod.CASH;
  }

  if (trntype === "CHECK") return TransactionPaymentMethod.BANK_SLIP;
  if (trntype === "POS" || trntype === "ATM")
    return TransactionPaymentMethod.DEBIT_CARD;
  if (trntype === "XFER") return TransactionPaymentMethod.BANK_TRANSFER;

  return TransactionPaymentMethod.OTHER;
}

/**
 * Extracts a tag's content from a block of text (supports both SGML <TAG>value and XML <TAG>value</TAG>)
 */
function extractTagValue(block: string, tagName: string): string | undefined {
  // Try XML format: <TAG>value</TAG>
  const xmlRegex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const xmlMatch = block.match(xmlRegex);
  if (xmlMatch && xmlMatch[1] !== undefined) {
    return decodeXmlEntities(xmlMatch[1].trim());
  }

  // Try SGML format: <TAG>value (up to next < or line end)
  const sgmlRegex = new RegExp(`<${tagName}\\b[^>]*>([^<\\r\\n]+)`, "i");
  const sgmlMatch = block.match(sgmlRegex);
  if (sgmlMatch && sgmlMatch[1] !== undefined) {
    return decodeXmlEntities(sgmlMatch[1].trim());
  }

  return undefined;
}

/**
 * Parses OFX content (OFX 1.x SGML or OFX 2.x XML)
 */
export function parseOfx(content: string): RawParsedTransaction[] {
  if (!content || !content.trim()) return [];

  // Remove UTF-8 BOM if present
  const cleanContent = content.replace(/^\uFEFF/, "");

  const transactions: RawParsedTransaction[] = [];

  // Match all <STMTTRN>...</STMTTRN> blocks or <STMTTRN> up to next <STMTTRN> or </BANKTRANLIST>
  const stmtTrnRegex = /<STMTTRN\b[^>]*>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN\b)|(?=<\/BANKTRANLIST>)|(?=<\/OFX>))/gi;
  let match: RegExpExecArray | null;

  while ((match = stmtTrnRegex.exec(cleanContent)) !== null) {
    const block = match[1];

    const trntype = extractTagValue(block, "TRNTYPE")?.toUpperCase() || "OTHER";
    const dtposted = extractTagValue(block, "DTPOSTED");
    const trnamt = extractTagValue(block, "TRNAMT");
    const fitid = extractTagValue(block, "FITID");
    const name = extractTagValue(block, "NAME");
    const memo = extractTagValue(block, "MEMO");

    if (!dtposted || !trnamt) {
      continue;
    }

    const { date, time } = parseOfxDate(dtposted);
    const rawAmount = parseFloat(trnamt.replace(",", "."));
    if (isNaN(rawAmount)) {
      continue;
    }

    const amount = Math.abs(rawAmount);

    // Combine memo and name to get the best description without duplicates
    let description = "";
    if (name && memo && name !== memo) {
      const lowerName = name.toLowerCase().trim();
      const lowerMemo = memo.toLowerCase().trim();
      if (lowerMemo.includes(lowerName)) {
        description = memo;
      } else if (lowerName.includes(lowerMemo)) {
        description = name;
      } else {
        description = `${name} - ${memo}`;
      }
    } else {
      description = name || memo || "Transação Extrato";
    }

    // Clean description: remove excessive whitespace
    description = description.replace(/\s+/g, " ").trim();
    const lowerDesc = description.toLowerCase();

    // Determine type (EXPENSE or DEPOSIT or INVESTMENT)
    let type: TransactionType;
    if (
      lowerDesc.includes("investimento") ||
      lowerDesc.includes("resgate aplicacao") ||
      lowerDesc.includes("aplicacao cdi") ||
      lowerDesc.includes("tesouro direto") ||
      lowerDesc.includes("cdb")
    ) {
      type = TransactionType.INVESTMENT;
    } else if (
      rawAmount < 0 ||
      trntype === "DEBIT" ||
      lowerDesc.includes("debito") ||
      lowerDesc.includes("pagamento efetuado")
    ) {
      type = TransactionType.EXPENSE;
    } else {
      type = TransactionType.DEPOSIT;
    }

    // Check for chargebacks / estornos in OFX (reversals are deposits)
    if (
      lowerDesc.includes("estorno") ||
      lowerDesc.includes("reembolso") ||
      trntype === "REVERSAL"
    ) {
      type = TransactionType.DEPOSIT;
    }

    const paymentMethod = detectPaymentMethod(description, trntype);

    transactions.push({
      date,
      time,
      name: description,
      amount,
      type,
      paymentMethod,
      externalId: fitid ? fitid.trim() : undefined,
    });
  }

  return transactions;
}
