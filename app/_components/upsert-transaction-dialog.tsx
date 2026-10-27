import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { MoneyInput } from "./money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  TRANSACTION_CATEGORY_OPTIONS,
  TRANSACTION_PAYMENT_METHOD_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from "../_constanst/transactions";
import { DatePicker } from "./ui/date-picker";
import { z } from "zod";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { upsertTransaction } from "../_actions/add-transaction";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UpsertTransactionDialogProps {
  IsOpen: boolean;
  defaultValues?: FormSchema;
  transactionId?: string;
  initialDate?: Date;
  setIsOpen: (IsOpen: boolean) => void;
}

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: " O nome é obrigatório.",
  }),
  amount: z
    .number({
      required_error: "O valor é obrigatório.",
    })
    .positive({
      message: "O valor deve ser positivo",
    }),
  type: z.nativeEnum(TransactionType, {
    required_error: "O tipo é obrigatório.",
  }),
  category: z.nativeEnum(TransactionCategory, {
    required_error: "A categoria é obrigatória.",
  }),
  paymentMethod: z.nativeEnum(TransactionPaymentMethod, {
    required_error: "O método de pagamento é obrigatório.",
  }),
  date: z.date({
    required_error: "A data é obrigatória",
  }),
});

type FormSchema = z.infer<typeof formSchema>;

const UpsertTransactionDialog = ({
  IsOpen,
  defaultValues,
  transactionId,
  initialDate,
  setIsOpen,
}: UpsertTransactionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      amount: undefined,
      category: TransactionCategory.OTHER,
      date: initialDate ?? new Date(),
      name: "",
      paymentMethod: TransactionPaymentMethod.CASH,
      type: TransactionType.EXPENSE,
    },
  });
  const { reset } = form;

  useEffect(() => {
    if (IsOpen) {
      if (defaultValues) reset(defaultValues);
      else if (initialDate) reset({ amount: undefined, category: TransactionCategory.OTHER, date: initialDate,
        name: "", paymentMethod: TransactionPaymentMethod.CASH, type: TransactionType.EXPENSE });
    }
  }, [IsOpen, defaultValues, initialDate, reset]);

  const onSubmit = async (data: FormSchema) => {
    try {
      setSubmitError("");
      setIsSubmitting(true);
      await upsertTransaction({ ...data, id: transactionId });
      toast.success("Transação salva com sucesso!");
      setIsOpen(false);
      form.reset();
    } catch {
      setSubmitError("Não foi possível salvar a transação. Os dados continuam preenchidos; tente novamente.");
      console.error("Erro ao salvar transação.");
      toast.error("Ocorreu um erro ao salvar a transação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdate = Boolean(transactionId);

  return (
    <Dialog
      open={IsOpen}
      onOpenChange={(open) => {
        if (!open && isSubmitting) return;
        setIsOpen(open);
        if (!open) {
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent closeDisabled={isSubmitting}>
        <DialogHeader>
          <DialogTitle>
            {" "}
            {isUpdate ? "Atualizar" : "Criar"} transação{" "}
          </DialogTitle>
          <DialogDescription> Insira as informações abaixo </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isSubmitting} className="space-y-4 sm:space-y-6">
            {submitError ? <p role="alert" aria-live="assertive" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{submitError}</p> : null}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <MoneyInput
                      placeholder="R$ 0,00"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={field.disabled}
                      error={!!form.formState.errors.amount}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo da transação..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACTION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACTION_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pagamento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um método de pagamento..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACTION_PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <DatePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting} className="min-h-[44px]">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="min-h-[44px]">
                {isSubmitting ? (
                  <>
                    <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none" />
                    Salvando transação...
                  </>
                ) : isUpdate ? (
                  "Atualizar"
                ) : (
                  "Adicionar"
                )}
              </Button>
              <span role="status" aria-live="polite" className="sr-only">{isSubmitting ? "Salvando transação. Aguarde." : ""}</span>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertTransactionDialog;
