import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/app/_components/navbar";
import PageHeader from "@/app/_components/page-header";
import { resolveYearMonth } from "@/app/_lib/month-range";
import { canUserAddTransaction } from "@/app/_data/get-dashboard/get-current-month-transactions/can-user-add-transactions";
import { getDashboard, type CategoryPeriod } from "@/app/_data/get-dashboard";
import CategoryExpensesCard from "./_componets/category-expenses-card";
import { AiInsightCard, BalanceCard, CreditCardSummary, InstallmentsCard, LatestTransactionsCard, Metrics, MonthlyCommitmentsCard } from "./_componets/dashboard-v2-cards";

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

  return <><Navbar /><main className="mx-auto w-full max-w-[1680px] min-w-0 space-y-4 px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
    <PageHeader title="Dashboard" />
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-5">
      <div className="order-1 min-w-0 space-y-4 lg:col-span-5"><BalanceCard data={data} canAdd={canAdd} /><Metrics data={data} /></div>
      <div className="order-3 min-w-0 lg:order-2 lg:col-span-4"><LatestTransactionsCard data={data} /></div>
      <div className="order-2 min-w-0 lg:order-3 lg:col-span-3"><AiInsightCard data={data} premium={premium} /></div>
    </div>
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
      <CategoryExpensesCard data={data} period={categoryPeriod} />
      <InstallmentsCard data={data} />
      <CreditCardSummary data={data} />
      <MonthlyCommitmentsCard data={data} />
    </div>
  </main></>;
}
