import { db } from "../_lib/prisma";
import { DataTable } from "../_components/ui/data-table";
import { transactionColumns } from "./_columns";
import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { canUserAddTransaction } from "../_data/get-dashboard/get-current-month-transactions/can-user-add-transactions";
import { auth } from "@clerk/nextjs/server";
import { toTransactionRow } from "./_lib/transaction-row";
import PageHeader from "../_components/page-header";
import { getYearMonthRangeUtc, resolveYearMonth } from "../_lib/month-range";

const TransitionsPage = async ({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) => {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const month = resolveYearMonth(params.month);
  if (params.month !== month) redirect(`/transactions?month=${month}`);
  // acessar as transações do meu banco de dados
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: getYearMonthRangeUtc(month),
    },
    orderBy: {
      date: "desc",
    },
  });
  const userCanAddTransaction = await canUserAddTransaction();

  return (
    <>
      <Navbar />
      <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-[1680px] mx-auto w-full">
        <PageHeader title={`Transações · ${month.slice(5)}/${month.slice(0, 4)}`} actions={
          <div className="w-full sm:w-auto">
            <AddTransactionButton userCanAddTransaction={userCanAddTransaction} />
          </div>
        } />
        <div className="w-full min-w-0 overflow-x-auto rounded-md">
          <DataTable
            columns={transactionColumns}
            data={transactions.map(toTransactionRow)}
          />
        </div>
      </div>
    </>
  );
};

export default TransitionsPage;
