"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { TransactionCategory } from "@prisma/client";
import { z } from "zod";
import { db } from "@/app/_lib/prisma";
import { getYearMonthRangeUtc, monthlyDueDate, YEAR_MONTH_PATTERN } from "@/app/_lib/month-range";
import { ensureCommitmentOccurrences } from "@/app/_lib/commitments";

export type FinanceActionState = { message: string; success: boolean };
const initialError = (message: string): FinanceActionState => ({ message, success: false });
const cents = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
const numericMoney = (value: unknown) => value === "" || value === null ? Number.NaN : value;
const money = z.preprocess(numericMoney, z.coerce.number().positive().finite().max(9999999999.99).refine(cents));
const nonnegativeMoney = z.preprocess(numericMoney, z.coerce.number().min(0).finite().max(9999999999.99).refine(cents));
const month = z.string().regex(YEAR_MONTH_PATTERN);
const uuid = z.string().uuid();

async function userId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/cards");
  revalidatePath("/transactions");
}

function dbError(error: unknown): FinanceActionState {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") {
    return initialError("Atualização do banco pendente. O cadastro ainda não está disponível.");
  }
  return initialError("Não foi possível salvar. Verifique os dados e tente novamente.");
}

export async function createCard(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = z.object({ name: z.string().trim().min(1).max(80), brand: z.string().trim().min(1).max(40), limitTotal: money,
    closingDay: z.coerce.number().int().min(1).max(31), dueDay: z.coerce.number().int().min(1).max(31), isPrimary: z.boolean() }).safeParse({
    name: formData.get("name"), brand: formData.get("brand"), limitTotal: formData.get("limitTotal"),
    closingDay: formData.get("closingDay"), dueDay: formData.get("dueDay"), isPrimary: formData.has("isPrimary"),
  });
  if (!parsed.success) return initialError("Preencha nome, bandeira, limite e dias válidos (1 a 31).");
  try {
    const owner = await userId();
    await db.$transaction(async (tx) => {
      if (parsed.data.isPrimary) await tx.creditCard.updateMany({ where: { userId: owner }, data: { isPrimary: false } });
      await tx.creditCard.create({ data: { userId: owner, ...parsed.data } });
    });
    refresh();
    return { message: "Cartão cadastrado.", success: true };
  } catch (error) { return dbError(error); }
}

export async function saveInvoice(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = z.object({ cardId: uuid, month, amount: nonnegativeMoney, status: z.enum(["OPEN", "PAID"]) }).safeParse({
    cardId: formData.get("cardId"), month: formData.get("month"), amount: formData.get("amount"), status: formData.get("status"),
  });
  if (!parsed.success) return initialError("Informe cartão, mês, valor e status válidos.");
  try {
    const owner = await userId();
    const card = await db.creditCard.findFirst({ where: { id: parsed.data.cardId, userId: owner } });
    if (!card) return initialError("Cartão não encontrado.");
    const { cardId, month: invoiceMonth, amount, status } = parsed.data;
    await db.cardInvoice.upsert({ where: { cardId_month: { cardId, month: invoiceMonth } },
      create: { userId: owner, cardId, month: invoiceMonth, amount, status }, update: { amount, status } });
    refresh();
    return { message: "Fatura salva.", success: true };
  } catch (error) { return dbError(error); }
}

export async function createInstallment(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = z.object({ description: z.string().trim().min(1).max(120), totalAmount: money, installmentAmount: money,
    installmentCount: z.coerce.number().int().min(1).max(120), startMonth: month, cardId: uuid.optional() }).safeParse({
    description: formData.get("description"), totalAmount: formData.get("totalAmount"), installmentAmount: formData.get("installmentAmount"),
    installmentCount: formData.get("installmentCount"), startMonth: formData.get("startMonth"), cardId: formData.get("cardId") || undefined,
  });
  if (!parsed.success) return initialError("Preencha descrição, valores, número de parcelas e mês válidos.");
  const { totalAmount, installmentAmount, installmentCount } = parsed.data;
  if (Math.abs(totalAmount - installmentAmount * installmentCount) > 0.05) return initialError("O total deve corresponder ao valor mensal multiplicado pelas parcelas.");
  try {
    const owner = await userId();
    if (parsed.data.cardId && !await db.creditCard.findFirst({ where: { id: parsed.data.cardId, userId: owner, isActive: true } })) return initialError("Cartão inválido.");
    await db.installmentPlan.create({ data: { userId: owner, ...parsed.data } });
    refresh();
    return { message: "Parcelamento cadastrado.", success: true };
  } catch (error) { return dbError(error); }
}

