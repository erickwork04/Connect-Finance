"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/app/_components/ui/button";
import MercadoPagoPayment from "./mercado-pago-payment";

const AcquirePlanButton = () => {
  const { user } = useUser();

  const [showPayment, setShowPayment] = useState(false);

  const hasPremiumPlan =
    user?.publicMetadata?.subscriptionPlan === "premium";

  if (hasPremiumPlan) {
    return (
      <Button
        className="w-full rounded-full font-bold"
        variant="link"
      >
        Gerenciar plano
      </Button>
    );
  }

  if (showPayment) {
    return (
      <div className="space-y-4">
        <MercadoPagoPayment />

        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full"
          onClick={() => setShowPayment(false)}
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <Button
      className="w-full rounded-full font-bold"
      onClick={() => setShowPayment(true)}
    >
      Adquirir plano
    </Button>
  );
};

export default AcquirePlanButton;