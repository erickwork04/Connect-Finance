import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import { creditLimit } from "@/app/_lib/finance";
import { invoiceRemainingAmount } from "@/app/_lib/card-invoice";
import { monthsBetween, resolveYearMonth, shiftYearMonth } from "@/app/_lib/month-range";
import { clampPage, parsePagination } from "@/app/_lib/pagination";
import { getPlanPermissions } from "@/app/_lib/plan-permissions";
import CardsScreen from "./_components/cards-screen";

export const dynamic = "force-dynamic";

function optional<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && (error.code === "P2021" || error.code === "P2022")) return null;
    throw error;
  });
}

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ month?: string | string[]; page?: string | string[]; pageSize?: string | string[] }> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  if (params.month !== month) redirect(`/cards?month=${month}`);
  const pagination = parsePagination(params.page, params.pageSize);
  const cardsWhere = { userId, isActive: true };
  const total = await optional(db.creditCard.count({ where: cardsWhere }));
  if (total === null) return <CardsScreen cards={null} installments={null} month={month} totalCards={0} totalLimit={0} totalUsed={0} page={1} pageSize={pagination.pageSize} />;
  const page = clampPage(pagination.page, total, pagination.pageSize);
  if (page !== pagination.page || (typeof params.pageSize === "string" ? params.pageSize : undefined) !== String(pagination.pageSize)) redirect(`/cards?month=${month}&page=${page}&pageSize=${pagination.pageSize}`);

  const nextMonth = shiftYearMonth(month, 1);
  const oldestActiveStart = shiftYearMonth(month, -119);
  const [records, openInvoiceTotals, installmentGroups, installmentRows, limitTotals, permissions] = await Promise.all([
    optional(db.creditCard.findMany({ where: cardsWhere, select: { id: true, name: true, brand: true, isPrimary: true, isActive: true, limitTotal: true, closingDay: true, dueDay: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }, { id: "asc" }], skip: (page - 1) * pagination.pageSize, take: pagination.pageSize })),
    optional(db.cardInvoice.aggregate({ where: { userId, status: "OPEN" }, _sum: { amount: true, paidAmount: true } })),
    optional(db.installmentPlan.groupBy({ by: ["cardId", "startMonth", "installmentCount"], where: { userId, status: "ACTIVE", cardId: { not: null }, startMonth: { gte: oldestActiveStart, lte: month } }, _count: { _all: true } })),
    optional(db.installmentPlan.findMany({ where: { userId, status: "ACTIVE", startMonth: { gte: oldestActiveStart, lte: month } }, select: { id: true, description: true, installmentAmount: true, installmentCount: true, startMonth: true, card: { select: { name: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 40 })),
    optional(db.creditCard.aggregate({ where: cardsWhere, _sum: { limitTotal: true } })),
    getPlanPermissions(userId),
  ]);
  if (!records || !openInvoiceTotals || !installmentGroups || !installmentRows || !limitTotals) {
    return <CardsScreen cards={null} installments={null} month={month} totalCards={total} totalLimit={0} totalUsed={0} page={page} pageSize={pagination.pageSize} />;
  }
  const cardIds = records.map((record) => record.id);
  const [invoiceUse, currentInvoices] = await Promise.all([
    cardIds.length ? optional(db.cardInvoice.groupBy({ by: ["cardId"], where: { userId, status: "OPEN", cardId: { in: cardIds } }, _sum: { amount: true, paidAmount: true } })) : Promise.resolve([]),
    cardIds.length ? optional(db.cardInvoice.findMany({ where: { userId, cardId: { in: cardIds }, month: { in: [month, nextMonth] } }, select: { cardId: true, month: true, amount: true, paidAmount: true, status: true } })) : Promise.resolve([]),
  ]);
  if (!invoiceUse || !currentInvoices) return <CardsScreen cards={null} installments={null} month={month} totalCards={total} totalLimit={0} totalUsed={0} page={page} pageSize={pagination.pageSize} />;
  const invoiceByCard = new Map(invoiceUse.map((item) => [item.cardId, Math.max(0, Number(item._sum.amount ?? 0) - Number(item._sum.paidAmount ?? 0))]));
  const invoicesByCard = new Map<string, typeof currentInvoices>();
  for (const invoice of currentInvoices) invoicesByCard.set(invoice.cardId, [...(invoicesByCard.get(invoice.cardId) ?? []), invoice]);
  const installmentCounts = new Map<string, number>();
  for (const group of installmentGroups) {
    if (!group.cardId) continue;
    const current = monthsBetween(group.startMonth, month) + 1;
    if (current >= 1 && current <= group.installmentCount) installmentCounts.set(group.cardId, (installmentCounts.get(group.cardId) ?? 0) + group._count._all);
  }
  const cards = records.map((card) => {
    const invoices = invoicesByCard.get(card.id) ?? [];
    const currentInvoice = invoices.find((invoice) => invoice.month === month);
    const nextInvoice = invoices.find((invoice) => invoice.month === nextMonth);
    const used = invoiceByCard.get(card.id) ?? 0;
    const limit = creditLimit(Number(card.limitTotal), used);
    return {
      ...card,
      limitTotal: Number(card.limitTotal), limitUsed: used, limitAvailable: limit.available, usedPercent: limit.percent,
      invoiceAmount: currentInvoice ? invoiceRemainingAmount(Number(currentInvoice.amount), Number(currentInvoice.paidAmount), currentInvoice.status) : 0,
      invoicePaidAmount: Number(currentInvoice?.paidAmount ?? 0),
      nextInvoiceAmount: nextInvoice ? invoiceRemainingAmount(Number(nextInvoice.amount), Number(nextInvoice.paidAmount), nextInvoice.status) : 0,
      invoiceStatusLabel: currentInvoice?.status === "PAID" ? "Paga" : currentInvoice && Number(currentInvoice.paidAmount) > 0 ? "Pagamento parcial" : currentInvoice ? "Em aberto" : "Sem fatura lançada",
      installmentsCount: installmentCounts.get(card.id) ?? 0,
    };
  });
  const installments = installmentRows.flatMap((item) => {
    const current = monthsBetween(item.startMonth, month) + 1;
    return current >= 1 && current <= item.installmentCount ? [{ id: item.id, description: item.description, current, count: item.installmentCount, monthlyAmount: Number(item.installmentAmount), cardName: item.card?.name ?? null }] : [];
  }).slice(0, 4);
  const totalUsed = Math.max(0, Number(openInvoiceTotals._sum.amount ?? 0) - Number(openInvoiceTotals._sum.paidAmount ?? 0));
  return <CardsScreen cards={cards} installments={installments} month={month} totalCards={total} totalLimit={Number(limitTotals._sum.limitTotal ?? 0)} totalUsed={totalUsed} page={page} pageSize={pagination.pageSize} canCreateCard={permissions.creditCardLimit === null || total < permissions.creditCardLimit} />;
}
