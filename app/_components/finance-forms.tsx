"use client";

import { useActionState, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { confirmCommitment, createCard, createCommitment, createInstallment, linkCommitment, saveInvoice, updateCommitment, type CommitmentManagerData, type FinanceActionState } from "@/app/_actions/dashboard-v2";
import { TRANSACTION_CATEGORY_OPTIONS } from "@/app/_constanst/transactions";
import MonthPicker from "./month-picker";
import { DatePicker } from "./ui/date-picker";
import { CurrencyInput } from "./money-input";
import { DayOfMonthPicker } from "./day-of-month-picker";
import { formatCurrency } from "@/app/_utils/currency";

const field = "min-w-0 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]";
const label = "grid min-w-0 gap-1.5 text-xs text-muted-foreground";
const initial: FinanceActionState = { message: "", success: false };
type Action = (state: FinanceActionState, formData: FormData) => Promise<FinanceActionState>;

function ActionForm({ action, children, submit, onSuccess }: { action: Action; children: ReactNode; submit: string; onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(async (previous: FinanceActionState, formData: FormData) => {
    const result = await action(previous, formData);
    if (result.success) onSuccess?.();
    return result;
  }, initial);
  return <form action={formAction} className="grid min-w-0 gap-3 sm:grid-cols-2">
    {children}
    <div className="sm:col-span-2 flex flex-wrap items-center gap-3"><button type="submit" disabled={pending} className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Salvando..." : submit}</button>{state.message && <p role="status" className={`text-xs ${state.success ? "text-emerald-400" : "text-rose-400"}`}>{state.message}</p>}</div>
  </form>;
}

function DateFormField({ name, initialDate, disabled = false }: { name: string; initialDate: string; disabled?: boolean }) {
  const [date, setDate] = useState<Date | undefined>(() => new Date(`${initialDate}T12:00:00`));
  return <div className={label}><span>Vencimento</span><input type="hidden" name={name} value={date ? format(date, "yyyy-MM-dd") : ""} /><DatePicker value={date} onChange={setDate} disabled={disabled} />{disabled ? <span className="text-xs text-muted-foreground">O vencimento de um compromisso pago não pode ser alterado.</span> : null}</div>;
}

function MoneyFormField({ name, title, initialValue, disabled = false }: { name: string; title: string; initialValue?: number; disabled?: boolean }) {
  const [value, setValue] = useState<number | undefined>(initialValue);
  return <label className={label}>{title}<CurrencyInput name={name} value={value} onChange={setValue} disabled={disabled} className={`${field} ${disabled ? "opacity-60" : ""}`} /></label>;
}

function DayFormField({ name, title, initialValue }: { name: string; title: string; initialValue?: number }) {
  const [value, setValue] = useState<number | undefined>(initialValue);
  return <div className={label}><span>{title}</span><DayOfMonthPicker name={name} label={title} value={value} onChange={setValue} /></div>;
}

export function CardForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  return <ActionForm action={createCard} submit="Salvar cartão" onSuccess={onSuccess}>
    <label className={label}>Nome<input name="name" required maxLength={80} className={field} placeholder="Ex.: Cartão principal" /></label>
    <label className={label}>Bandeira<input name="brand" required maxLength={40} className={field} placeholder="Ex.: Visa" /></label>
    <MoneyFormField name="limitTotal" title="Limite total" />
    <DayFormField name="closingDay" title="Dia de fechamento" />
    <DayFormField name="dueDay" title="Dia de vencimento" />
    <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="isPrimary" />Cartão principal</label>
  </ActionForm>;
}

export function InvoiceForm({ cards, month, onSuccess }: { cards: { id: string; name: string }[]; month: string; onSuccess?: () => void }) {
  const [invoiceMonth, setInvoiceMonth] = useState(month);
  return <ActionForm action={saveInvoice} submit="Salvar fatura" onSuccess={onSuccess}>
    <label className={label}>Cartão<select name="cardId" required className={field}>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
    <div className={label}><span>Mês da fatura</span><MonthPicker name="month" value={invoiceMonth} onChange={setInvoiceMonth} label="Mês da fatura" className="w-full" /></div>
    <MoneyFormField name="amount" title="Valor da fatura" />
    <label className={label}>Status<select name="status" className={field}><option value="OPEN">Aberta</option><option value="PAID">Paga</option></select></label>
  </ActionForm>;
}

export function InstallmentForm({ cards, month, onSuccess }: { cards: { id: string; name: string }[]; month: string; onSuccess?: () => void }) {
  const [startMonth, setStartMonth] = useState(month);
  return <ActionForm action={createInstallment} submit="Salvar parcelamento" onSuccess={onSuccess}>
    <label className={label}>Compra<input name="description" required maxLength={120} className={field} /></label>
    <label className={label}>Cartão<select name="cardId" className={field}><option value="">Sem cartão vinculado</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
    <MoneyFormField name="totalAmount" title="Valor total" />
    <MoneyFormField name="installmentAmount" title="Valor mensal" />
    <label className={label}>Número de parcelas<input name="installmentCount" type="number" min="1" max="120" required className={field} /></label>
    <div className={label}><span>Primeiro mês</span><MonthPicker name="startMonth" value={startMonth} onChange={setStartMonth} label="Primeiro mês" className="w-full" /></div>
  </ActionForm>;
}

export function CommitmentForm({ month, onSuccess }: { month: string; onSuccess?: () => void }) {
  const [recurring, setRecurring] = useState(false);
  const [dueDay, setDueDay] = useState<number | undefined>();
  const [startMonth, setStartMonth] = useState(month);
  const lastDay = new Date(Number(startMonth.slice(0, 4)), Number(startMonth.slice(5, 7)), 0).getDate();
  const dueDate = dueDay ? `${startMonth}-${String(Math.min(dueDay, lastDay)).padStart(2, "0")}` : "";
  return <ActionForm action={createCommitment} submit="Salvar compromisso" onSuccess={onSuccess}>
    <label className={label}>Descrição<input name="description" required maxLength={120} className={field} /></label>
    <MoneyFormField name="amount" title="Valor" />
    {recurring ? <><div className={label}><span>Primeiro mês</span><MonthPicker value={startMonth} onChange={setStartMonth} label="Primeiro mês" className="w-full" /></div>
      <div className={label}><span>Dia de vencimento</span><DayOfMonthPicker value={dueDay} onChange={setDueDay} label="Dia de vencimento" /></div>
      <input type="hidden" name="dueDate" value={dueDate} /><input type="hidden" name="recurrenceDay" value={dueDay ?? ""} /></> :
      <DateFormField key={month} name="dueDate" initialDate={`${month}-01`} />}
    <label className={label}>Categoria<select name="category" className={field}>{TRANSACTION_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <label className={label}>Recorrência<select value={recurring ? "monthly" : "none"} onChange={(event) => setRecurring(event.target.value === "monthly")} className={field}><option value="none">Não recorrente</option><option value="monthly">Mensal</option></select></label>
    {recurring ? <input type="hidden" name="recurring" value="on" /> : null}
    <p className="self-end text-xs text-muted-foreground">Status inicial: Pendente. Cada mês terá um status independente.</p>
  </ActionForm>;
}

export function CommitmentLinkForm({ commitmentId, transactions, onSuccess }: { commitmentId: string; transactions: { id: string; name: string; amount: number }[]; onSuccess?: () => void }) {
  return <ActionForm action={linkCommitment} submit="Vincular transação" onSuccess={onSuccess}>
    <input type="hidden" name="commitmentId" value={commitmentId} />
    <label className={`${label} sm:col-span-2`}>Transação correspondente<select name="transactionId" required className={field}><option value="">Selecione</option>{transactions.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatCurrency(item.amount)}</option>)}</select></label>
  </ActionForm>;
}

