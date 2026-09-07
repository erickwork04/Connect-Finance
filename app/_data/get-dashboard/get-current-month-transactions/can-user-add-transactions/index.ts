import { getCurrentMonthTransactions } from "..";
import { getAuthUserId, getClerkUser } from "@/app/_lib/auth";

export const canUserAddTransaction = async () => {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const user = await getClerkUser(userId);
  if (user.publicMetadata?.subscriptionPlan === "premium") {
    return true;
  }
  const currentMonthTransactions = await getCurrentMonthTransactions();
  if (currentMonthTransactions >= 10) {
    return false;
  }
  return true;
};
