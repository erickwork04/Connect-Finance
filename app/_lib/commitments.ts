import { db } from "@/app/_lib/prisma";
import { monthlyDueDate, monthsBetween, YEAR_MONTH_PATTERN } from "@/app/_lib/month-range";

/** Materialize only the selected month. The unique series/month key keeps concurrent reads idempotent. */
export async function ensureCommitmentOccurrences(userId: string, month: string): Promise<void> {
  if (!YEAR_MONTH_PATTERN.test(month)) throw new RangeError("Invalid year-month");
  const [series, plans] = await Promise.all([db.recurringCommitment.findMany({
    where: { userId, startMonth: { lte: month }, OR: [{ endMonth: null }, { endMonth: { gte: month } }] },
    select: { id: true, description: true, amount: true, category: true, dueDay: true },
  }), db.installmentPlan.findMany({
    where: { userId, status: "ACTIVE", startMonth: { lte: month } },
    select: { id: true, description: true, installmentAmount: true, installmentCount: true, startMonth: true, card: { select: { dueDay: true } } },
  })]);
  const activePlans = plans.filter((plan) => {
    const current = monthsBetween(plan.startMonth, month) + 1;
    return current >= 1 && current <= plan.installmentCount;
  });
  if (!series.length && !activePlans.length) return;

  const existing = await db.monthlyCommitment.findMany({
    where: { userId, recurrenceId: { in: series.map((item) => item.id) }, occurrenceMonth: month },
    select: { recurrenceId: true },
  });
  const existingIds = new Set(existing.map((item) => item.recurrenceId));
  const missing = series.filter((item) => !existingIds.has(item.id));
  if (missing.length) await db.monthlyCommitment.createMany({
    data: missing.map((item) => ({
      userId, recurrenceId: item.id, occurrenceMonth: month,
      description: item.description, amount: item.amount, category: item.category,
      dueDate: monthlyDueDate(month, item.dueDay), recurring: true,
    })),
    skipDuplicates: true,
  });

  if (activePlans.length) await db.monthlyCommitment.createMany({
    data: activePlans.map((plan) => ({
      userId,
      installmentPlanId: plan.id,
      occurrenceMonth: month,
      description: `${plan.description} · parcela ${monthsBetween(plan.startMonth, month) + 1}/${plan.installmentCount}`,
      amount: plan.installmentAmount,
      category: "OTHER",
      dueDate: monthlyDueDate(month, plan.card?.dueDay ?? 1),
      recurring: false,
    })),
    skipDuplicates: true,
  }).catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && (error.code === "P2021" || error.code === "P2022")) return;
    throw error;
  });
}
