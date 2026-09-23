import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/app/_components/navbar";
import { resolveYearMonth } from "@/app/_lib/month-range";
import { canUserAddTransaction } from "@/app/_data/get-dashboard/get-current-month-transactions/can-user-add-transactions";
import { getDashboard, type CategoryPeriod } from "@/app/_data/get-dashboard";
import CategoryExpensesCard from "./_componets/category-expenses-card";
import { AiInsightCard, BalanceCard, CreditCardSummary, FinancialMetricCard, InstallmentsCard, LatestTransactionsCard, MonthlyCommitmentsCard } from "./_componets/dashboard-v2-cards";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string | string[]; categoryPeriod?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  if (params.month !== month) redirect(`/dashboard?month=${month}`);
  const categoryPeriod: CategoryPeriod = params.categoryPeriod === "three" || params.categoryPeriod === "six" || params.categoryPeriod === "year" ? params.categoryPeriod : "month";
  const [data, canAdd, client] = await Promise.all([getDashboard(month, categoryPeriod), canUserAddTransaction(), clerkClient()]);
  const user = await client.users.getUser(userId);
  const premium = user.publicMetadata?.subscriptionPlan === "premium";

  return <><Navbar /><main className="mx-auto w-full max-w-[1680px] min-w-0 space-y-4 px-4 py-5 sm:px-6 sm:py-6 lg:space-y-5 xl:px-8">
    <h1 className="sr-only">Resumo financeiro do mês</h1>
    <section aria-label="Valores realizados no mês" className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
      <div className="min-w-0 lg:col-span-3"><FinancialMetricCard data={data} metric="revenue" /></div>
      <div className="min-w-0 lg:col-span-3"><FinancialMetricCard data={data} metric="expenses" /></div>
      <div className="min-w-0 sm:col-span-2 lg:col-span-6"><BalanceCard data={data} canAdd={canAdd} /></div>
    </section>
    <div className="flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
      <div className="contents min-w-0 lg:block lg:space-y-5">
        <div className="order-1 min-w-0 lg:order-none"><FinancialMetricCard data={data} metric="invested" /></div>
        <div className="order-3 min-w-0 lg:order-none"><LatestTransactionsCard data={data} /></div>
        <div className="order-5 min-w-0 lg:order-none"><CategoryExpensesCard data={data} period={categoryPeriod} /></div>
        <div className="order-7 min-w-0 lg:order-none"><CreditCardSummary data={data} /></div>
      </div>
      <div className="contents min-w-0 lg:block lg:space-y-5">
        <div className="order-4 min-w-0 lg:order-none"><AiInsightCard data={data} premium={premium} /></div>
        <div className="order-2 min-w-0 lg:order-none"><InstallmentsCard data={data} /></div>
        <div className="order-6 min-w-0 lg:order-none"><MonthlyCommitmentsCard data={data} /></div>
      </div>
    </div>
  </main></>;
}
