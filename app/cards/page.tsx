import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import { creditLimit } from "@/app/_lib/finance";
import { monthsBetween, resolveYearMonth, shiftYearMonth } from "@/app/_lib/month-range";
import CardsScreen from "./_components/cards-screen";

export const dynamic = "force-dynamic";

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  if (params.month !== month) redirect(`/cards?month=${month}`);
  const optional = <T,>(promise: Promise<T>): Promise<T | null> => promise.catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return null;
    throw error;
  });
  const [records, plans] = await Promise.all([
    optional(db.creditCard.findMany({ where: { userId, isActive: true },
      include: { invoices: true, installments: { where: { status: "ACTIVE" } } },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    })),
    optional(db.installmentPlan.findMany({ where: { userId, status: "ACTIVE", startMonth: { lte: month } },
      include: { card: { select: { name: true } } }, orderBy: { createdAt: "desc" } })),
  ]);
  const cards = records?.map((card) => {
    const used = card.invoices.filter((invoice) => invoice.status === "OPEN").reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const limit = creditLimit(Number(card.limitTotal), used);
    return {
      id: card.id, name: card.name, brand: card.brand, limitTotal: Number(card.limitTotal), limitUsed: used,
      limitAvailable: limit.available, usedPercent: limit.percent, closingDay: card.closingDay, dueDay: card.dueDay,
      invoiceAmount: Number(card.invoices.find((invoice) => invoice.month === month)?.amount ?? 0),
      nextInvoiceAmount: Number(card.invoices.find((invoice) => invoice.month === shiftYearMonth(month, 1))?.amount ?? 0),
      invoiceStatusLabel: card.invoices.find((invoice) => invoice.month === month)?.status === "PAID" ? "Paga" : "Aberta ou não lançada",
      installmentsCount: card.installments.filter((item) => { const current = monthsBetween(item.startMonth, month) + 1; return current >= 1 && current <= item.installmentCount; }).length,
    };
  }) ?? null;
  const installments = plans?.flatMap((item) => {
    const current = monthsBetween(item.startMonth, month) + 1;
    return current >= 1 && current <= item.installmentCount ? [{ id: item.id, description: item.description,
      current, count: item.installmentCount, monthlyAmount: Number(item.installmentAmount), cardName: item.card?.name ?? null }] : [];
  }) ?? null;
  return <CardsScreen cards={cards} installments={installments} month={month} />;
}
