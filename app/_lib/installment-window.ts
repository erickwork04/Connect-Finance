import type { Prisma } from "@prisma/client";

export const MAX_INSTALLMENT_COUNT = 120;

/** Prisma filter for installment plans that are active in the requested month. */
export function activeInstallmentWindow(month: string, shiftMonth: (month: string, offset: number) => string): Prisma.InstallmentPlanWhereInput {
  return {
    OR: Array.from({ length: MAX_INSTALLMENT_COUNT }, (_, index) => {
      const installmentCount = index + 1;
      return {
        installmentCount,
        startMonth: { gte: shiftMonth(month, 1 - installmentCount), lte: month },
      };
    }),
  };
}
