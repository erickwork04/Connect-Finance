import AddTransactionButton from "@/app/_components/add-transaction-button";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { ReactNode } from "react";

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
  userCanAddTransaction?: boolean;
}

const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
  userCanAddTransaction,
}: SummaryCardProps) => {
  return (
    <Card className={size === "large" ? "bg-white bg-opacity-5" : ""}>
      <CardHeader className="flex-row items-center gap-2 sm:gap-4 p-4 sm:p-6 pb-2 sm:pb-3">
        {icon}
        <p
          className={`text-xs sm:text-sm ${size === "small" ? "text-muted-foreground" : "text-white opacity-70"}`}
        >
          {title}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-4 sm:p-6 pt-0">
        <p
          className={`font-bold tracking-tight ${size === "small" ? "text-xl sm:text-2xl" : "text-2xl sm:text-4xl"}`}
        >
          {Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)}
        </p>

        {size === "large" && (
          <div className="w-full sm:w-auto mt-1 sm:mt-0">
            <AddTransactionButton userCanAddTransaction={userCanAddTransaction} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
