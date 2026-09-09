"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { ParsedTransaction } from "@/app/_lib/import/types";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_constanst/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import { AlertTriangle, Check, X } from "lucide-react";

interface DuplicateComparisonDialogProps {
  transaction: ParsedTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onDecision: (tempId: string, importAnyway: boolean) => void;
}

export function DuplicateComparisonDialog({
  transaction,
  isOpen,
  onClose,
  onDecision,
}: DuplicateComparisonDialogProps) {
  if (!transaction) return null;

  const existing = transaction.existingMatch;
  const candidateDate = new Date(transaction.date);
  const existingDate = existing ? new Date(existing.date) : null;

  const isLevel1 = transaction.duplicateStatus === "ALREADY_IMPORTED";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] p-4 sm:p-6 bg-background border-border">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
              {isLevel1
                ? "Transação Já Importada no Sistema"
                : "Possível Transação Duplicada"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {transaction.duplicateReason ||
              "Foi identificada uma correspondência similar no seu histórico financeiro."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 my-2 sm:my-3">
          {/* Bloco 1: Transação Existente no Banco */}
          <div className="rounded-lg border border-border bg-background/50 p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Transação Existente
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                No Sistema
              </span>
            </div>

            {existing ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Descrição
                  </span>
                  <p className="font-semibold text-foreground truncate">
                    {existing.name}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Valor
                    </span>
                    <p className="font-bold text-foreground">
                      {formatCurrency(existing.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">
                      Data e Hora
                    </span>
                    <p className="font-medium text-foreground text-xs sm:text-sm">
                      {existingDate?.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      {" "}
                      <span className="text-muted-foreground">
                        {existingDate?.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60 text-xs">
                  <div>
                    <span className="text-muted-foreground">Categoria: </span>
                    <span className="font-medium text-foreground">
                      {TRANSACTION_CATEGORY_LABELS[existing.category] ||
                        existing.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Forma: </span>
                    <span className="font-medium text-foreground">
                      {TRANSACTION_PAYMENT_METHOD_LABELS[
                        existing.paymentMethod
                      ] || existing.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-4">
                Identificador já registrado anteriormente em importações
                passadas.
              </p>
            )}
          </div>

          {/* Bloco 2: Transação do Extrato / Fatura */}
          <div className="rounded-lg border border-primary/40 bg-primary/[0.03] p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Transação do Extrato
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
                Arquivo Novo
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Descrição
                </span>
                <p className="font-semibold text-foreground truncate">
                  {transaction.name}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Valor
                  </span>
                  <p className="font-bold text-foreground">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">
                    Data e Hora
                  </span>
                  <p className="font-medium text-foreground text-xs sm:text-sm">
                    {candidateDate.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    {transaction.time && (
                      <span className="text-muted-foreground">
                        {" "}
                        às {transaction.time}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground">Categoria: </span>
                  <span className="font-medium text-foreground">
                    {TRANSACTION_CATEGORY_LABELS[
                      transaction.selectedCategory
                    ] || transaction.selectedCategory}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Origem: </span>
                  <span className="font-medium text-foreground">
                    {transaction.source}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
          💡 <strong>Dica:</strong> Se for a mesma despesa ou compra cadastrada
          duas vezes, escolha <strong>Ignorar</strong> para não duplicar seu
          saldo. Se forem compras distintas com valores coincidentes, você pode{" "}
          <strong>Importar mesmo assim</strong>.
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onDecision(transaction.tempId, false);
              onClose();
            }}
            className="w-full sm:w-auto h-10 text-xs sm:text-sm font-semibold border-border text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1.5 h-4 w-4" />
            Ignorar (Não importar)
          </Button>

          <Button
            type="button"
            onClick={() => {
              onDecision(transaction.tempId, true);
              onClose();
            }}
            className="w-full sm:w-auto h-10 text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Check className="mr-1.5 h-4 w-4" />
            Importar mesmo assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
