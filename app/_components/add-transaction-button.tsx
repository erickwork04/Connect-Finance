"use client";

import {
  ArrowDownUpIcon,
  ChevronDown,
  PlusCircle,
  Building2,
  CreditCard,
} from "lucide-react";
import { Button } from "./ui/button";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveYearMonth } from "@/app/_lib/month-range";
import UpsertTransactionDialog from "./upsert-transaction-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ImportTransactionsDialog } from "./import-transactions/import-transactions-dialog";
import { ImportMode } from "@/app/_lib/import/types";

interface AddTransactionButtonProps {
  userCanAddTransaction?: boolean;
}

const AddTransactionButton = ({
  userCanAddTransaction = true,
}: AddTransactionButtonProps) => {
  const [upsertIsOpen, setUpsertIsOpen] = useState(false);
  const [importIsOpen, setImportIsOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("BANK_STATEMENT");
  const selectedMonth = resolveYearMonth(useSearchParams().get("month"));
  const initialDate = useMemo(() => {
    if (selectedMonth === resolveYearMonth(undefined)) return new Date();
    return new Date(`${selectedMonth}-01T12:00:00.000Z`);
  }, [selectedMonth]);

  const handleOpenManual = () => {
    setUpsertIsOpen(true);
  };

  const handleOpenBankStatement = () => {
    setImportMode("BANK_STATEMENT");
    setImportIsOpen(true);
  };

  const handleOpenCardInvoice = () => {
    setImportMode("CARD_INVOICE");
    setImportIsOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!userCanAddTransaction}>
                  <Button
                    id="add-transaction-dropdown-trigger"
                    className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0 rounded-full font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-sm"
                    disabled={!userCanAddTransaction}
                  >
                    <ArrowDownUpIcon className="h-4 w-4" />
                    <span>Adicionar transação</span>
                    <ChevronDown className="h-4 w-4 opacity-75 ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-popover border-border p-1.5 shadow-xl"
                >
                  <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Cadastrar ou Importar
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    id="action-add-manual"
                    onClick={handleOpenManual}
                    className="flex items-center gap-2.5 py-2.5 px-2.5 cursor-pointer rounded-md hover:bg-accent focus:bg-accent text-xs sm:text-sm font-medium"
                  >
                    <PlusCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>Adicionar manualmente</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/60 my-1" />

                  <DropdownMenuItem
                    id="action-import-bank-statement"
                    onClick={handleOpenBankStatement}
                    className="flex items-center gap-2.5 py-2.5 px-2.5 cursor-pointer rounded-md hover:bg-accent focus:bg-accent text-xs sm:text-sm font-medium"
                  >
                    <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div className="flex flex-col">
                      <span>Importar extrato bancário</span>
                      <span className="text-[10px] text-muted-foreground">
                        OFX ou CSV
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    id="action-import-card-invoice"
                    onClick={handleOpenCardInvoice}
                    className="flex items-center gap-2.5 py-2.5 px-2.5 cursor-pointer rounded-md hover:bg-accent focus:bg-accent text-xs sm:text-sm font-medium"
                  >
                    <CreditCard className="h-4 w-4 text-blue-400 shrink-0" />
                    <div className="flex flex-col">
                      <span>Importar fatura do cartão</span>
                      <span className="text-[10px] text-muted-foreground">
                        CSV
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          {!userCanAddTransaction && (
            <TooltipContent>
              Você atingiu o limite de transações. Faça parte do Premium e tenha
              transações ilimitadas.
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {/* Modal 1: Adicionar manualmente (fluxo existente preservado) */}
      <UpsertTransactionDialog
        IsOpen={upsertIsOpen}
        setIsOpen={setUpsertIsOpen}
        initialDate={initialDate}
      />

      {/* Modal 2: Importar extrato bancário ou fatura */}
      <ImportTransactionsDialog
        isOpen={importIsOpen}
        setIsOpen={setImportIsOpen}
        mode={importMode}
      />
    </>
  );
};

export default AddTransactionButton;

