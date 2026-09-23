import { auth } from "@clerk/nextjs/server";
import { TransactionType, type TransactionCategory } from "@prisma/client";
import { db } from "@/app/_lib/prisma";
import { getYearMonthRangeUtc, monthsBetween, shiftYearMonth } from "@/app/_lib/month-range";
import { availableAfterCommitments, creditLimit, monthlyBalance, outstandingCommitmentAmounts } from "@/app/_lib/finance";
import { ensureCommitmentOccurrences } from "@/app/_lib/commitments";

export type CategoryPeriod = "month" | "three" | "six" | "year";
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

function optionalTable<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return null;
    throw error;
  });
}

function categoryStart(month: string, period: CategoryPeriod): string {
  if (period === "three") return shiftYearMonth(month, -2);
  if (period === "six") return shiftYearMonth(month, -5);
  if (period === "year") return `${month.slice(0, 4)}-01`;
  return month;
}

export async function getDashboard(month: string, categoryPeriod: CategoryPeriod = "month") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const previousMonth = shiftYearMonth(month, -1);
  await Promise.all([ensureCommitmentOccurrences(userId, month), ensureCommitmentOccurrences(userId, previousMonth)]);
  const currentRange = getYearMonthRangeUtc(month);
  const previousRange = getYearMonthRangeUtc(previousMonth);
  const categoryRange = {
    gte: getYearMonthRangeUtc(categoryStart(month, categoryPeriod)).gte,
    lt: currentRange.lt,
  };

  const [currentGroups, previousGroups, categories, latest, commitments, previousCommitments, cards, installments] = await Promise.all([
    db.transaction.groupBy({ by: ["type"], where: { userId, date: currentRange }, _sum: { amount: true } }),
    db.transaction.groupBy({ by: ["type"], where: { userId, date: previousRange }, _sum: { amount: true } }),
    db.transaction.groupBy({ by: ["category"], where: { userId, date: categoryRange, type: TransactionType.EXPENSE }, _sum: { amount: true } }),
    db.transaction.findMany({ where: { userId, date: currentRange }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 10 }),
    optionalTable(db.monthlyCommitment.findMany({ where: { userId, dueDate: currentRange, deletedAt: null }, orderBy: { dueDate: "asc" } })),
    optionalTable(db.monthlyCommitment.findMany({ where: { userId, dueDate: previousRange, recurring: true, deletedAt: null } })),
    optionalTable(db.creditCard.findMany({ where: { userId, isActive: true }, include: { invoices: { where: { OR: [{ month }, { month: shiftYearMonth(month, 1) }, { status: "OPEN" }] } } }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] })),
    optionalTable(db.installmentPlan.findMany({ where: { userId, status: "ACTIVE", startMonth: { lte: month } }, include: { card: { select: { name: true } } }, orderBy: { createdAt: "desc" } })),
  ]);

  const total = (groups: typeof currentGroups, type: TransactionType) => Number(groups.find((group) => group.type === type)?._sum.amount ?? 0);
  const values = {
    revenue: total(currentGroups, TransactionType.DEPOSIT),
    expenses: total(currentGroups, TransactionType.EXPENSE),
    invested: total(currentGroups, TransactionType.INVESTMENT),
  };
  const previous = {
    revenue: total(previousGroups, TransactionType.DEPOSIT),
    expenses: total(previousGroups, TransactionType.EXPENSE),
    invested: total(previousGroups, TransactionType.INVESTMENT),
  };
  const fixed = commitments?.filter((item) => item.recurring).reduce((amount, item) => amount + Number(item.amount), 0) ?? 0;
  const previousFixed = previousCommitments?.reduce((amount, item) => amount + Number(item.amount), 0) ?? 0;
  const balance = monthlyBalance(values.revenue, values.expenses, values.invested);
  const pending = commitments?.filter((item) => item.status === "PENDING" && !item.transactionId) ?? [];
  const unpaidAmounts = outstandingCommitmentAmounts(commitments?.map((item) => ({ amount: Number(item.amount), status: item.status, transactionId: item.transactionId })) ?? []);
  const categoryTotal = categories.reduce((amount, item) => amount + Number(item._sum.amount ?? 0), 0);
  const primaryCard = cards?.[0];
  const used = primaryCard?.invoices.filter((invoice) => invoice.status === "OPEN").reduce((amount, invoice) => amount + Number(invoice.amount), 0) ?? 0;
  const cardLimit = creditLimit(Number(primaryCard?.limitTotal ?? 0), used);

  return {
    month,
    values: { ...values, fixed, balance },
    previous: { ...previous, fixed: previousFixed, balance: monthlyBalance(previous.revenue, previous.expenses, previous.invested) },
    available: availableAfterCommitments(balance, unpaidAmounts),
    categories: categories.map((item) => ({
      category: item.category as TransactionCategory,
      amount: Number(item._sum.amount ?? 0),
      percent: categoryTotal > 0 ? Number(item._sum.amount ?? 0) / categoryTotal * 100 : 0,
    })).sort((a, b) => b.amount - a.amount),
    categoryTotal,
    latest: latest.map((item) => ({
      id: item.id, name: item.name, category: item.category, paymentMethod: item.paymentMethod,
      date: item.date.toISOString(), amount: Number(item.amount), type: item.type, source: item.source,
    })),
    commitments: commitments?.map((item) => ({
      id: item.id, description: item.description, amount: Number(item.amount),
      dueDate: item.dueDate.toISOString(), status: item.status, recurring: item.recurring,
      transactionId: item.transactionId,
    })) ?? null,
    commitmentsSummary: commitments ? {
      expected: commitments.reduce((amount, item) => amount + Number(item.amount), 0),
      confirmed: commitments.filter((item) => item.status !== "PENDING").reduce((amount, item) => amount + Number(item.amount), 0),
      pending: pending.reduce((amount, item) => amount + Number(item.amount), 0),
    } : null,
    card: primaryCard ? {
      id: primaryCard.id, name: primaryCard.name, brand: primaryCard.brand,
      limitTotal: Number(primaryCard.limitTotal), limitUsed: used,
      limitAvailable: cardLimit.available, usedPercent: cardLimit.percent,
      closingDay: primaryCard.closingDay, dueDay: primaryCard.dueDay,
      currentInvoice: Number(primaryCard.invoices.find((invoice) => invoice.month === month)?.amount ?? 0),
      nextInvoice: Number(primaryCard.invoices.find((invoice) => invoice.month === shiftYearMonth(month, 1))?.amount ?? 0),
    } : null,
    cardsAvailable: cards !== null,
    installments: installments?.flatMap((item) => {
      const current = monthsBetween(item.startMonth, month) + 1;
      if (current < 1 || current > item.installmentCount) return [];
      return [{ id: item.id, description: item.description, current, count: item.installmentCount,
        monthlyAmount: Number(item.installmentAmount), endMonth: shiftYearMonth(item.startMonth, item.installmentCount - 1), cardName: item.card?.name ?? null }];
    }) ?? null,
  };
}
