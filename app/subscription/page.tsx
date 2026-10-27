import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import SubscriptionScreen from "./_components/subscription-screen";
import type { CheckoutStatus } from "./_components/subscription-checkout-status";
import { db } from "@/app/_lib/prisma";

export const dynamic = "force-dynamic";

function normalizeCheckoutStatus(status: string): CheckoutStatus {
  if (status === "PAUSED" || status === "CANCELLED") return "CANCELLED";
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "PENDING") return "PENDING";
  if (status === "FAILED") return "FAILED";
  if (status === "CREATING") return "CREATING";
  return "CANCELLED";
}

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const params = await searchParams;
  const checkoutToken = params.checkout && /^[A-Za-z0-9._~-]{1,255}$/.test(params.checkout) ? params.checkout : null;
  const [client, billing, checkout] = await Promise.all([
    clerkClient(),
    db.billingSubscription.findFirst({
      where: { userId, status: "ACTIVE" }, orderBy: { createdAt: "desc" },
      select: { currentAmount: true },
    }),
    checkoutToken
      ? db.billingSubscription.findFirst({
          where: { userId, caktoCallbackToken: checkoutToken, provider: "CAKTO" },
          select: { id: true, status: true, firstPaymentApprovedAt: true },
        })
      : Promise.resolve(null),
  ]);
  const user = await client.users.getUser(userId);
  const hasPremiumPlan = user.privateMetadata?.subscriptionPlan === "premium" || user.publicMetadata?.subscriptionPlan === "premium";

  return (
    <SubscriptionScreen
      hasPremiumPlan={hasPremiumPlan}
      monthlyAmount={billing ? Number(billing.currentAmount) : null}
      checkout={checkout ? {
        id: checkout.id,
        status: normalizeCheckoutStatus(checkout.status),
        paid: Boolean(checkout.firstPaymentApprovedAt),
      } : null}
    />
  );
}
