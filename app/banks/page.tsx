import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/app/_components/navbar";
import PageHeader from "@/app/_components/page-header";
import FeatureEmptyState from "@/app/_components/feature-empty-state";
import { Building2 } from "lucide-react";
import { db } from "@/app/_lib/prisma";
import { resolveYearMonth } from "@/app/_lib/month-range";
import BanksScreen from "./_components/banks-screen";

export const dynamic = "force-dynamic";

export default async function BanksPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  if (params.month !== month) redirect(`/banks?month=${month}`);
  const accounts = await db.bankAccount.findMany({ where: { userId, isActive: true }, orderBy: { createdAt: "asc" } }).catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return null;
    throw error;
  });
  return <><Navbar /><main className="app-shell-content mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
    <PageHeader title="Bancos" />
    {accounts === null ? <FeatureEmptyState icon={<Building2 className="h-6 w-6" />} title="Cadastro de contas indisponível" description="A atualização do banco de dados ainda está pendente. Aplique a nova migração para habilitar o cadastro de contas." /> : <BanksScreen accounts={accounts.map((item) => ({ id: item.id, name: item.name, institution: item.institution, accountType: item.accountType, balance: Number(item.balance), color: item.color }))} />}
  </main></>;
}
