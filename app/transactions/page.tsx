import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Prisma, TransactionCategory, TransactionType } from "@prisma/client";
import Navbar from "@/app/_components/navbar";
import { getPlanPermissions } from "@/app/_lib/plan-permissions";
import { getYearMonthRangeUtc, resolveYearMonth } from "@/app/_lib/month-range";
import { clampPage, parsePagination } from "@/app/_lib/pagination";
import { db } from "@/app/_lib/prisma";
import TransactionsScreen from "./_components/transactions-screen";
import TransactionsHeader from "./_components/transactions-header";
import CommitmentsManager from "@/app/_components/commitments-manager";
import { getCommitmentsForMonth } from "@/app/_actions/dashboard-v2";
import { toTransactionRow } from "./_lib/transaction-row";
import type { PeriodMetrics } from "./_lib/period-metrics";

type SearchParams = { month?: string | string[]; view?: string | string[]; page?: string | string[]; pageSize?: string | string[]; search?: string | string[]; category?: string | string[]; period?: string | string[] };

function scalar(value: string | string[] | undefined) { return typeof value === "string" ? value : undefined; }

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  const view = params.view === "commitments" ? "commitments" : "transactions";
  if (params.month !== month) redirect(`/transactions?month=${month}${view === "commitments" ? "&view=commitments" : ""}`);

  if (view === "commitments") {
    const pagination = parsePagination(params.page, params.pageSize);
    const data = await getCommitmentsForMonth(month, pagination.page, pagination.pageSize);
    if (data) {
      const canonicalPageSize = scalar(params.pageSize) !== String(pagination.pageSize);
      if (data.page !== pagination.page || canonicalPageSize) redirect(`/transactions?month=${month}&view=commitments&page=${data.page}&pageSize=${pagination.pageSize}`);
    }
    return <><Navbar /><main className="app-shell-content mx-auto w-full max-w-[1680px] min-w-0 space-y-4 px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
      <TransactionsHeader month={month} view={view} />
      <section aria-label="Gerenciar compromissos" className="min-w-0 rounded-xl border border-border bg-[#141816] p-4 sm:p-5">
      <CommitmentsManager key={`${month}-${pagination.page}-${pagination.pageSize}`} month={month} page={pagination.page} pageSize={pagination.pageSize} initialData={data} />
      </section>
    </main></>;
  }

  const pagination = parsePagination(params.page, params.pageSize);
  const search = (scalar(params.search) ?? "").trim().slice(0, 80);
  const requestedCategory = scalar(params.category);
  const category = Object.values(TransactionCategory).find((value) => value === requestedCategory) ?? "all";
  const requestedPeriod = scalar(params.period);
  const period = requestedPeriod === "seven" || requestedPeriod === "fifteen" || requestedPeriod === "thirty" ? requestedPeriod : "month";
  const monthRange = getYearMonthRangeUtc(month);
  let dateRange: Prisma.DateTimeFilter = monthRange;
  if (period !== "month") {
    const [year, monthNumber] = month.split("-").map(Number);
    const current = new Date();
    const isCurrent = current.getUTCFullYear() === year && current.getUTCMonth() + 1 === monthNumber;
    const days = period === "seven" ? 7 : period === "fifteen" ? 15 : 30;
    const monthEnd = isCurrent
      ? new Date(Date.UTC(year, monthNumber - 1, current.getUTCDate() + 1))
      : monthRange.lt;
    const periodStart = new Date(monthEnd.getTime() - days * 86_400_000);
    dateRange = { gte: periodStart > monthRange.gte ? periodStart : monthRange.gte, lt: monthEnd < monthRange.lt ? monthEnd : monthRange.lt };
  }
  const where: Prisma.TransactionWhereInput = {
    userId,
    date: dateRange,
    ...(category === "all" ? {} : { category }),
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };
  const total = await db.transaction.count({ where });
  const page = clampPage(pagination.page, total, pagination.pageSize);
  const canonicalPageSize = scalar(params.pageSize) !== String(pagination.pageSize);
  if (page !== pagination.page || canonicalPageSize) redirect(`/transactions?month=${month}&page=${page}&pageSize=${pagination.pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}${category !== "all" ? `&category=${category}` : ""}${period !== "month" ? `&period=${period}` : ""}`);
  const [transactions, typeTotals, categoryTotals, average, largestExpense, largestRevenue, permissions] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      select: { id: true, name: true, type: true, category: true, paymentMethod: true, source: true, amount: true, date: true },
    }),
    db.transaction.groupBy({ by: ["type"], where, _sum: { amount: true }, _count: { _all: true } }),
    db.transaction.groupBy({ by: ["category"], where: { ...where, type: TransactionType.EXPENSE }, _sum: { amount: true }, _count: { _all: true } }),
    db.transaction.aggregate({ where, _avg: { amount: true } }),
    db.transaction.findFirst({ where: { ...where, type: TransactionType.EXPENSE }, orderBy: [{ amount: "desc" }, { date: "desc" }, { id: "desc" }], select: { name: true, amount: true } }),
    db.transaction.findFirst({ where: { ...where, type: TransactionType.DEPOSIT }, orderBy: [{ amount: "desc" }, { date: "desc" }, { id: "desc" }], select: { name: true, amount: true } }),
    getPlanPermissions(userId),
  ]);
  const sumFor = (type: TransactionType) => Number(typeTotals.find((item) => item.type === type)?._sum.amount ?? 0);
  const expenses = sumFor(TransactionType.EXPENSE);
  const metrics: PeriodMetrics = {
    count: total,
    expenseCount: categoryTotals.reduce((sum, item) => sum + item._count._all, 0),
    revenue: sumFor(TransactionType.DEPOSIT),
    expenses,
    invested: sumFor(TransactionType.INVESTMENT),
    averageTicket: Number(average._avg.amount ?? 0),
    largestExpense: largestExpense ? { name: largestExpense.name, amount: Number(largestExpense.amount) } : null,
    largestRevenue: largestRevenue ? { name: largestRevenue.name, amount: Number(largestRevenue.amount) } : null,
    categories: categoryTotals.map((item) => ({ category: item.category, amount: Number(item._sum.amount ?? 0), count: item._count._all, percent: expenses ? Number(item._sum.amount ?? 0) / expenses * 100 : 0 })).sort((a, b) => b.amount - a.amount),
  };

  return <><Navbar /><main className="app-shell-content mx-auto w-full max-w-[1680px] min-w-0 space-y-4 px-4 py-5 sm:px-6 sm:py-6 xl:px-8"><TransactionsHeader month={month} view={view} /><TransactionsScreen key={month} rows={transactions.map(toTransactionRow)} metrics={metrics} pagination={{ page, pageSize: pagination.pageSize, total }} canAdd={true} canImportFiles={permissions.canImportFiles} /></main></>;
}
