"use client";

import { useActionState } from "react";
import { cancelInstallment, type FinanceActionState } from "@/app/_actions/dashboard-v2";

const initial: FinanceActionState = { message: "", success: false };

export default function CancelInstallmentButton({ planId }: { planId: string }) {
  const [state, action, pending] = useActionState(cancelInstallment, initial);
  return <form action={action} className="mt-4 border-t border-border pt-3">
    <input type="hidden" name="planId" value={planId} />
    <button type="submit" disabled={pending} onClick={(event) => { if (!window.confirm("Cancelar este parcelamento e remover as parcelas futuras pendentes?")) event.preventDefault(); }} className="min-h-10 rounded-md px-3 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60">{pending ? "Cancelando..." : "Cancelar compra parcelada"}</button>
    {state.message ? <p role="status" className={`mt-2 text-xs ${state.success ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p> : null}
  </form>;
}
