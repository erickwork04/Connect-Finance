"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type CheckoutStatus = "CREATING" | "PENDING" | "ACTIVE" | "CANCELLED" | "FAILED";

export default function SubscriptionCheckoutStatus({ id, status, paid }: { id: string; status: CheckoutStatus; paid: boolean }) {
  const router = useRouter();
  const attempts = useRef(0);
  const notified = useRef("");

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
        router.refresh();
      }, 5000);
      return () => window.clearTimeout(timer);
    }
  }, [id, paid, router, status]);

  return null;
}
