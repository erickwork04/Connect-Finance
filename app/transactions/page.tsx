import { db } from "../_lib/prisma";
import { DataTable } from "../_components/ui/data-table";
import { transactionColumns } from "./_columns";
import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { ScrollArea } from "../_components/ui/scroll-area";
import { canUserAddTransaction } from "../_data/get-dashboard/get-current-month-transactions/can-user-add-transactions";
import { getAuthUserId } from "../_lib/auth";

const TransitionsPage = async () => {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/login");
  }
  // acessar as transações do meu banco de dados
  const transactions = await db.transaction.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
  });
  const userCanAddTransaction = await canUserAddTransaction();

  return (
    <>
      <Navbar />
      <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/*Título e botão*/}
        <div className="flex flex-col sm:flex-row w-full sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">Transações</h1>
          <div className="w-full sm:w-auto">
            <AddTransactionButton userCanAddTransaction={userCanAddTransaction} />
          </div>
        </div>
        <ScrollArea className="h-full w-full overflow-x-auto">
          <DataTable
            columns={transactionColumns}
            data={JSON.parse(JSON.stringify(transactions))}
          />
        </ScrollArea>
      </div>
    </>
  );
};

export default TransitionsPage;
