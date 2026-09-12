import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
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
    <Card className="h-full w-full min-w-0 flex flex-col justify-between rounded-md border">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg font-bold">Gastos por Categoria</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-6 pt-0">
        <ScrollArea className="max-h-[300px] lg:max-h-[350px] pr-2">
          {expensesPerCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma despesa registrada neste mês.
            </p>
          ) : (
            <div className="space-y-4">
              {expensesPerCategory.map((category) => (
                <div key={category.category} className="space-y-1.5 sm:space-y-2">
                  <div className="flex w-full justify-between gap-2">
                    <p className="text-sm font-bold truncate">
                      {TRANSACTION_CATEGORY_LABELS[category.category]}
                    </p>
                    <p className="text-sm font-bold shrink-0">{category.percentageOfTotal}%</p>
                  </div>
                  <Progress value={category.percentageOfTotal} />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
export default ExpensesPerCategory;
