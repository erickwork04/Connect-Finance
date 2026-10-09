export const FREE_PLAN_LIMITS = { creditCards: 1, activeCommitments: 3 } as const;

export function hasPremiumPlan(subscriptionPlan: unknown): boolean {
  return subscriptionPlan === "premium";
}

export function canCreateWithinLimit(currentCount: number, limit: number | null): boolean {
  return limit === null || currentCount < limit;
}

export function isActiveCommitment(status: "PENDING" | "CONFIRMED" | "PAID", deletedAt: Date | null): boolean {
  return deletedAt === null && status !== "PAID";
}

export function permissionsForPlan(isPremium: boolean) {
  return {
    isPremium,
    canImportFiles: isPremium,
    creditCardLimit: isPremium ? null : FREE_PLAN_LIMITS.creditCards,
    activeCommitmentLimit: isPremium ? null : FREE_PLAN_LIMITS.activeCommitments,
  };
}
