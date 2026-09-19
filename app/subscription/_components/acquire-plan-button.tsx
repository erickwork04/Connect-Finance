"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { Button } from "@/app/_components/ui/button";

const MercadoPagoPayment = dynamic(() => import("./mercado-pago-payment"), {
  ssr: false,
  loading: () => <p role="status" className="text-sm text-muted-foreground">Carregando formulário de pagamento...</p>,
});

const AcquirePlanButton = ({ hasPremiumPlan }: { hasPremiumPlan: boolean }) => {

  const [showPayment, setShowPayment] = useState(false);

  if (hasPremiumPlan) {
    return (
      <div className="space-y-2">
        <Button disabled type="button" className="h-11 w-full rounded-full">
          Gerenciar assinatura
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          O gerenciamento online ainda não está disponível nesta aplicação.
        </p>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="min-w-0 space-y-4">
        <div className="max-w-full overflow-x-auto"><MercadoPagoPayment /></div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-full"
          onClick={() => setShowPayment(false)}
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      className="h-11 w-full rounded-full font-bold"
      onClick={() => setShowPayment(true)}
    >
      Adquirir plano
    </Button>
  );
};

export default AcquirePlanButton;
