"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { TransactionCategory } from "@prisma/client";
import { z } from "zod";
import { db } from "@/app/_lib/prisma";
import { getYearMonthRangeUtc, YEAR_MONTH_PATTERN } from "@/app/_lib/month-range";

export type FinanceActionState = { message: string; success: boolean };
const initialError = (message: string): FinanceActionState => ({ message, success: false });
const cents = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
const money = z.coerce.number().positive().finite().max(9999999999.99).refine(cents);
const nonnegativeMoney = z.coerce.number().min(0).finite().max(9999999999.99).refine(cents);
const month = z.string().regex(YEAR_MONTH_PATTERN);
const uuid = z.string().uuid();

async function userId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/commitments");
  revalidatePath("/cards");
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
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), category: z.nativeEnum(TransactionCategory), recurring: z.boolean() }).safeParse({
    description: formData.get("description"), amount: formData.get("amount"), dueDate: formData.get("dueDate"),
    category: formData.get("category"), recurring: formData.has("recurring"),
  });
  if (!parsed.success) return initialError("Preencha descrição, valor, data e categoria válidos.");
  const dueDate = new Date(`${parsed.data.dueDate}T12:00:00.000Z`);
  if (Number.isNaN(dueDate.valueOf()) || dueDate.toISOString().slice(0, 10) !== parsed.data.dueDate) return initialError("Data de vencimento inválida.");
  try {
    const owner = await userId();
    const dates = parsed.data.recurring ? Array.from({ length: 12 }, (_, index) => {
      const year = dueDate.getUTCFullYear();
      const monthIndex = dueDate.getUTCMonth() + index;
      const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
      return new Date(Date.UTC(year, monthIndex, Math.min(dueDate.getUTCDate(), lastDay), 12));
    }) : [dueDate];
    await db.monthlyCommitment.createMany({ data: dates.map((date) => ({ userId: owner,
      description: parsed.data.description, amount: parsed.data.amount, dueDate: date,
      category: parsed.data.category, recurring: parsed.data.recurring })) });
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
      db.monthlyCommitment.findFirst({ where: { id: parsed.data.commitmentId, userId: owner } }),
      db.transaction.findFirst({ where: { id: parsed.data.transactionId, userId: owner, type: "EXPENSE" } }),
    ]);
    if (!commitment || !transaction || commitment.status === "PAID" || commitment.transactionId) return initialError("Vínculo indisponível.");
    const range = getYearMonthRangeUtc(commitment.dueDate.toISOString().slice(0, 7));
    if (transaction.date < range.gte || transaction.date >= range.lt || Math.abs(Number(transaction.amount) - Number(commitment.amount)) > 0.01) return initialError("A transação deve ser uma despesa do mesmo mês e valor.");
    const updated = await db.monthlyCommitment.updateMany({ where: { id: commitment.id, userId: owner, transactionId: null, status: { not: "PAID" } }, data: { transactionId: transaction.id, status: "PAID" } });
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
    const updated = await db.monthlyCommitment.updateMany({ where: { id: parsed.data, userId: owner, status: "PENDING" }, data: { status: "CONFIRMED" } });
    if (updated.count !== 1) return initialError("Compromisso não encontrado ou já confirmado.");
    refresh();
    return { message: "Compromisso confirmado. Vincule a transação após o pagamento.", success: true };
  } catch (error) { return dbError(error); }
}

export type CommitmentManagerData = {
  commitments: Array<{
    id: string; description: string; amount: number; dueDate: string;
    category: TransactionCategory; recurring: boolean;
    status: "PENDING" | "CONFIRMED" | "PAID"; transactionId: string | null;
  }>;
  expenses: Array<{ id: string; name: string; amount: number }>;
};

export async function getCommitmentsForMonth(selectedMonth: string): Promise<CommitmentManagerData | null> {
  if (!month.safeParse(selectedMonth).success) throw new Error("Mês inválido.");
  const owner = await userId();
  const range = getYearMonthRangeUtc(selectedMonth);
  const [commitments, expenses] = await Promise.all([
    db.monthlyCommitment.findMany({ where: { userId: owner, dueDate: range }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }).catch((error: unknown) => {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return null;
      throw error;
    }),
    db.transaction.findMany({ where: { userId: owner, date: range, type: "EXPENSE" }, orderBy: { date: "desc" }, select: { id: true, name: true, amount: true } }),
  ]);
  if (commitments === null) return null;
  const linked = new Set(commitments.map((item) => item.transactionId).filter(Boolean));
  return {
    commitments: commitments.map((item) => ({ id: item.id, description: item.description,
      amount: Number(item.amount), dueDate: item.dueDate.toISOString(), category: item.category,
      recurring: item.recurring, status: item.status, transactionId: item.transactionId })),
    expenses: expenses.filter((item) => !linked.has(item.id)).map((item) => ({ id: item.id, name: item.name, amount: Number(item.amount) })),
  };
}

export async function updateCommitment(_state: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const parsed = z.object({ commitmentId: uuid, description: z.string().trim().min(1).max(120),
    amount: money, dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.nativeEnum(TransactionCategory), recurring: z.boolean() }).safeParse({
    commitmentId: formData.get("commitmentId"), description: formData.get("description"),
    amount: formData.get("amount"), dueDate: formData.get("dueDate"),
    category: formData.get("category"), recurring: formData.has("recurring"),
  });
  if (!parsed.success) return initialError("Preencha descrição, valor, data e categoria válidos.");
  const dueDate = new Date(`${parsed.data.dueDate}T12:00:00.000Z`);
  if (Number.isNaN(dueDate.valueOf()) || dueDate.toISOString().slice(0, 10) !== parsed.data.dueDate) return initialError("Data de vencimento inválida.");
  try {
    const owner = await userId();
    const current = await db.monthlyCommitment.findFirst({ where: { id: parsed.data.commitmentId, userId: owner } });
    if (!current) return initialError("Compromisso não encontrado.");
    if (current.status === "PAID") {
      await db.monthlyCommitment.update({ where: { id: current.id }, data: { description: parsed.data.description, category: parsed.data.category } });
    } else if (!current.transactionId) {
      const updated = await db.monthlyCommitment.updateMany({ where: { id: current.id, userId: owner, status: { not: "PAID" }, transactionId: null }, data: { description: parsed.data.description,
        amount: parsed.data.amount, dueDate, category: parsed.data.category, recurring: parsed.data.recurring } });
      if (updated.count !== 1) return initialError("O compromisso foi alterado. Atualize a lista e tente novamente.");
    } else return initialError("Compromisso vinculado não pode alterar valor ou vencimento.");
    refresh();
    return { message: "Compromisso atualizado.", success: true };
  } catch (error) { return dbError(error); }
}
