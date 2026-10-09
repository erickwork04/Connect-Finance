import type { BillingSubscriptionStatus } from "@prisma/client";

export function shouldUpdateClerkPremium(
  currentSubscriptionId: unknown,
  providerId: string,
  currentPlan: unknown,
  active: boolean,
): boolean {
  if (active) return currentSubscriptionId !== providerId || currentPlan !== "premium";
  return currentSubscriptionId === providerId;
}

export type PaymentFinalizationInput = {
  status: BillingSubscriptionStatus;
  firstPaymentAlreadyRecorded: boolean;
  couponReserved: boolean;
  firstCycleOnly: boolean;
  couponRestored: boolean;
};

export function getPaymentFinalization(input: PaymentFinalizationInput): {
  shouldRecordPayment: boolean;
  nextStatus: BillingSubscriptionStatus;
  shouldGrantPremium: boolean;
  shouldConsumeCoupon: boolean;
  shouldRestorePrice: boolean;
} {
  const canActivate = input.status === "CREATING" || input.status === "PENDING" || input.status === "ACTIVE";

  if (input.status === "FAILED") {
    return {
      shouldRecordPayment: false,
      nextStatus: "FAILED" as const,
      shouldGrantPremium: false,
      shouldConsumeCoupon: false,
      shouldRestorePrice: false,
    };
  }

  if (input.firstPaymentAlreadyRecorded) {
    return {
      shouldRecordPayment: false,
      nextStatus: input.status,
      shouldGrantPremium: input.status === "ACTIVE",
      shouldConsumeCoupon: false,
      shouldRestorePrice: false,
    };
  }

  const canceledOrUnrecognized = !canActivate;
  return {
    shouldRecordPayment: true,
    nextStatus: canceledOrUnrecognized ? "CANCELLED" as const : "ACTIVE" as const,
    shouldGrantPremium: !canceledOrUnrecognized,
    shouldConsumeCoupon: input.couponReserved,
    shouldRestorePrice: canActivate && input.firstCycleOnly && !input.couponRestored,
  };
}
