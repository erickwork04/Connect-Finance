import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getCurrentMonthTransactions } from "../_data/get-dashboard/get-current-month-transactions";
import SubscriptionScreen from "./_components/subscription-screen";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const [client, currentMonthTransactions] = await Promise.all([
    clerkClient(),
    getCurrentMonthTransactions(),
  ]);
  const user = await client.users.getUser(userId);
  const hasPremiumPlan = user.publicMetadata?.subscriptionPlan === "premium";

  return (
    <SubscriptionScreen
      hasPremiumPlan={hasPremiumPlan}
      currentMonthTransactions={currentMonthTransactions}
    />
  );
}
