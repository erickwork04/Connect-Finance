"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

export const createMercadoPagoCheckout = async ( cardTokenId: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  if (
    !process.env.MERCADO_PAGO_ACCESS_TOKEN ||
    !process.env.MERCADO_PAGO_PREMIUM_PLAN_ID
  ) {
    throw new Error(
      "As chaves do Mercado Pago não foram configuradas nas variáveis de ambiente."
    );
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  //const payerEmail = user.emailAddresses[0]?.emailAddress;

  const payerEmail = process.env.MERCADO_PAGO_TEST_PAYER_EMAIL ||
  user.emailAddresses[0]?.emailAddress;

  if (!payerEmail) {
    throw new Error("O usuário não possui um e-mail cadastrado.");
  }

  console.log("Usando ambiente Mercado Pago:", {
    payerEmail,
    hasAccessToken: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
  });

  const response = await fetch("https://api.mercadopago.com/preapproval",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
    reason: "Connect Finance Premium",

    external_reference: userId,

    payer_email: payerEmail,

    card_token_id: cardTokenId,

    status: "authorized",

    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 19.9,
      currency_id: "BRL",
    },

    back_url: `${appUrl}/subscription`,
  }),
  }
  );

  if (!response.ok) {
    const error = await response.text();

    console.error("Mercado Pago error:", error);

    throw new Error(
      "Não foi possível criar a assinatura no Mercado Pago."
    );
  }

  const subscription = await response.json();

  return {
    subscriptionId: subscription.id,
    url: subscription.init_point,
  };
};