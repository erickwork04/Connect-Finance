import { auth, clerkClient } from "@clerk/nextjs/server";
import { hasPremiumPlan, permissionsForPlan } from "@/app/_lib/plan-rules";

export { FREE_PLAN_LIMITS } from "@/app/_lib/plan-rules";

export type PlanPermissions = {
  isPremium: boolean;
  canImportFiles: boolean;
  creditCardLimit: number | null;
  activeCommitmentLimit: number | null;
};

export { permissionsForPlan } from "@/app/_lib/plan-rules";

/** Clerk publicMetadata remains the sole authorization source for plan access. */
export async function getPlanPermissions(userId?: string): Promise<PlanPermissions> {
  const resolvedUserId = userId ?? (await auth()).userId;
  if (!resolvedUserId) throw new Error("Unauthorized");
  const client = await clerkClient();
  const user = await client.users.getUser(resolvedUserId);
  return permissionsForPlan(hasPremiumPlan(user.publicMetadata?.subscriptionPlan));
}
