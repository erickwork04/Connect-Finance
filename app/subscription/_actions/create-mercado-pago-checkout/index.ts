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

  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new Error("As chaves do Mercado Pago não foram configuradas nas variáveis de ambiente.");
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const payerEmail = user.emailAddresses[0]?.emailAddress;;

  if (!payerEmail) {
    throw new Error("O usuário não possui um e-mail cadastrado.");
  }

  console.log("Usando ambiente Mercado Pago:", {
    payerEmail,
    hasAccessToken: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
  });

  console.log("Mercado Pago request:", {
    url: "https://api.mercadopago.com/preapproval",
    payerEmail,
    cardTokenId: cardTokenId ? `${cardTokenId.substring(0, 8)}...` : null,
    planId: process.env.MERCADO_PAGO_PREMIUM_PLAN_ID,
    accessTokenPrefix:
      process.env.MERCADO_PAGO_ACCESS_TOKEN?.substring(0, 12),
  });

  const payload = {
  preapproval_plan_id: process.env.MERCADO_PAGO_PREMIUM_PLAN_ID,
  reason: "Plano Premium - Connect Finance",
  external_reference: userId,
  payer_email: payerEmail,
  card_token_id: cardTokenId,
  status: "authorized",
  back_url: `${appUrl}/subscription`,
};

  console.log("Payload Mercado Pago:", {
    ...payload,
    card_token_id: `${cardTokenId.substring(0, 8)}...`,
  });

  const response = await fetch(
    "https://api.mercadopago.com/preapproval",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  const responseText = await response.text();

  console.log("Mercado Pago response:", {
    status: response.status,
    statusText: response.statusText,
    body: responseText,
    headers: Object.fromEntries(response.headers.entries()),
  });

  if (!response.ok) {
    throw new Error(
      `Mercado Pago retornou ${response.status} ${response.statusText}: ${responseText}`
    );
  }

  const subscription = JSON.parse(responseText);

  return {
    subscriptionId: subscription.id,
    url: subscription.init_point,
  };
};