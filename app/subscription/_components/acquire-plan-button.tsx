"use client";

import { Button } from "@/app/_components/ui/button";
import { createStripeCheckout } from "../_actions/creat-stripe-checkout";
import { loadStripe } from "@stripe/stripe-js";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

const AcquirePlanButtonClerk = () => {
  const { user } = useUser();
  const handleAcquirePlanClick = async () => {
    const { sessionId } = await createStripeCheckout();
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      throw new Error("Stripe publishable key not found");
    }
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    );
    if (!stripe) {
      throw new Error("Stripe not found");
    }
    await stripe.redirectToCheckout({ sessionId });
  };
  const hasPremiumPlan = user?.publicMetadata?.subscriptionPlan === "premium";
  if (hasPremiumPlan) {
    return (
      <Button className="w-full rounded-full font-bold" variant="link">
        <Link
          href={`${(process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL as string) || "#"}?prefilled_email=${user?.emailAddresses?.[0]?.emailAddress || ""}`}
        >
          Gerenciar plano
        </Link>
      </Button>
    );
  }
  return (
    <Button
      className="w-full rounded-full font-bold"
      onClick={handleAcquirePlanClick}
    >
      Adquirir plano
    </Button>
  );
};

const AcquirePlanButton = () => {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (!hasClerkKey) {
    return (
      <Button className="w-full rounded-full font-bold" variant="secondary" disabled>
        Plano Premium Demo Ativo
      </Button>
    );
  }
  return <AcquirePlanButtonClerk />;
};

export default AcquirePlanButton;
