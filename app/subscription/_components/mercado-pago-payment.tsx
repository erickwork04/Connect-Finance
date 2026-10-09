"use client";

import { useRef, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { toast } from "sonner";
import { createMercadoPagoCheckout } from "../_actions/create-mercado-pago-checkout";
import { showCouponError } from "./coupon-toast";

const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
if (publicKey) initMercadoPago(publicKey);

type MercadoPagoFormData = { token?: string };

export default function MercadoPagoPayment({ couponCode, amountCents }: { couponCode?: string; amountCents: number }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handledErrorAt = useRef(0);

  const handleSubmit = async (formData: MercadoPagoFormData) => {
    if (!formData.token) {
      toast.error("Pagamento não aprovado", { description: "Revise os dados do cartão ou tente outro método de pagamento." });
      handledErrorAt.current = Date.now();
      throw new Error("Missing card token");
    }
    handledErrorAt.current = 0;
    setIsSubmitting(true);
    try {
      const result = await createMercadoPagoCheckout(formData.token, couponCode);
      if (!result.ok) {
        if (result.code === "pending") toast.error("Assinatura em processamento", { description: "Aguarde a confirmação antes de tentar novamente." });
        else if (result.code === "payment") toast.error("Pagamento não aprovado", { description: "Revise os dados do cartão ou tente outro método de pagamento." });
        else showCouponError(result.code);
        handledErrorAt.current = Date.now();
        throw new Error("Checkout rejected");
      }
      toast.success("Assinatura solicitada", { description: "Acompanhe a confirmação do pagamento." });
      if (result.url) window.location.assign(result.url);
      else window.location.assign(`/subscription?checkout=${encodeURIComponent(result.subscriptionId)}`);
    } catch (error) {
      if (error instanceof Error && error.message === "Checkout rejected") throw error;
      toast.error("Pagamento não aprovado", { description: "Revise os dados do cartão ou tente outro método de pagamento." });
      handledErrorAt.current = Date.now();
      throw new Error("Checkout unavailable");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <CardPayment
        initialization={{ amount: amountCents / 100 }}
        onSubmit={handleSubmit}
        onError={() => {
          if (Date.now() - handledErrorAt.current < 1500) return;
          toast.error("Pagamento não aprovado", { description: "Revise os dados do cartão ou tente outro método de pagamento." });
        }}
      />
      {isSubmitting ? <p role="status" className="mt-3 text-sm text-muted-foreground">Processando solicitação...</p> : null}
    </div>
  );
}
