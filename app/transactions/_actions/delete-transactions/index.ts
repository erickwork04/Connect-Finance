"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { DeleteTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";

export const deleteTransaction = async ({
  transactionId,
}: DeleteTransactionSchema) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const transaction = await db.transaction.findUnique({
    where: {
      id: transactionId,
    },
  });

  if (transaction?.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const linked = await db.monthlyCommitment.findFirst({ where: { userId, transactionId }, select: { id: true } }).catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return null;
    throw error;
  });
  if (linked) throw new Error("Transações vinculadas a compromissos pagos não podem ser excluídas.");

  await db.transaction.delete({
    where: {
      id: transactionId,
    },
  });
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
};
