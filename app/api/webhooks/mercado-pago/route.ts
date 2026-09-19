import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Missing Mercado Pago access token" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();

    console.log("Mercado Pago webhook:", body);

    const type = body.type;
    const dataId = body.data?.id;

    if (!type || !dataId) {
      return NextResponse.json({ received: true });
    }

    switch (type) {
      case "subscription_preapproval": {
        const response = await fetch(
          `https://api.mercadopago.com/preapproval/${dataId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            "Não foi possível consultar a assinatura no Mercado Pago.",
          );
        }

        const subscription = await response.json();

        const clerkUserId = subscription.external_reference;

        if (!clerkUserId) {
          return NextResponse.json(
            { error: "No Clerk user id" },
            { status: 400 },
          );
        }

        const client = await clerkClient();

        if (subscription.status === "authorized") {
          await client.users.updateUser(clerkUserId, {
            privateMetadata: {
              mercadoPagoSubscriptionId: subscription.id,
            },

            publicMetadata: {
              subscriptionPlan: "premium",
            },
          });
        }

        if (
          subscription.status === "cancelled" ||
          subscription.status === "paused"
        ) {
          await client.users.updateUser(clerkUserId, {
            privateMetadata: {
              mercadoPagoSubscriptionId: null,
            },

            publicMetadata: {
              subscriptionPlan: null,
            },
          });
        }

        break;
      }

      default:
        console.log(`Evento não tratado: ${type}`);
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    console.error("Mercado Pago webhook processing failed.");

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown webhook error",
      },
      { status: 500 },
    );
  }
};