"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { upsertTransactionSchema } from "./shema";
import { revalidatePath } from "next/cache";

interface UpsertTransactionParams {
  id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  upsertTransactionSchema.parse(params);
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { id, ...data } = params;

  if (id) {
    const transaction = await db.transaction.findUnique({
      where: {
        id,
      },
    });

    if (transaction?.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const linked = await db.monthlyCommitment.findFirst({ where: { userId, transactionId: id }, select: { id: true } }).catch((error: unknown) => {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return null;
      throw error;
    });
    if (linked) throw new Error("Transações vinculadas a compromissos pagos não podem ser editadas.");

    await db.transaction.update({
      where: {
        id,
      },
      data: {
        ...data,
        userId,
      },
    });
  } else {
    await db.transaction.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
};
