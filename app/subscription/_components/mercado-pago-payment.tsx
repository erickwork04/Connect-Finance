"use client";

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
    const initialization = {
        amount: 19.9,
    };

    const handleSubmit = async (formData: MercadoPagoFormData) => {
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
            console.error("Erro ao criar assinatura:", error);
            throw error;
        }
    };

    const handleError = async (error: unknown) => {
        console.error("Erro no formulário do Mercado Pago:", error);
    };

    const handleReady = async () => {
        console.log(
            "Formulário do Mercado Pago carregado.",
        );
    };

    return (
        <div className="w-full">
            <CardPayment
                initialization={initialization}
                onSubmit={handleSubmit}
                onReady={handleReady}
                onError={handleError}
            />
        </div>
    );
};

export default MercadoPagoPayment;