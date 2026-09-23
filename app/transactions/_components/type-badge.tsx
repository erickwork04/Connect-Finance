import { TransactionType } from "@prisma/client";

interface TransactionTypeBadgeProps {
  type: TransactionType;
}

const TransactionTypeBadge = ({ type }: TransactionTypeBadgeProps) => {
  const tone = type === TransactionType.DEPOSIT ? "bg-emerald-400/10 text-emerald-300" :
    type === TransactionType.EXPENSE ? "bg-rose-400/10 text-rose-300" : "bg-sky-400/10 text-sky-300";
  const label = type === TransactionType.DEPOSIT ? "Receita" : type === TransactionType.EXPENSE ? "Despesa" : "Investimento";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium ${tone}`}>{label}</span>;
};
export default TransactionTypeBadge;
