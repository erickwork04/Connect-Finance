"use client";

import { useState, type FormEvent } from "react";
import { cancelInstallment, type FinanceActionState } from "@/app/_actions/dashboard-v2";

const initial: FinanceActionState = { message: "", success: false };

export default function CancelInstallmentButton({ planId, planName }: { planId: string; planName: string }) {
  const [state, setState] = useState(initial);
  const [pending, setPending] = useState(false);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setState(initial);
    setPending(true);
    try {
      setState(await cancelInstallment(state, new FormData(event.currentTarget)));
    } catch {
      setState({ message: "Falha de conexão. O parcelamento continua ativo; tente novamente.", success: false });
    } finally {
      setPending(false);
    }
  };
  return <form onSubmit={handleSubmit} aria-busy={pending} className="mt-4 border-t border-border pt-3">
    <input type="hidden" name="planId" value={planId} />
    <button type="submit" aria-label={`Cancelar parcelamento de ${planName}`} title={`Cancela ${planName} e remove as parcelas futuras pendentes`} disabled={pending} onClick={(event) => { if (!window.confirm(`Cancelar o parcelamento “${planName}” e remover as parcelas futuras pendentes?`)) event.preventDefault(); }} className="min-h-11 rounded-md px-3 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60">{pending ? `Cancelando ${planName}...` : "Cancelar parcelamento"}</button>
    {pending ? <p role="status" aria-live="polite" className="mt-2 text-xs text-muted-foreground">Cancelando parcelamento e removendo parcelas futuras pendentes...</p> : state.message ? <p role={state.success ? "status" : "alert"} aria-live={state.success ? "polite" : "assertive"} className={`mt-2 text-xs ${state.success ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p> : null}
  </form>;
}
