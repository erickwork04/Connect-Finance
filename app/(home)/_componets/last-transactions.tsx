import { Button } from "@/app/_components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { TRANSACTION_PAYMENT_METHOD_ICONS } from "@/app/_constanst/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import { Transaction, TransactionType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

interface LastTransactionsProps {
  lastTransactions: Transaction[];
}

const LastTransactions = ({ lastTransactions }: LastTransactionsProps) => {
  const getAmountColor = (transaction: Transaction) => {
    if (transaction.type === TransactionType.EXPENSE) {
      return "text-red-500";
    }
    if (transaction.type === TransactionType.DEPOSIT) {
      return "text-primary";
    }
    return "text-white";
  };
  const getAmountPrefix = (transaction: Transaction) => {
    if (transaction.type === TransactionType.DEPOSIT) {
      return "+";
    }
    return "-";
  };
  return (
    <div className="rounded-md border bg-card text-card-foreground flex flex-col h-full w-full min-w-0">
      <CardHeader className="flex-row items-center justify-between p-4 sm:p-6 pb-3">
        <CardTitle className="text-base sm:text-lg font-bold">Últimas Transações</CardTitle>
        <Button variant="outline" className="h-9 sm:h-10 text-xs sm:text-sm rounded-full font-bold px-3 sm:px-4 shrink-0" asChild>
          <Link href="/transactions">Ver mais</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <ScrollArea className="max-h-[420px] lg:max-h-[500px] pr-2">
          {lastTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma transação recente encontrada.
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {lastTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="rounded-lg bg-white bg-opacity-[3%] p-2 sm:p-2.5 text-white shrink-0">
                      <Image
                        src={`/${TRANSACTION_PAYMENT_METHOD_ICONS[transaction.paymentMethod]}`}
                        height={20}
                        width={20}
                        alt={transaction.paymentMethod}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{transaction.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold shrink-0 text-right ${getAmountColor(transaction)}`}>
                    {getAmountPrefix(transaction)}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </div>
  );
};

export default LastTransactions;
