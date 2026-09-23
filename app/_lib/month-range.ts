import { addMonths, startOfMonth } from "date-fns";

export const YEAR_MONTH_PATTERN = /^(1\d{3}|[2-9]\d{3})-(0[1-9]|1[0-2])$/;
const MONTH_PATTERN = /^(0[1-9]|1[0-2])$/;
const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export function formatYearMonthPtBr(yearMonth: string): string {
  if (!YEAR_MONTH_PATTERN.test(yearMonth)) throw new RangeError("Invalid year-month");
  const [year, month] = yearMonth.split("-").map(Number);
  const label = monthLabelFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}

/** Canonical URL value; old MM links continue to resolve in the current year. */
export function resolveYearMonth(value: unknown, now = new Date()): string {
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

  if (typeof value === "string") {
    if (YEAR_MONTH_PATTERN.test(value)) return value;
    if (MONTH_PATTERN.test(value)) return `${currentYear}-${value}`;
  }

  return `${currentYear}-${currentMonth}`;
}

/** Half-open UTC range for a selected calendar month. */
export function getMonthRangeUtc(year: number, month: string) {
  if (
    !Number.isInteger(year) ||
    year < 1000 ||
    year > 9999 ||
    !MONTH_PATTERN.test(month)
  ) {
    throw new RangeError("Invalid year or month");
  }

  const monthIndex = Number(month) - 1;

  return {
    gte: new Date(Date.UTC(year, monthIndex, 1)),
    lt: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

export function getYearMonthRangeUtc(yearMonth: string) {
  if (!YEAR_MONTH_PATTERN.test(yearMonth)) {
    throw new RangeError("Invalid year-month");
  }

  const [year, month] = yearMonth.split("-");
  return getMonthRangeUtc(Number(year), month);
}

export function shiftYearMonth(yearMonth: string, offset: number): string {
  if (!YEAR_MONTH_PATTERN.test(yearMonth) || !Number.isInteger(offset)) {
    throw new RangeError("Invalid year-month or offset");
  }
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** A due day of 29–31 uses the last day in shorter months, without changing the series day. */
export function monthlyDueDate(month: string, dueDay: number): Date {
  if (!YEAR_MONTH_PATTERN.test(month) || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    throw new RangeError("Invalid recurring commitment date");
  }
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return new Date(Date.UTC(year, monthNumber - 1, Math.min(dueDay, lastDay), 12));
}

export function monthsBetween(startMonth: string, endMonth: string): number {
  if (!YEAR_MONTH_PATTERN.test(startMonth) || !YEAR_MONTH_PATTERN.test(endMonth)) {
    throw new RangeError("Invalid year-month");
  }
  const [startYear, startNumber] = startMonth.split("-").map(Number);
  const [endYear, endNumber] = endMonth.split("-").map(Number);
  return (endYear - startYear) * 12 + endNumber - startNumber;
}

/** Half-open range in the server's local timezone for the monthly quota. */
export function getCurrentMonthRangeLocal(now: Date) {
  const start = startOfMonth(now);

  return {
    gte: start,
    lt: addMonths(start, 1),
  };
}
