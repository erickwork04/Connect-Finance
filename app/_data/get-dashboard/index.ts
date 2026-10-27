import { auth } from "@clerk/nextjs/server";
import { TransactionType, type TransactionCategory } from "@prisma/client";
import { db } from "@/app/_lib/prisma";
import { getYearMonthRangeUtc, monthsBetween, shiftYearMonth } from "@/app/_lib/month-range";
import { availableAfterCommitments, creditLimit, monthlyBalance } from "@/app/_lib/finance";
import { invoiceRemainingAmount } from "@/app/_lib/card-invoice";
import { ensureCommitmentOccurrences } from "@/app/_lib/commitments";
import { activeInstallmentWindow } from "@/app/_lib/installment-window";

export type CategoryPeriod = "month" | "three" | "six" | "year";
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

function optionalTable<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && (error.code === "P2021" || error.code === "P2022")) return null;
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

  const [currentGroups, previousGroups, categories, latest, commitmentTotals, recurringCommitmentTotals, pendingCommitmentTotals, unpaidCommitmentTotals, previousCommitmentTotals, cardCandidates] = await Promise.all([
    db.transaction.groupBy({ by: ["type"], where: { userId, date: currentRange }, _sum: { amount: true } }),
    db.transaction.groupBy({ by: ["type"], where: { userId, date: previousRange }, _sum: { amount: true } }),
    db.transaction.groupBy({ by: ["category"], where: { userId, date: categoryRange, type: TransactionType.EXPENSE }, _sum: { amount: true } }),
    db.transaction.findMany({ where: { userId, date: currentRange }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 10 }),
    optionalTable(db.monthlyCommitment.aggregate({ where: { userId, dueDate: currentRange, deletedAt: null }, _sum: { amount: true }, _count: { _all: true } })),
    optionalTable(db.monthlyCommitment.aggregate({ where: { userId, dueDate: currentRange, deletedAt: null, recurring: true }, _sum: { amount: true } })),
    optionalTable(db.monthlyCommitment.aggregate({ where: { userId, dueDate: currentRange, deletedAt: null, status: "PENDING", transactionId: null }, _sum: { amount: true }, _count: { _all: true } })),
    optionalTable(db.monthlyCommitment.aggregate({ where: { userId, dueDate: currentRange, deletedAt: null, status: { not: "PAID" }, transactionId: null }, _sum: { amount: true } })),
    optionalTable(db.monthlyCommitment.aggregate({ where: { userId, dueDate: previousRange, recurring: true, deletedAt: null }, _sum: { amount: true } })),
    optionalTable(db.creditCard.findMany({ where: { userId, isActive: true }, select: { id: true, name: true, brand: true, limitTotal: true, closingDay: true, dueDay: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }, { id: "asc" }], take: 1 })),
  ]);
  const card = cardCandidates?.[0] ?? null;
  const [currentCommitments, openInvoices, currentInvoices, installments] = await Promise.all([
    optionalTable(db.monthlyCommitment.findMany({
      where: { userId, dueDate: currentRange, deletedAt: null },
      select: { id: true, description: true, amount: true, dueDate: true, status: true },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      take: 2,
    })),
    card ? optionalTable(db.cardInvoice.aggregate({ where: { userId, cardId: card.id, status: "OPEN" }, _sum: { amount: true, paidAmount: true } })) : Promise.resolve(null),
    card ? optionalTable(db.cardInvoice.findMany({ where: { userId, cardId: card.id, month: { in: [month, shiftYearMonth(month, 1)] } }, select: { month: true, amount: true, paidAmount: true, status: true }, take: 2 })) : Promise.resolve([]),
    optionalTable(db.installmentPlan.findMany({
      where: { userId, status: "ACTIVE", ...activeInstallmentWindow(month, shiftYearMonth) },
      select: { id: true, description: true, installmentAmount: true, installmentCount: true, startMonth: true, card: { select: { name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 3,
    })),
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
  const fixed = Number(recurringCommitmentTotals?._sum.amount ?? 0);
  const previousFixed = Number(previousCommitmentTotals?._sum.amount ?? 0);
  const balance = monthlyBalance(values.revenue, values.expenses, values.invested);
  const unpaidAmounts = Number(unpaidCommitmentTotals?._sum.amount ?? 0);
  const categoryTotal = categories.reduce((amount, item) => amount + Number(item._sum.amount ?? 0), 0);
  const currentInvoice = currentInvoices?.find((invoice) => invoice.month === month);
  const nextInvoice = currentInvoices?.find((invoice) => invoice.month === shiftYearMonth(month, 1));
  const used = openInvoices ? Math.max(0, Number(openInvoices._sum.amount ?? 0) - Number(openInvoices._sum.paidAmount ?? 0)) : 0;
  const cardLimit = creditLimit(Number(card?.limitTotal ?? 0), used);

  return {
    month,
    values: { ...values, fixed, balance },
    previous: { ...previous, fixed: previousFixed, balance: monthlyBalance(previous.revenue, previous.expenses, previous.invested) },
    available: availableAfterCommitments(balance, [unpaidAmounts]),
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
    commitments: commitmentTotals && recurringCommitmentTotals && pendingCommitmentTotals && unpaidCommitmentTotals && currentCommitments
      ? currentCommitments.map((item) => ({
          id: item.id, description: item.description, amount: Number(item.amount),
          dueDate: item.dueDate.toISOString(), status: item.status,
        }))
      : null,
    commitmentsSummary: commitmentTotals && recurringCommitmentTotals && pendingCommitmentTotals && unpaidCommitmentTotals && currentCommitments ? {
      expected: Number(commitmentTotals._sum.amount ?? 0),
      confirmed: Number(commitmentTotals._sum.amount ?? 0) - Number(pendingCommitmentTotals._sum.amount ?? 0),
      pending: Number(pendingCommitmentTotals._sum.amount ?? 0),
      pendingCount: pendingCommitmentTotals._count._all,
      count: commitmentTotals._count._all,
    } : null,
    card: card && openInvoices && currentInvoices ? {
      id: card.id, name: card.name, brand: card.brand,
      limitTotal: Number(card.limitTotal), limitUsed: used,
      limitAvailable: cardLimit.available, usedPercent: cardLimit.percent,
      closingDay: card.closingDay, dueDay: card.dueDay,
      currentInvoice: currentInvoice ? invoiceRemainingAmount(Number(currentInvoice.amount), Number(currentInvoice.paidAmount), currentInvoice.status) : 0,
      nextInvoice: nextInvoice ? invoiceRemainingAmount(Number(nextInvoice.amount), Number(nextInvoice.paidAmount), nextInvoice.status) : 0,
    } : null,
    cardsAvailable: cardCandidates !== null,
    installments: installments?.flatMap((item) => {
      const current = monthsBetween(item.startMonth, month) + 1;
      if (current < 1 || current > item.installmentCount) return [];
      return [{ id: item.id, description: item.description, current, count: item.installmentCount,
        monthlyAmount: Number(item.installmentAmount), endMonth: shiftYearMonth(item.startMonth, item.installmentCount - 1), cardName: item.card?.name ?? null }];
    }) ?? null,
  };
}
