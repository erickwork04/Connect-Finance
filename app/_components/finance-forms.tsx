"use client";

import { useActionState, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { confirmCommitment, createCard, createCommitment, createInstallment, linkCommitment, saveInvoice, updateCommitment, type CommitmentManagerData, type FinanceActionState } from "@/app/_actions/dashboard-v2";
import { TRANSACTION_CATEGORY_OPTIONS } from "@/app/_constanst/transactions";
import MonthPicker from "./month-picker";
import { DatePicker } from "./ui/date-picker";

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

export function CardForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  return <ActionForm action={createCard} submit="Salvar cartão" onSuccess={onSuccess}>
    <label className={label}>Nome<input name="name" required maxLength={80} className={field} placeholder="Ex.: Cartão principal" /></label>
    <label className={label}>Bandeira<input name="brand" required maxLength={40} className={field} placeholder="Ex.: Visa" /></label>
    <label className={label}>Limite total (R$)<input name="limitTotal" type="number" min="0.01" step="0.01" required className={field} /></label>
    <label className={label}>Dia de fechamento<input name="closingDay" type="number" min="1" max="31" required className={field} /></label>
    <label className={label}>Dia de vencimento<input name="dueDay" type="number" min="1" max="31" required className={field} /></label>
    <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="isPrimary" />Cartão principal</label>
  </ActionForm>;
}

export function InvoiceForm({ cards, month, onSuccess }: { cards: { id: string; name: string }[]; month: string; onSuccess?: () => void }) {
  const [invoiceMonth, setInvoiceMonth] = useState(month);
  return <ActionForm action={saveInvoice} submit="Salvar fatura" onSuccess={onSuccess}>
    <label className={label}>Cartão<select name="cardId" required className={field}>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
    <div className={label}><span>Mês da fatura</span><MonthPicker name="month" value={invoiceMonth} onChange={setInvoiceMonth} label="Mês da fatura" className="w-full" /></div>
    <label className={label}>Valor da fatura (R$)<input name="amount" type="number" min="0" step="0.01" required className={field} /></label>
    <label className={label}>Status<select name="status" className={field}><option value="OPEN">Aberta</option><option value="PAID">Paga</option></select></label>
  </ActionForm>;
}

export function InstallmentForm({ cards, month, onSuccess }: { cards: { id: string; name: string }[]; month: string; onSuccess?: () => void }) {
  const [startMonth, setStartMonth] = useState(month);
  return <ActionForm action={createInstallment} submit="Salvar parcelamento" onSuccess={onSuccess}>
    <label className={label}>Compra<input name="description" required maxLength={120} className={field} /></label>
    <label className={label}>Cartão<select name="cardId" className={field}><option value="">Sem cartão vinculado</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
    <label className={label}>Valor total (R$)<input name="totalAmount" type="number" min="0.01" step="0.01" required className={field} /></label>
    <label className={label}>Valor mensal (R$)<input name="installmentAmount" type="number" min="0.01" step="0.01" required className={field} /></label>
    <label className={label}>Número de parcelas<input name="installmentCount" type="number" min="1" max="120" required className={field} /></label>
    <div className={label}><span>Primeiro mês</span><MonthPicker name="startMonth" value={startMonth} onChange={setStartMonth} label="Primeiro mês" className="w-full" /></div>
  </ActionForm>;
}

export function CommitmentForm({ month, onSuccess }: { month: string; onSuccess?: () => void }) {
  return <ActionForm action={createCommitment} submit="Salvar compromisso" onSuccess={onSuccess}>
    <label className={label}>Descrição<input name="description" required maxLength={120} className={field} /></label>
    <label className={label}>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" required className={field} /></label>
    <DateFormField key={month} name="dueDate" initialDate={`${month}-01`} />
    <label className={label}>Categoria<select name="category" className={field}>{TRANSACTION_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm sm:col-span-2"><input name="recurring" type="checkbox" />Repetir por 12 meses como gasto fixo</label>
  </ActionForm>;
}

export function CommitmentLinkForm({ commitmentId, transactions, onSuccess }: { commitmentId: string; transactions: { id: string; name: string; amount: number }[]; onSuccess?: () => void }) {
  return <ActionForm action={linkCommitment} submit="Vincular transação" onSuccess={onSuccess}>
    <input type="hidden" name="commitmentId" value={commitmentId} />
    <label className={`${label} sm:col-span-2`}>Transação correspondente<select name="transactionId" required className={field}><option value="">Selecione</option>{transactions.map((item) => <option key={item.id} value={item.id}>{item.name} · R$ {item.amount.toFixed(2)}</option>)}</select></label>
  </ActionForm>;
}

export function ConfirmCommitmentForm({ commitmentId, onSuccess }: { commitmentId: string; onSuccess?: () => void }) {
  return <ActionForm action={confirmCommitment} submit="Confirmar compromisso" onSuccess={onSuccess}><input type="hidden" name="commitmentId" value={commitmentId} /></ActionForm>;
}

export function CommitmentEditForm({ commitment, onSuccess }: { commitment: CommitmentManagerData["commitments"][number]; onSuccess?: () => void }) {
  const paid = commitment.status === "PAID";
  return <ActionForm action={updateCommitment} submit="Salvar alterações" onSuccess={onSuccess}>
    <input type="hidden" name="commitmentId" value={commitment.id} />
    <label className={label}>Descrição<input name="description" defaultValue={commitment.description} required maxLength={120} className={field} /></label>
    <label className={label}>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" defaultValue={commitment.amount.toFixed(2)} required readOnly={paid} className={`${field} ${paid ? "opacity-60" : ""}`} /></label>
    <DateFormField name="dueDate" initialDate={commitment.dueDate.slice(0, 10)} disabled={paid} />
    <label className={label}>Categoria<select name="category" defaultValue={commitment.category} className={field}>{TRANSACTION_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm sm:col-span-2"><input name="recurring" type="checkbox" defaultChecked={commitment.recurring} disabled={paid} />Gasto fixo nesta ocorrência</label>
    {paid && commitment.recurring ? <input type="hidden" name="recurring" value="on" /> : null}
    <p className="text-xs text-muted-foreground sm:col-span-2">A edição altera apenas este mês. {paid ? "Valor e vencimento do compromisso pago permanecem vinculados à transação." : ""}</p>
  </ActionForm>;
}
