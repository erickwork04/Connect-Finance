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

  const payload = {
  preapproval_plan_id: process.env.MERCADO_PAGO_PREMIUM_PLAN_ID,
  reason: "Plano Premium - Connect Finance",
  external_reference: userId,
  payer_email: payerEmail,
  card_token_id: cardTokenId,
  status: "authorized",
  back_url: `${appUrl}/subscription`,
};

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

  if (!response.ok) {
    throw new Error(
      `Não foi possível criar a assinatura no Mercado Pago (HTTP ${response.status}).`
    );
  }

  const subscription = JSON.parse(responseText);

  return {
    subscriptionId: subscription.id,
    url: subscription.init_point,
  };
};
