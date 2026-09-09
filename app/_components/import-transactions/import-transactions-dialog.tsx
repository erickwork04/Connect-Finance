"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  ImportMode,
  ParsedTransaction,
  ProcessFileResult,
} from "@/app/_lib/import/types";
import { TRANSACTION_CATEGORY_OPTIONS } from "@/app/_constanst/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import { processImportFile } from "@/app/_actions/import-transactions/process-file";
import { confirmImportTransactions } from "@/app/_actions/import-transactions/confirm-import";
import { DuplicateComparisonDialog } from "./duplicate-comparison-dialog";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CreditCard,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Check,
  ArrowLeft,
  Sparkles,
  Layers,
} from "lucide-react";
import { TransactionCategory } from "@prisma/client";

interface ImportTransactionsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mode: ImportMode;
}

type Step = "UPLOAD" | "PROCESSING" | "PREVIEW" | "SUCCESS";

export function ImportTransactionsDialog({
  isOpen,
  setIsOpen,
  mode,
}: ImportTransactionsDialogProps) {
  const [step, setStep] = useState<Step>("UPLOAD");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "NEW" | "POSSIBLE_DUPLICATE" | "ALREADY_IMPORTED"
  >("ALL");

  const [comparisonTransaction, setComparisonTransaction] =
    useState<ParsedTransaction | null>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  const [importSummary, setImportSummary] = useState<{
    imported: number;
    ignored: number;
    alreadyExisted: number;
  } | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBank = mode === "BANK_STATEMENT";
  const title = isBank
    ? "Importar Extrato Bancário"
    : "Importar Fatura do Cartão";
  const acceptedFormats = isBank ? ".ofx, .csv" : ".csv";

  // Reset dialog state on close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep("UPLOAD");
      setSelectedFile(null);
      setTransactions([]);
      setImportSummary(null);
      setActiveFilter("ALL");
      setBatchId(null);
    }
    setIsOpen(open);
  };

  // Handle file drop/selection
  const handleFileChange = async (file: File) => {
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo excede o tamanho máximo permitido de 5MB.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const validExts = isBank ? ["ofx", "csv", "txt"] : ["csv", "txt"];
    if (!ext || !validExts.includes(ext)) {
      toast.error(
        `Formato inválido. Por favor envie um arquivo ${isBank ? "OFX ou CSV" : "CSV"}.`,
      );
      return;
    }

    setSelectedFile(file);
    setStep("PROCESSING");

    // Read file text
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      startTransition(async () => {
        try {
          const result: ProcessFileResult = await processImportFile(
            content,
            file.name,
            mode,
          );

          if (!result.success) {
            toast.error(result.errorMessage || "Erro ao processar arquivo.");
            setStep("UPLOAD");
            return;
          }

          setTransactions(result.transactions);
          setBatchId(result.importBatchId || null);
          setStep("PREVIEW");
          toast.success("Extrato processado com sucesso.");
        } catch (error) {
          console.error("Error processing file:", error);
          toast.error("Ocorreu um erro ao processar o arquivo.");
          setStep("UPLOAD");
        }
      });
    };

    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo no navegador.");
      setStep("UPLOAD");
    };

    reader.readAsText(file, "UTF-8");
  };

  // Toggle single item selection
  const handleToggleSelect = (tempId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.tempId === tempId ? { ...t, selected: !t.selected } : t)),
    );
  };

  // Decision on duplicate comparison modal
  const handleDuplicateDecision = (tempId: string, importAnyway: boolean) => {
    setTransactions((prev) =>
      prev.map((t) => (t.tempId === tempId ? { ...t, selected: importAnyway } : t)),
    );
    if (importAnyway) {
      toast.info("Transação marcada para importação.");
    } else {
      toast.info("Transação desmarcada (ignorada).");
    }
  };

  // Change category of an item
  const handleCategoryChange = (
    tempId: string,
    category: TransactionCategory,
  ) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.tempId === tempId ? { ...t, selectedCategory: category } : t,
      ),
    );
  };

  // Selection counts
  const totalFound = transactions.length;
  const newCount = transactions.filter(
    (t) => t.duplicateStatus === "NEW",
  ).length;
  const possibleDuplicateCount = transactions.filter(
    (t) => t.duplicateStatus === "POSSIBLE_DUPLICATE",
  ).length;
  const alreadyImportedCount = transactions.filter(
    (t) => t.duplicateStatus === "ALREADY_IMPORTED",
  ).length;

  const selectedCount = transactions.filter((t) => t.selected).length;

  // Filtered list
  const filteredTransactions = useMemo(() => {
    if (activeFilter === "ALL") return transactions;
    return transactions.filter((t) => t.duplicateStatus === activeFilter);
  }, [transactions, activeFilter]);

  // Master selection toggle for visible list
  const allVisibleSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((t) => t.selected);

  const handleToggleSelectAll = () => {
    const nextState = !allVisibleSelected;
    const visibleIds = new Set(filteredTransactions.map((t) => t.tempId));
    setTransactions((prev) =>
      prev.map((t) =>
        visibleIds.has(t.tempId) ? { ...t, selected: nextState } : t,
      ),
    );
  };

  // Finalize import action
  const handleConfirmImport = () => {
    const toImport = transactions.filter((t) => t.selected);
    if (toImport.length === 0) {
      toast.warning("Selecione pelo menos uma transação para importar.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await confirmImportTransactions(
          toImport,
          transactions.length,
          batchId || undefined,
          selectedFile?.name,
          toImport[0]?.source,
        );
        if (!result.success) {
          toast.error(result.errorMessage || "Erro ao salvar transações.");
          return;
        }

        setImportSummary({
          imported: result.importedCount,
          ignored: result.ignoredCount,
          alreadyExisted: result.alreadyExistedCount,
        });
        setStep("SUCCESS");
        toast.success(`${result.importedCount} transações importadas com sucesso!`);
      } catch (err) {
        console.error("Error importing transactions:", err);
        toast.error("Erro inesperado ao importar transações.");
      }
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={`bg-background border-border text-foreground transition-all duration-200 ${
            step === "PREVIEW"
              ? "max-w-4xl w-[96vw] sm:w-[92vw] h-[90vh] max-h-[90vh] flex flex-col p-4 sm:p-6"
              : "max-w-lg w-[95vw] p-5 sm:p-6"
          }`}
        >
          {/* STEP 1: UPLOAD */}
          {step === "UPLOAD" && (
            <>
              <DialogHeader className="space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    {isBank ? (
                      <Building2 className="h-5 w-5" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-xl font-bold">
                      {title}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                      {isBank
                        ? "Importe suas movimentações bancárias para controle instantâneo."
                        : "Importe os lançamentos da sua fatura para categorizar despesas."}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50 bg-muted/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedFormats}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
                  <Upload className="h-6 w-6 text-primary" />
                </div>

                <p className="text-sm font-semibold text-foreground">
                  Arraste e solte o arquivo aqui, ou
                </p>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-6"
                >
                  Selecionar arquivo
                </Button>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Formatos aceitos:</span>
                  {isBank ? (
                    <div className="flex gap-1">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">
                        .OFX
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">
                        .CSV
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">
                        .CSV
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        (XLSX e PDF em breve)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informative tips */}
              <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Anti-duplicação inteligente
                </div>
                <p>
                  O arquivo será analisado antes de salvar. Transações
                  duplicadas ou já existentes serão identificadas para você
                  revisar com tranquilidade.
                </p>
              </div>

              <DialogFooter className="mt-4 flex flex-row justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="rounded-full text-xs sm:text-sm font-semibold h-9 sm:h-10"
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}

          {/* STEP 2: PROCESSING */}
          {step === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <FileSpreadsheet className="absolute inset-0 m-auto h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold">
                  Processando extrato...
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                  Lendo movimentações, normalizando datas, sugerindo categorias e
                  verificando duplicidades no seu histórico.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW SCREEN */}
          {step === "PREVIEW" && (
            <div className="flex flex-col h-full min-h-0">
              {/* Header & Counters */}
              <div className="space-y-3 pb-3 border-b border-border shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                      <span>Pré-visualização da Importação</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        ({selectedFile?.name})
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Revise as transações, ajuste as categorias sugeridas e
                      escolha quais deseja importar.
                    </DialogDescription>
                  </div>

                  {/* Top Badges / Counters */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-foreground border border-border">
                      {totalFound} encontradas
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {newCount} novas
                    </span>
                    {possibleDuplicateCount > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {possibleDuplicateCount} possíveis duplicadas
                      </span>
                    )}
                    {alreadyImportedCount > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        {alreadyImportedCount} já importadas
                      </span>
                    )}
                  </div>
                </div>

                {/* Filter and Selection Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilter("ALL")}
                      className={`h-7 px-2.5 text-xs rounded-full ${
                        activeFilter === "ALL"
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Todas ({totalFound})
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilter("NEW")}
                      className={`h-7 px-2.5 text-xs rounded-full ${
                        activeFilter === "NEW"
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Novas ({newCount})
                    </Button>
                    {possibleDuplicateCount > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveFilter("POSSIBLE_DUPLICATE")}
                        className={`h-7 px-2.5 text-xs rounded-full ${
                          activeFilter === "POSSIBLE_DUPLICATE"
                            ? "bg-amber-500 text-black font-bold"
                            : "text-amber-400 hover:text-amber-300"
                        }`}
                      >
                        Duplicadas ({possibleDuplicateCount})
                      </Button>
                    )}
                    {alreadyImportedCount > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveFilter("ALREADY_IMPORTED")}
                        className={`h-7 px-2.5 text-xs rounded-full ${
                          activeFilter === "ALREADY_IMPORTED"
                            ? "bg-muted text-foreground font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Já importadas ({alreadyImportedCount})
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={handleToggleSelectAll}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>
                        {allVisibleSelected
                          ? "Desmarcar visíveis"
                          : "Marcar todas visíveis"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions List: Responsive (Table on Desktop, Cards on Mobile) */}
              <div className="flex-1 min-h-0 overflow-y-auto my-2 pr-1">
                {filteredTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Layers className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">
                      Nenhuma transação encontrada para o filtro selecionado.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* DESKTOP TABLE VIEW (hidden on mobile) */}
                    <div className="hidden md:block">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground font-medium">
                            <th className="py-2 px-3 w-10 text-center">Sel.</th>
                            <th className="py-2 px-3 w-28">Data/Hora</th>
                            <th className="py-2 px-3">Descrição</th>
                            <th className="py-2 px-3 w-24">Tipo</th>
                            <th className="py-2 px-3 w-28 text-right">Valor</th>
                            <th className="py-2 px-3 w-40">Categoria Sugerida</th>
                            <th className="py-2 px-3 w-36 text-center">Situação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {filteredTransactions.map((t) => {
                            const dateObj = new Date(t.date);
                            const isExpense = t.type === "EXPENSE";

                            return (
                              <tr
                                key={t.tempId}
                                className={`transition-colors hover:bg-muted/30 ${
                                  t.selected ? "bg-muted/10" : "opacity-60"
                                }`}
                              >
                                <td className="py-2.5 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={t.selected}
                                    onChange={() => handleToggleSelect(t.tempId)}
                                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                                  {dateObj.toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                  })}
                                  {t.time && (
                                    <span className="text-muted-foreground block text-[11px]">
                                      {t.time}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <p className="font-semibold text-foreground truncate max-w-[220px]">
                                    {t.name}
                                  </p>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                      isExpense
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-emerald-500/10 text-emerald-400"
                                    }`}
                                  >
                                    {isExpense ? "Despesa" : "Receita"}
                                  </span>
                                </td>
                                <td
                                  className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                                    isExpense
                                      ? "text-red-400"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {isExpense ? "-" : "+"}
                                  {formatCurrency(t.amount)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <Select
                                    value={t.selectedCategory}
                                    onValueChange={(val) =>
                                      handleCategoryChange(
                                        t.tempId,
                                        val as TransactionCategory,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-background/50 border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                      {TRANSACTION_CATEGORY_OPTIONS.map(
                                        (opt) => (
                                          <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                            className="text-xs"
                                          >
                                            {opt.label}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {t.duplicateStatus === "NEW" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      <Check className="h-3 w-3" />
                                      Nova
                                    </span>
                                  )}

                                  {t.duplicateStatus === "POSSIBLE_DUPLICATE" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setComparisonTransaction(t);
                                        setComparisonModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                    >
                                      <AlertTriangle className="h-3 w-3 shrink-0" />
                                      Possível duplicada
                                    </button>
                                  )}

                                  {t.duplicateStatus === "ALREADY_IMPORTED" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setComparisonTransaction(t);
                                        setComparisonModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 hover:bg-slate-500/25 transition-colors cursor-pointer"
                                    >
                                      Já importada
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARD VIEW (visible on mobile, hidden on md+) */}
                    <div className="md:hidden space-y-2.5">
                      {filteredTransactions.map((t) => {
                        const dateObj = new Date(t.date);
                        const isExpense = t.type === "EXPENSE";

                        return (
                          <div
                            key={t.tempId}
                            className={`rounded-lg border border-border p-3 space-y-2 transition-all ${
                              t.selected
                                ? "bg-muted/30 border-border"
                                : "bg-muted/10 opacity-70"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={t.selected}
                                  onChange={() => handleToggleSelect(t.tempId)}
                                  className="rounded border-border text-primary focus:ring-primary h-5 w-5 min-h-[20px] min-w-[20px] cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-foreground truncate">
                                    {t.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {dateObj.toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                    {t.time && ` às ${t.time}`}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p
                                  className={`font-bold text-sm ${
                                    isExpense
                                      ? "text-red-400"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {isExpense ? "-" : "+"}
                                  {formatCurrency(t.amount)}
                                </p>
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                                  {isExpense ? "Despesa" : "Receita"}
                                </span>
                              </div>
                            </div>

                            {/* Mobile Controls & Status */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                              <div className="flex-1 min-w-0">
                                <Select
                                  value={t.selectedCategory}
                                  onValueChange={(val) =>
                                    handleCategoryChange(
                                      t.tempId,
                                      val as TransactionCategory,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs bg-background/80 border-border">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover border-border">
                                    {TRANSACTION_CATEGORY_OPTIONS.map(
                                      (opt) => (
                                        <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                          className="text-xs"
                                        >
                                          {opt.label}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="shrink-0">
                                {t.duplicateStatus === "NEW" && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Check className="h-3 w-3" />
                                    Nova
                                  </span>
                                )}

                                {t.duplicateStatus === "POSSIBLE_DUPLICATE" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setComparisonTransaction(t);
                                      setComparisonModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    Ver duplicada
                                  </button>
                                )}

                                {t.duplicateStatus === "ALREADY_IMPORTED" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setComparisonTransaction(t);
                                      setComparisonModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30"
                                  >
                                    Já importada
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Preview Footer */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                  <span>
                    <strong>{selectedCount}</strong> de {totalFound} selecionadas
                    para importar.
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("UPLOAD");
                      setTransactions([]);
                    }}
                    className="flex-1 sm:flex-initial h-10 rounded-full text-xs sm:text-sm font-semibold border-border"
                    disabled={isPending}
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Voltar
                  </Button>

                  <Button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={selectedCount === 0 || isPending}
                    className="flex-1 sm:flex-initial h-10 rounded-full font-bold text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 min-w-[160px]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      `Importar selecionadas (${selectedCount})`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS FEEDBACK */}
          {step === "SUCCESS" && importSummary && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Extrato processado com sucesso!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Suas transações foram salvas e já estão refletidas nos seus
                  relatórios e dashboard.
                </p>
              </div>

              {/* Summary Stats Box */}
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-background/50 p-4 text-center">
                <div className="space-y-0.5">
                  <span className="text-xl sm:text-2xl font-bold text-emerald-400">
                    {importSummary.imported}
                  </span>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                    Importadas
                  </p>
                </div>
                <div className="space-y-0.5 border-x border-border">
                  <span className="text-xl sm:text-2xl font-bold text-amber-400">
                    {importSummary.ignored}
                  </span>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                    Ignoradas
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xl sm:text-2xl font-bold text-slate-400">
                    {importSummary.alreadyExisted}
                  </span>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                    Já existiam
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="w-full sm:w-auto h-10 px-8 rounded-full font-bold text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Concluir e ver dashboard
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicate Comparison Popover / Dialog */}
      <DuplicateComparisonDialog
        transaction={comparisonTransaction}
        isOpen={comparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        onDecision={handleDuplicateDecision}
      />
    </>
  );
}
