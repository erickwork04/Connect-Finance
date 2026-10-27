import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/app/_components/navbar";
import PageHeader from "@/app/_components/page-header";
import FeatureEmptyState from "@/app/_components/feature-empty-state";
import { Building2 } from "lucide-react";
import { db } from "@/app/_lib/prisma";
import { resolveYearMonth } from "@/app/_lib/month-range";
import BanksScreen from "./_components/banks-screen";
import { clampPage, parsePagination } from "@/app/_lib/pagination";

export const dynamic = "force-dynamic";

export default async function BanksPage({ searchParams }: { searchParams: Promise<{ month?: string | string[]; page?: string | string[]; pageSize?: string | string[] }> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  if (params.month !== month) redirect(`/banks?month=${month}`);
  const pagination = parsePagination(params.page, params.pageSize);
  const where = { userId, isActive: true };
  const total = await db.bankAccount.count({ where }).catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return null;
    throw error;
  });
  if (total === null) return <><Navbar /><main className="app-shell-content mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 sm:px-6 sm:py-6 xl:px-8"><PageHeader title="Bancos" /><FeatureEmptyState icon={<Building2 className="h-6 w-6" />} title="Cadastro de contas indisponível" description="A atualização do banco de dados ainda está pendente. Aplique a nova migração para habilitar o cadastro de contas." /></main></>;
  const page = clampPage(pagination.page, total, pagination.pageSize);
  if (page !== pagination.page || (typeof params.pageSize === "string" ? params.pageSize : undefined) !== String(pagination.pageSize)) redirect(`/banks?month=${month}&page=${page}&pageSize=${pagination.pageSize}`);
  const result = await Promise.all([
    db.bankAccount.findMany({ where, orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: (pagination.page - 1) * pagination.pageSize, take: pagination.pageSize, select: { id: true, name: true, institution: true, accountType: true, balance: true, color: true } }),
    db.bankAccount.aggregate({ where, _sum: { balance: true } }),
    db.bankAccount.findFirst({ where, orderBy: [{ balance: "desc" }, { id: "asc" }], select: { balance: true } }),
  ] as const).catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return null;
    throw error;
  });
  if (result === null) throw new Error("Não foi possível carregar as contas bancárias.");
  const [accounts, totals, largest] = result;
  return <><Navbar /><main className="app-shell-content mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
    <PageHeader title="Bancos" />
    <BanksScreen accounts={accounts.map((item) => ({ id: item.id, name: item.name, institution: item.institution, accountType: item.accountType, balance: Number(item.balance), color: item.color }))} page={page} pageSize={pagination.pageSize} total={total} totalBalance={Number(totals._sum.balance ?? 0)} largestBalance={Number(largest?.balance ?? 0)} />
  </main></>;
}