export async function createCommitment(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = z.object({ description: z.string().trim().min(1).max(120), amount: money,
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), category: z.nativeEnum(TransactionCategory), recurring: z.boolean(),
    recurrenceDay: z.coerce.number().int().min(1).max(31).optional() }).safeParse({
    description: formData.get("description"), amount: formData.get("amount"), dueDate: formData.get("dueDate"),
    category: formData.get("category"), recurring: formData.has("recurring"), recurrenceDay: formData.get("recurrenceDay") || undefined,
  });
  if (!parsed.success) return initialError("Preencha descrição, valor, data e categoria válidos.");
  if (parsed.data.recurring && !parsed.data.recurrenceDay) return initialError("Selecione o dia de vencimento (1 a 31).");
  const dueDate = new Date(`${parsed.data.dueDate}T12:00:00.000Z`);
  if (Number.isNaN(dueDate.valueOf()) || dueDate.toISOString().slice(0, 10) !== parsed.data.dueDate) return initialError("Data de vencimento inválida.");
  try {
    const owner = await userId();
    if (parsed.data.recurring) {
      const startMonth = parsed.data.dueDate.slice(0, 7);
      const dueDay = parsed.data.recurrenceDay!;
      await db.recurringCommitment.create({ data: {
        userId: owner, description: parsed.data.description, amount: parsed.data.amount,
        category: parsed.data.category, dueDay, startMonth,
        occurrences: { create: {
          userId: owner, description: parsed.data.description, amount: parsed.data.amount,
          category: parsed.data.category, dueDate: monthlyDueDate(startMonth, dueDay),
          occurrenceMonth: startMonth, recurring: true,
        } },
      } });
    } else {
      await db.monthlyCommitment.create({ data: {
        userId: owner, description: parsed.data.description, amount: parsed.data.amount,
        dueDate, category: parsed.data.category, recurring: false,
      } });
    }
    refresh();
    return { message: "Compromisso cadastrado.", success: true };
  } catch (error) { return dbError(error); }
}

export async function linkCommitment(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = z.object({ commitmentId: uuid, transactionId: uuid }).safeParse({ commitmentId: formData.get("commitmentId"), transactionId: formData.get("transactionId") });
  if (!parsed.success) return initialError("Selecione um compromisso e uma transação.");
  try {
    const owner = await userId();
    const [commitment, transaction] = await Promise.all([
      db.monthlyCommitment.findFirst({ where: { id: parsed.data.commitmentId, userId: owner, deletedAt: null } }),
      db.transaction.findFirst({ where: { id: parsed.data.transactionId, userId: owner, type: "EXPENSE" } }),
    ]);
    if (!commitment || !transaction || commitment.status === "PAID" || commitment.transactionId) return initialError("Vínculo indisponível.");
    const range = getYearMonthRangeUtc(commitment.dueDate.toISOString().slice(0, 7));
    if (transaction.date < range.gte || transaction.date >= range.lt || Math.abs(Number(transaction.amount) - Number(commitment.amount)) > 0.01) return initialError("A transação deve ser uma despesa do mesmo mês e valor.");
    const updated = await db.monthlyCommitment.updateMany({ where: { id: commitment.id, userId: owner, deletedAt: null, transactionId: null, status: { not: "PAID" } }, data: { transactionId: transaction.id, status: "PAID" } });
    if (updated.count !== 1) return initialError("O compromisso foi alterado. Atualize a página e tente novamente.");
    refresh();
    return { message: "Transação vinculada; compromisso pago sem duplicar o saldo.", success: true };
  } catch (error) { return dbError(error); }
}

export async function confirmCommitment(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = uuid.safeParse(formData.get("commitmentId"));
  if (!parsed.success) return initialError("Compromisso inválido.");
  try {
    const owner = await userId();
    const updated = await db.monthlyCommitment.updateMany({ where: { id: parsed.data, userId: owner, deletedAt: null, status: "PENDING" }, data: { status: "CONFIRMED" } });
    if (updated.count !== 1) return initialError("Compromisso não encontrado ou já confirmado.");
    refresh();
    return { message: "Compromisso confirmado. Vincule a transação após o pagamento.", success: true };
  } catch (error) { return dbError(error); }
}

export type CommitmentManagerData = {
  commitments: Array<{
    id: string; description: string; amount: number; dueDate: string;
    category: TransactionCategory; recurring: boolean; recurrenceId: string | null; recurrenceEndMonth: string | null;
    status: "PENDING" | "CONFIRMED" | "PAID"; transactionId: string | null;
  }>;
  expenses: Array<{ id: string; name: string; amount: number }>;
};

export async function getCommitmentsForMonth(selectedMonth: string): Promise<CommitmentManagerData | null> {
  if (!month.safeParse(selectedMonth).success) throw new Error("Mês inválido.");
  const owner = await userId();
  await ensureCommitmentOccurrences(owner, selectedMonth);
  const range = getYearMonthRangeUtc(selectedMonth);
  const [commitments, expenses] = await Promise.all([
    db.monthlyCommitment.findMany({ where: { userId: owner, dueDate: range, deletedAt: null }, include: { recurrence: { select: { endMonth: true } } }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }).catch((error: unknown) => {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return null;
      throw error;
    }),
    db.transaction.findMany({ where: { userId: owner, date: range, type: "EXPENSE" }, orderBy: { date: "desc" }, select: { id: true, name: true, amount: true, commitment: { select: { id: true } } } }),
  ]);
  if (commitments === null) return null;
  return {
    commitments: commitments.map((item) => ({ id: item.id, description: item.description,
      amount: Number(item.amount), dueDate: item.dueDate.toISOString(), category: item.category,
      recurring: item.recurring, recurrenceId: item.recurrenceId, recurrenceEndMonth: item.recurrence?.endMonth ?? null,
      status: item.status, transactionId: item.transactionId })),
    expenses: expenses.filter((item) => !item.commitment).map((item) => ({ id: item.id, name: item.name, amount: Number(item.amount) })),
  };
}

