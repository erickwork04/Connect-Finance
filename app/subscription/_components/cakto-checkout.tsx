"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/app/_components/ui/button";
import { createCaktoCheckout } from "../_actions/create-cakto-checkout";

export default function CaktoCheckout() {
  const [isStarting, setIsStarting] = useState(false);

  const startCheckout = async () => {
    setIsStarting(true);
    try {
      const result = await createCaktoCheckout();
      if (!result.ok) {
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
      toast.error("Não foi possível iniciar a assinatura", { description: "Tente novamente em instantes." });
    } finally {
      setIsStarting(false);
    }
  };

  return <Button type="button" className="h-11 w-full rounded-full font-bold" disabled={isStarting} onClick={startCheckout}>
    {isStarting ? "Preparando checkout..." : "Assinar Premium"}
  </Button>;
}
