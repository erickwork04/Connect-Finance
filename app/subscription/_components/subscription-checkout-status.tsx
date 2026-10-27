"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type CheckoutStatus = "CREATING" | "PENDING" | "ACTIVE" | "CANCELLED" | "FAILED";

export default function SubscriptionCheckoutStatus({ id, status, paid }: { id: string; status: CheckoutStatus; paid: boolean }) {
  const router = useRouter();
  const attempts = useRef(0);
  const notified = useRef("");
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const key = `${id}:${status}:${paid}`;
    if (notified.current !== key) {
      notified.current = key;
      if (paid) toast.success("Pagamento aprovado", { description: "Seu plano Premium foi ativado com sucesso." });
      else if (status === "FAILED" || status === "CANCELLED") {
        toast.error("Pagamento não aprovado", { description: "Revise os dados do cartão ou tente outro método de pagamento." });
      } else {
        toast.info("Assinatura em processamento", { description: "Aguardamos a confirmação do pagamento." });
      }
    }
    if (!paid && status !== "FAILED" && status !== "CANCELLED" && attempts.current < 6) {
      const timer = window.setTimeout(() => {
        attempts.current += 1;
        setPollCount(attempts.current);
        router.refresh();
      }, 5000);
      return () => window.clearTimeout(timer);
    }
  }, [id, paid, pollCount, router, status]);

  if (paid || status === "FAILED" || status === "CANCELLED") return null;
  return <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3" role="status" aria-live="polite">
    <p className="text-sm text-muted-foreground">Aguardando a confirmação da Cakto. Esta página verifica o status automaticamente.</p>
    {pollCount >= 6 ? <Button type="button" variant="outline" onClick={() => { attempts.current = 0; setPollCount(0); router.refresh(); }} className="min-h-11">Verificar pagamento novamente</Button> : null}
  </div>;
}