export async function updateCommitment(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = z.object({ commitmentId: uuid, description: z.string().trim().min(1).max(120),
    amount: money, dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.nativeEnum(TransactionCategory) }).safeParse({
    commitmentId: formData.get("commitmentId"), description: formData.get("description"),
    amount: formData.get("amount"), dueDate: formData.get("dueDate"),
    category: formData.get("category"),
  });
  if (!parsed.success) return initialError("Preencha descrição, valor, data e categoria válidos.");
  const dueDate = new Date(`${parsed.data.dueDate}T12:00:00.000Z`);
  if (Number.isNaN(dueDate.valueOf()) || dueDate.toISOString().slice(0, 10) !== parsed.data.dueDate) return initialError("Data de vencimento inválida.");
  try {
    const owner = await userId();
    const current = await db.monthlyCommitment.findFirst({ where: { id: parsed.data.commitmentId, userId: owner, deletedAt: null } });
    if (!current) return initialError("Compromisso não encontrado.");
    if (current.status === "PAID") {
      await db.monthlyCommitment.update({ where: { id: current.id }, data: { description: parsed.data.description, category: parsed.data.category } });
    } else if (!current.transactionId) {
      if (current.recurrenceId && dueDate.toISOString().slice(0, 7) !== current.occurrenceMonth) return initialError("Mantenha a edição desta recorrência no mesmo mês.");
      const updated = await db.monthlyCommitment.updateMany({ where: { id: current.id, userId: owner, deletedAt: null, status: { not: "PAID" }, transactionId: null }, data: { description: parsed.data.description,
        amount: parsed.data.amount, dueDate, category: parsed.data.category } });
      if (updated.count !== 1) return initialError("O compromisso foi alterado. Atualize a lista e tente novamente.");
    } else return initialError("Compromisso vinculado não pode alterar valor ou vencimento.");
    refresh();
    return { message: "Compromisso atualizado.", success: true };
  } catch (error) { return dbError(error); }
}

export async function deleteCommitment(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = uuid.safeParse(formData.get("commitmentId"));
  if (!parsed.success) return initialError("Compromisso inválido.");
  try {
    const owner = await userId();
    // Keep a tombstone so a deleted recurring month is not generated again.
    // A linked transaction is never deleted or changed by this action.
    const updated = await db.monthlyCommitment.updateMany({
      where: { id: parsed.data, userId: owner, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (updated.count !== 1) return initialError("Compromisso não encontrado ou já excluído.");
    refresh();
    return { message: "Compromisso excluído deste mês. A transação vinculada, se houver, foi preservada.", success: true };
  } catch (error) { return dbError(error); }
}

export async function endRecurringCommitment(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = z.object({ recurrenceId: uuid, lastMonth: month }).safeParse({
    recurrenceId: formData.get("recurrenceId"), lastMonth: formData.get("lastMonth"),
  });
  if (!parsed.success) return initialError("Recorrência inválida.");
  try {
    const owner = await userId();
    const series = await db.recurringCommitment.findFirst({ where: { id: parsed.data.recurrenceId, userId: owner } });
    if (!series || series.endMonth || parsed.data.lastMonth < series.startMonth) return initialError("Recorrência não disponível.");
    const result = await db.$transaction(async (tx) => {
      const futurePaid = await tx.monthlyCommitment.findFirst({ where: {
        recurrenceId: series.id, userId: owner, occurrenceMonth: { gt: parsed.data.lastMonth }, deletedAt: null,
        OR: [{ status: { not: "PENDING" } }, { transactionId: { not: null } }],
      }, select: { id: true } });
      if (futurePaid) return false;
      const updated = await tx.recurringCommitment.updateMany({ where: { id: series.id, userId: owner, endMonth: null }, data: { endMonth: parsed.data.lastMonth } });
      if (updated.count !== 1) return false;
      await tx.monthlyCommitment.updateMany({ where: {
        recurrenceId: series.id, userId: owner, occurrenceMonth: { gt: parsed.data.lastMonth },
        status: "PENDING", transactionId: null, deletedAt: null,
      }, data: { deletedAt: new Date() } });
      return true;
    });
    if (!result) return initialError("Há meses futuros confirmados ou pagos. Revise-os antes de encerrar a recorrência.");
    refresh();
    return { message: "Recorrência encerrada após este mês.", success: true };
  } catch (error) { return dbError(error); }
}
