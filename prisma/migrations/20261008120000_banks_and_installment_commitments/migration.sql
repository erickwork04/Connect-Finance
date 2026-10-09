CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT', 'OTHER');

CREATE TABLE "BankAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "accountType" "BankAccountType" NOT NULL DEFAULT 'CHECKING',
  "balance" DECIMAL(12,2) NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#3b82f6',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BankAccount_userId_isActive_createdAt_idx" ON "BankAccount"("userId", "isActive", "createdAt");

ALTER TABLE "MonthlyCommitment" ADD COLUMN "installmentPlanId" TEXT;
CREATE UNIQUE INDEX "MonthlyCommitment_installmentPlanId_occurrenceMonth_key" ON "MonthlyCommitment"("installmentPlanId", "occurrenceMonth");
ALTER TABLE "MonthlyCommitment" ADD CONSTRAINT "MonthlyCommitment_installmentPlanId_fkey" FOREIGN KEY ("installmentPlanId") REFERENCES "InstallmentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

