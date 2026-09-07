import { db } from "@/app/_lib/prisma";
import { getAuthUserId } from "@/app/_lib/auth";
import { endOfMonth, startOfMonth } from "date-fns";

export const getCurrentMonthTransactions = async () => {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return db.transaction.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth(new Date()),
        lt: endOfMonth(new Date()),
      },
    },
  });
};
