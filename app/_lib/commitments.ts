import { db } from "@/app/_lib/prisma";
import { monthlyDueDate, YEAR_MONTH_PATTERN } from "@/app/_lib/month-range";

/** Materialize only the selected month. The unique series/month key keeps concurrent reads idempotent. */
export async function ensureCommitmentOccurrences(userId: string, month: string): Promise<void> {
  if (!YEAR_MONTH_PATTERN.test(month)) throw new RangeError("Invalid year-month");
  const series = await db.recurringCommitment.findMany({
    where: { userId, startMonth: { lte: month }, OR: [{ endMonth: null }, { endMonth: { gte: month } }] },
    select: { id: true, description: true, amount: true, category: true, dueDay: true },
  });
  if (!series.length) return;

  const existing = await db.monthlyCommitment.findMany({
    where: { userId, recurrenceId: { in: series.map((item) => item.id) }, occurrenceMonth: month },
    select: { recurrenceId: true },
  });
  const existingIds = new Set(existing.map((item) => item.recurrenceId));
  const missing = series.filter((item) => !existingIds.has(item.id));
  if (!missing.length) return;

  await db.monthlyCommitment.createMany({
    data: missing.map((item) => ({
      userId, recurrenceId: item.id, occurrenceMonth: month,
      description: item.description, amount: item.amount, category: item.category,
      dueDate: monthlyDueDate(month, item.dueDay), recurring: true,
    })),
    skipDuplicates: true,
  });
}
