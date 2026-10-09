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
import { getYearMonthRangeUtc } from "@/app/_lib/month-range";
import { ensureCommitmentOccurrences } from "@/app/_lib/commitments";

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
  let transactionId = id;

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
    const created = await db.transaction.create({
      data: {
        ...data,
        userId,
      },
      select: { id: true },
    });
    transactionId = created.id;
  }

  if (data.type === TransactionType.EXPENSE && transactionId) {
    const month = data.date.toISOString().slice(0, 7);
    await ensureCommitmentOccurrences(userId, month);
    const range = getYearMonthRangeUtc(month);
    const candidates = await db.monthlyCommitment.findMany({
      where: { userId, installmentPlanId: { not: null }, transactionId: null, status: { not: "PAID" }, dueDate: range, amount: data.amount },
      include: { installmentPlan: { select: { description: true } } },
      orderBy: { dueDate: "asc" },
    }).catch((error: unknown) => {
      if (typeof error === "object" && error !== null && "code" in error && (error.code === "P2021" || error.code === "P2022")) return [];
      throw error;
    });
    const transactionName = data.name.trim().toLocaleLowerCase("pt-BR");
    const matching = candidates.find((item) => {
      const description = item.installmentPlan?.description.trim().toLocaleLowerCase("pt-BR");
      return description && (transactionName === description || transactionName.startsWith(description) || description.startsWith(transactionName));
    });
    if (matching) await db.monthlyCommitment.updateMany({
      where: { id: matching.id, userId, transactionId: null, status: { not: "PAID" } },
      data: { transactionId, status: "PAID" },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/installments");
};
