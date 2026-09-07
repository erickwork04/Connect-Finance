import { db } from "@/app/_lib/prisma";
import { TransactionCategory, TransactionType } from "@prisma/client";
import { TotalExpensePerCategory, TransactionPercentagePerType } from "./types";
import { getAuthUserId } from "@/app/_lib/auth";

export const getDashboard = async (month: string) => {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const currentYear = new Date().getFullYear();
  const where = {
    userId,
    date: {
      gte: new Date(`${currentYear}-${month}-01`),
      lt: new Date(`${currentYear}-${month}-31`),
    },
  };
  const depositsTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: "DEPOSIT" },
        _sum: { amount: true },
      })
    )?._sum?.amount || 0,
  );
  const investmentsTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: "INVESTMENT" },
        _sum: { amount: true },
      })
    )?._sum?.amount || 0,
  );
  const expensesTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: "EXPENSE" },
        _sum: { amount: true },
      })
    )?._sum?.amount || 0,
  );

  const balance = depositsTotal - investmentsTotal - expensesTotal;

  const transactionsTotal = Number(
    (
      await db.transaction.aggregate({
        where,
        _sum: { amount: true },
      })
    )?._sum?.amount || 0,
  );
  const totalForPercentage = transactionsTotal > 0 ? transactionsTotal : 1;
  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]: Math.round(
      (Number(depositsTotal || 0) / totalForPercentage) * 100,
    ),
    [TransactionType.EXPENSE]: Math.round(
      (Number(expensesTotal || 0) / totalForPercentage) * 100,
    ),
    [TransactionType.INVESTMENT]: Math.round(
      (Number(investmentsTotal || 0) / totalForPercentage) * 100,
    ),
  };

  const totalExpensePerCategory: TotalExpensePerCategory[] = (
    await db.transaction.groupBy({
      by: ["category"],
      where: {
        ...where,
        type: TransactionType.EXPENSE,
      },
      _sum: {
        amount: true,
      },
    })
  ).map((category: { category: TransactionCategory; _sum: { amount: unknown } }) => ({
    category: category.category,
    totalAmount: Number(category._sum.amount),
    percentageOfTotal: expensesTotal > 0
      ? Math.round(
          (Number(category._sum.amount) / Number(expensesTotal)) * 100,
        )
      : 0,
  }));
  const lastTransactions = await db.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    take: 20,
  });

  return {
    balance,
    depositsTotal,
    investmentsTotal,
    expensesTotal,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions: JSON.parse(JSON.stringify(lastTransactions)),
  };
};
