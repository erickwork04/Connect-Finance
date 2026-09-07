import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constanst/transactions";
import { TotalExpensePerCategory } from "@/app/_data/get-dashboard/types";

interface ExpensesPerCategoryProps {
  expensesPerCategory: TotalExpensePerCategory[];
}

const ExpensesPerCategory = ({
  expensesPerCategory,
}: ExpensesPerCategoryProps) => {
  return (
    <ScrollArea className="col-span-1 lg:col-span-2 h-full rounded-md border pb-4 sm:pb-6">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg font-bold">Gastos por Categoria</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
        {expensesPerCategory.map((category) => (
          <div key={category.category} className="space-y-1.5 sm:space-y-2">
            <div className="flex w-full justify-between">
              <p className="text-sm font-bold">
                {TRANSACTION_CATEGORY_LABELS[category.category]}
              </p>
              <p className="text-sm font-bold">{category.percentageOfTotal}%</p>
            </div>
            <Progress value={category.percentageOfTotal} />
          </div>
        ))}
      </CardContent>
    </ScrollArea>
  );
};
export default ExpensesPerCategory;
