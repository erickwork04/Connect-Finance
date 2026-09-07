import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import SummaryCards from "./_componets/summary-cards";
import TimeSelect from "./_componets/time-select";
import { isMatch } from "date-fns";
import TransactionsPieChart from "./_componets/transactions-pie-chart";
import { getDashboard } from "../_data/get-dashboard";
import ExpensesPerCategory from "./_componets/expenses-per-category";
import LastTransactions from "./_componets/last-transactions";
import { canUserAddTransaction } from "../_data/get-dashboard/get-current-month-transactions/can-user-add-transactions";
import AiReportButton from "./_componets/ai-report-button";
import { auth } from "@clerk/nextjs/server";

interface HomeProps {
  searchParams: {
    month?: string;
  };
}

const Home = async ({ searchParams: { month } }: HomeProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  const selectedMonth = !month || !isMatch(month, "MM") ? currentMonth : month;
  const dashboard = await getDashboard(selectedMonth);
  const userCanAddTransaction = await canUserAddTransaction();
  return (
    <>
      <Navbar />
      <div className="flex flex-col space-y-3 sm:space-y-6 p-3.5 sm:p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <AiReportButton month={selectedMonth} />
            <TimeSelect />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4 sm:gap-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <SummaryCards
              month={selectedMonth}
              {...dashboard}
              userCanAddTransaction={userCanAddTransaction}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <TransactionsPieChart {...dashboard} />
              <ExpensesPerCategory
                expensesPerCategory={dashboard.totalExpensePerCategory}
              />
            </div>
          </div>
          <div className="w-full">
            <LastTransactions lastTransactions={dashboard.lastTransactions} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
