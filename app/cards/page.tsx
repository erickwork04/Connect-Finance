import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import { creditLimit } from "@/app/_lib/finance";
import { invoiceRemainingAmount } from "@/app/_lib/card-invoice";
import { monthsBetween, resolveYearMonth, shiftYearMonth } from "@/app/_lib/month-range";
import CardsScreen from "./_components/cards-screen";
import { getPlanPermissions } from "@/app/_lib/plan-permissions";

export const dynamic = "force-dynamic";

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  if (params.month !== month) redirect(`/cards?month=${month}`);
  const optional = <T,>(promise: Promise<T>): Promise<T | null> => promise.catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && (error.code === "P2021" || error.code === "P2022")) return null;
    throw error;
  });
  const [records, plans, permissions] = await Promise.all([
    optional(db.creditCard.findMany({ where: { userId, isActive: true },
      include: { invoices: true, installments: { where: { status: "ACTIVE" } } },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    })),
    optional(db.installmentPlan.findMany({ where: { userId, status: "ACTIVE", startMonth: { lte: month } },
      include: { card: { select: { name: true } } }, orderBy: { createdAt: "desc" } })),
    getPlanPermissions(userId),
  ]);
  const cards = records?.map((card) => {
    const used = card.invoices.reduce((sum, invoice) => sum + invoiceRemainingAmount(
      Number(invoice.amount), Number(invoice.paidAmount), invoice.status,
    ), 0);
    const limit = creditLimit(Number(card.limitTotal), used);
    const currentInvoice = card.invoices.find((invoice) => invoice.month === month);
    const nextInvoice = card.invoices.find((invoice) => invoice.month === shiftYearMonth(month, 1));
    return {
      id: card.id, name: card.name, brand: card.brand, isPrimary: card.isPrimary, isActive: card.isActive, limitTotal: Number(card.limitTotal), limitUsed: used,
      limitAvailable: limit.available, usedPercent: limit.percent, closingDay: card.closingDay, dueDay: card.dueDay,
      invoiceAmount: currentInvoice ? invoiceRemainingAmount(Number(currentInvoice.amount), Number(currentInvoice.paidAmount), currentInvoice.status) : 0,
      invoicePaidAmount: Number(currentInvoice?.paidAmount ?? 0),
      nextInvoiceAmount: nextInvoice ? invoiceRemainingAmount(Number(nextInvoice.amount), Number(nextInvoice.paidAmount), nextInvoice.status) : 0,
      invoiceStatusLabel: currentInvoice?.status === "PAID" ? "Paga" : currentInvoice && Number(currentInvoice.paidAmount) > 0 ? "Pagamento parcial" : currentInvoice ? "Em aberto" : "Sem fatura lançada",
      installmentsCount: card.installments.filter((item) => { const current = monthsBetween(item.startMonth, month) + 1; return current >= 1 && current <= item.installmentCount; }).length,
    };
  }) ?? null;
  const installments = plans?.flatMap((item) => {
    const current = monthsBetween(item.startMonth, month) + 1;
    return current >= 1 && current <= item.installmentCount ? [{ id: item.id, description: item.description,
      current, count: item.installmentCount, monthlyAmount: Number(item.installmentAmount), cardName: item.card?.name ?? null }] : [];
  }) ?? null;
  return <CardsScreen cards={cards} installments={installments} month={month} canCreateCard={permissions.creditCardLimit === null || (cards?.length ?? 0) < permissions.creditCardLimit} />;
}
