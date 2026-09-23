import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/app/_components/navbar";
import { canUserAddTransaction } from "@/app/_data/get-dashboard/get-current-month-transactions/can-user-add-transactions";
import { getYearMonthRangeUtc, resolveYearMonth } from "@/app/_lib/month-range";
import { db } from "@/app/_lib/prisma";
import TransactionsScreen from "./_components/transactions-screen";
import TransactionsHeader from "./_components/transactions-header";
import CommitmentsManager from "@/app/_components/commitments-manager";
import { getCommitmentsForMonth } from "@/app/_actions/dashboard-v2";
import { toTransactionRow } from "./_lib/transaction-row";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ month?: string | string[]; view?: string | string[] }> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  const view = params.view === "commitments" ? "commitments" : "transactions";
  if (params.month !== month) redirect(`/transactions?month=${month}${view === "commitments" ? "&view=commitments" : ""}`);

  if (view === "commitments") {
    const data = await getCommitmentsForMonth(month);
    return <><Navbar /><main className="mx-auto w-full max-w-[1680px] min-w-0 space-y-4 px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
      <TransactionsHeader month={month} view={view} />
      <section aria-label="Gerenciar compromissos" className="min-w-0 rounded-xl border border-border bg-[#141816] p-4 sm:p-5">
        <CommitmentsManager key={month} month={month} initialData={data} />
      </section>
    </main></>;
  }

  const [transactions, canAdd] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: getYearMonthRangeUtc(month) },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true, type: true, category: true, paymentMethod: true, source: true, amount: true, date: true },
    }),
    canUserAddTransaction(),
  ]);

  return <><Navbar /><main className="mx-auto w-full max-w-[1680px] min-w-0 space-y-4 px-4 py-5 sm:px-6 sm:py-6 xl:px-8"><TransactionsHeader month={month} view={view} /><TransactionsScreen key={month} month={month} rows={transactions.map(toTransactionRow)} canAdd={canAdd} /></main></>;
}
