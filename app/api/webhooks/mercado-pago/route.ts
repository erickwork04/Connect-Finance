import { NextResponse } from "next/server";
import { verifyMercadoPagoSignature } from "./verify-signature";
import { processAuthorizedPaymentEvent, processPreapprovalEvent } from "@/app/subscription/_lib/mercado-pago-events";

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

    if (type === "subscription_preapproval") await processPreapprovalEvent(signedId!, accessToken);
    if (type === "subscription_authorized_payment") await processAuthorizedPaymentEvent(signedId!, accessToken);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mercado Pago webhook processing failed", { code: typeof error === "object" && error && "code" in error ? error.code : "unknown" });

    return NextResponse.json(
      { error: "Could not process Mercado Pago webhook" },
      { status: 500 },
    );
  }
};
