import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing stripe keys" }, { status: 400 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }
  try {
    const text = await request.text();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-10-28.acacia" as unknown as Stripe.LatestApiVersion,
    });
    const event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case "invoice.paid": {
        const { customer, subscription, subscription_details } =
          event.data.object as unknown as {
            customer: string;
            subscription: string;
            subscription_details?: { metadata?: { clerk_user_id?: string } };
          };
        const clerkUserId = subscription_details?.metadata?.clerk_user_id;
        if (!clerkUserId) {
          return NextResponse.json({ error: "No clerk user id" }, { status: 400 });
        }
        const client = await clerkClient();
        await client.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: customer,
            stripeSubscription: subscription,
          },
          publicMetadata: {
            subscriptionPlan: "premium",
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const subObj = event.data.object as { id: string };
        const subscription = await stripe.subscriptions.retrieve(subObj.id);
        const clerkUserId = subscription.metadata?.clerk_user_id;
        if (!clerkUserId) {
          return NextResponse.json({ error: "No clerk user id" }, { status: 400 });
        }
        const client = await clerkClient();
        await client.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          },
          publicMetadata: {
            subscriptionPlan: null,
          },
        });
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Could not process Stripe webhook" },
      { status: 500 },
    );
  }
};
