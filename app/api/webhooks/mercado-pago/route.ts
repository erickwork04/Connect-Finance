import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { verifyMercadoPagoSignature } from "./verify-signature";

export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!accessToken || !webhookSecret) {
    return NextResponse.json(
      { error: "Mercado Pago webhook is not configured" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const signedIds = url.searchParams.getAll("data.id");
  const signedId = signedIds.length === 1 ? signedIds[0] : null;
  const signatureIsValid = verifyMercadoPagoSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId: signedId,
    secret: webhookSecret,
  });

  if (!signatureIsValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid webhook body" }, { status: 400 });
    }

    const event = body as { type?: unknown; data?: { id?: unknown } };
    const type = event.type;
    const dataId = event.data?.id;

    if (
      typeof type !== "string" ||
      (typeof dataId !== "string" && typeof dataId !== "number") ||
      String(dataId).toLowerCase() !== signedId?.toLowerCase()
    ) {
      return NextResponse.json({ error: "Invalid webhook body" }, { status: 400 });
    }

    switch (type) {
      case "subscription_preapproval": {
        const response = await fetch(
          `https://api.mercadopago.com/preapproval/${encodeURIComponent(signedId)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
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
        const user = await client.users.getUser(clerkUserId);
        const currentSubscriptionId = user.privateMetadata
          .mercadoPagoSubscriptionId;

        if (subscription.status === "authorized") {
          if (
            currentSubscriptionId !== subscription.id ||
            user.publicMetadata.subscriptionPlan !== "premium"
          ) {
            await client.users.updateUser(clerkUserId, {
              privateMetadata: {
                mercadoPagoSubscriptionId: subscription.id,
              },

              publicMetadata: {
                subscriptionPlan: "premium",
              },
            });
          }
        }

        if (
          subscription.status === "cancelled" ||
          subscription.status === "paused"
        ) {
          if (currentSubscriptionId === subscription.id) {
            await client.users.updateUser(clerkUserId, {
              privateMetadata: {
                mercadoPagoSubscriptionId: null,
              },

              publicMetadata: {
                subscriptionPlan: null,
              },
            });
          }
        }

        break;
      }

    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mercado Pago webhook error:", error);

    return NextResponse.json(
      { error: "Could not process Mercado Pago webhook" },
      { status: 500 },
    );
  }
};