export function ConfirmCommitmentForm({ commitmentId, onSuccess }: { commitmentId: string; onSuccess?: () => void }) {
  return <ActionForm action={confirmCommitment} submit="Confirmar compromisso" onSuccess={onSuccess}><input type="hidden" name="commitmentId" value={commitmentId} /></ActionForm>;
}

export function CommitmentEditForm({ commitment, onSuccess }: { commitment: CommitmentManagerData["commitments"][number]; onSuccess?: () => void }) {
  const paid = commitment.status === "PAID";
  const [dueDay, setDueDay] = useState<number | undefined>(Number(commitment.dueDate.slice(8, 10)));
  const originalMonth = commitment.dueDate.slice(0, 7);
  const lastDay = new Date(Number(originalMonth.slice(0, 4)), Number(originalMonth.slice(5, 7)), 0).getDate();
  return <ActionForm action={updateCommitment} submit="Salvar alterações" onSuccess={onSuccess}>
    <input type="hidden" name="commitmentId" value={commitment.id} />
    <label className={label}>Descrição<input name="description" defaultValue={commitment.description} required maxLength={120} className={field} /></label>
    <MoneyFormField name="amount" title="Valor" initialValue={commitment.amount} disabled={paid} />
    {commitment.recurring && !paid ? <div className={label}><span>Dia de vencimento neste mês</span><DayOfMonthPicker value={dueDay} onChange={setDueDay} label="Dia de vencimento neste mês" />
      <input type="hidden" name="dueDate" value={dueDay ? `${originalMonth}-${String(Math.min(dueDay, lastDay)).padStart(2, "0")}` : ""} /></div> :
      <DateFormField name="dueDate" initialDate={commitment.dueDate.slice(0, 10)} disabled={paid} />}
    <label className={label}>Categoria<select name="category" defaultValue={commitment.category} className={field}>{TRANSACTION_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <p className="text-xs text-muted-foreground sm:col-span-2">A edição altera apenas este mês. {commitment.recurring ? "A definição dos próximos meses permanece igual." : ""} {paid ? "Valor e vencimento do compromisso pago permanecem vinculados à transação." : ""}</p>
  </ActionForm>;
}
