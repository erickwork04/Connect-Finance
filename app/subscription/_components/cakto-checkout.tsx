"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/app/_components/ui/button";
import { createCaktoCheckout } from "../_actions/create-cakto-checkout";

export default function CaktoCheckout() {
  const [isStarting, setIsStarting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const startCheckout = async () => {
    setCheckoutError("");
    setIsStarting(true);
    try {
      const result = await createCaktoCheckout();
      if (!result.ok) {
        setCheckoutError("Não foi possível abrir o checkout. Aguarde alguns instantes e tente novamente.");
        if (result.code === "configuration") {
          toast.error("Checkout indisponível", { description: "A configuração de assinatura ainda não foi concluída." });
        } else if (result.code === "schema") {
          toast.error("Checkout em configuração", { description: "A estrutura da Cakto ainda não foi ativada no banco de dados." });
        } else {
          toast.error("Não foi possível iniciar a assinatura", { description: "Aguarde a confirmação de uma tentativa anterior ou tente novamente." });
        }
        return;
      }
      window.location.assign(result.url);
    } catch {
      setCheckoutError("Falha de conexão ao iniciar o checkout. Tente novamente.");
      toast.error("Não foi possível iniciar a assinatura", { description: "Tente novamente em instantes." });
    } finally {
      setIsStarting(false);
    }
  };

  return <div className="space-y-2">
    <Button type="button" aria-busy={isStarting} className="h-11 w-full rounded-full font-bold" disabled={isStarting} onClick={startCheckout}>
      {isStarting ? "Preparando checkout do Premium..." : "Assinar Premium"}
    </Button>
    {isStarting ? <p role="status" aria-live="polite" className="text-center text-xs text-muted-foreground">Conectando ao checkout seguro da Cakto...</p> : null}
    {checkoutError ? <p role="alert" aria-live="assertive" className="text-sm text-rose-300">{checkoutError}</p> : null}
  </div>;
}
