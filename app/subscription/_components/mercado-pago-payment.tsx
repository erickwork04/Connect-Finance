"use client";

import { useState } from "react";
import {
    CardPayment,
    initMercadoPago,
} from "@mercadopago/sdk-react";

import { createMercadoPagoCheckout } from "../_actions/create-mercado-pago-checkout";

const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

if (publicKey) {
    initMercadoPago(publicKey);
}

type MercadoPagoFormData = {
    token?: string;
};

const MercadoPagoPayment = () => {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const initialization = {
        amount: 19.9,
    };

    const handleSubmit = async (formData: MercadoPagoFormData) => {
        setErrorMessage(null);
        setIsSubmitting(true);
        try {

            const cardTokenId = formData.token;

            if (!cardTokenId) {
                throw new Error("O Mercado Pago não retornou o token do cartão.");
            }

            const result = await createMercadoPagoCheckout(
                cardTokenId,
            );

            if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error("Erro ao criar assinatura.");
            setErrorMessage("Não foi possível iniciar a contratação. Tente novamente.");
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleError = async () => {
        console.error("Erro no formulário do Mercado Pago.");
        setErrorMessage("Não foi possível carregar o formulário de pagamento. Tente novamente.");
    };

    const handleReady = async () => {
        setErrorMessage(null);
    };

    return (
        <div className="w-full">
            <CardPayment
                initialization={initialization}
                onSubmit={handleSubmit}
                onReady={handleReady}
                onError={handleError}
            />
            {isSubmitting ? <p role="status" className="mt-3 text-sm text-muted-foreground">Processando solicitação...</p> : null}
            {errorMessage ? <p role="alert" className="mt-3 text-sm text-red-400">{errorMessage}</p> : null}
        </div>
    );
};

export default MercadoPagoPayment;
