import type { TransactionCategory } from "@prisma/client";
import type { TransactionRow } from "./transaction-row";

export type LocalPeriod = "month" | "seven" | "fifteen" | "thirty";

export type TransactionFilters = {
  search: string;
  category: TransactionCategory | "all";
  period: LocalPeriod;
};

export type CategoryExpense = {
  category: TransactionCategory;
  amount: number;
  percent: number;
  count: number;
};

export type PeriodMetrics = {
  count: number;
  expenseCount: number;
  revenue: number;
  expenses: number;
  invested: number;
  averageTicket: number;
  largestExpense: { name: string; amount: number } | null;
  largestRevenue: { name: string; amount: number } | null;
  categories: CategoryExpense[];
};

function localYearMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function filterTransactionRows(rows: TransactionRow[], month: string, filters: TransactionFilters, now = new Date()): TransactionRow[] {
  const search = normalize(filters.search.trim());
  const [year, monthNumber] = month.split("-").map(Number);
  const end = month === localYearMonth(now)
    ? new Date(Date.UTC(year, monthNumber - 1, now.getDate()))
    : new Date(Date.UTC(year, monthNumber, 0));
  const days = filters.period === "seven" ? 7 : filters.period === "fifteen" ? 15 : filters.period === "thirty" ? 30 : null;
  const start = days === null ? null : new Date(end.getTime() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  return rows.filter((row) =>
    (filters.category === "all" || row.category === filters.category) &&
    (!search || normalize(row.name).includes(search)) &&
    (start === null || (row.date.slice(0, 10) >= start && row.date.slice(0, 10) <= endDate)),
  );
}

export function computePeriodMetrics(rows: TransactionRow[]): PeriodMetrics {
  let revenueCents = 0;
  let expenseCents = 0;
  let investedCents = 0;
  let ticketCents = 0;
  let expenseCount = 0;
  let largestExpense: PeriodMetrics["largestExpense"] = null;
  let largestRevenue: PeriodMetrics["largestRevenue"] = null;
  const categories = new Map<TransactionCategory, { cents: number; count: number }>();

  for (const row of rows) {
    const cents = Math.round(Number(row.amount) * 100);
    ticketCents += Math.abs(cents);
    if (row.type === "DEPOSIT") {
      revenueCents += cents;
      if (!largestRevenue || cents > Math.round(largestRevenue.amount * 100)) largestRevenue = { name: row.name, amount: cents / 100 };
    } else if (row.type === "EXPENSE") {
      expenseCents += cents;
      expenseCount += 1;
      if (!largestExpense || cents > Math.round(largestExpense.amount * 100)) largestExpense = { name: row.name, amount: cents / 100 };
      const current = categories.get(row.category) ?? { cents: 0, count: 0 };
      categories.set(row.category, { cents: current.cents + cents, count: current.count + 1 });
    } else if (row.type === "INVESTMENT") {
      investedCents += cents;
    }
  }

  return {
    count: rows.length,
    expenseCount,
    revenue: revenueCents / 100,
    expenses: expenseCents / 100,
    invested: investedCents / 100,
    averageTicket: rows.length ? ticketCents / rows.length / 100 : 0,
    largestExpense,
    largestRevenue,
    categories: [...categories].map(([category, value]) => ({
      category, amount: value.cents / 100, count: value.count,
      percent: expenseCents ? value.cents / expenseCents * 100 : 0,
    })).sort((a, b) => b.amount - a.amount),
  };
}
