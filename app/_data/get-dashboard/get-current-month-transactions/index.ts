import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getCurrentMonthRangeLocal } from "@/app/_lib/month-range";

export const getCurrentMonthTransactions = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return db.transaction.count({
    where: {
      userId,
      createdAt: getCurrentMonthRangeLocal(new Date()),
    },
  });
};
