-- Dashboard V2: additive tables only. The historical import drift must be
-- reconciled against the target database before deploying this migration.
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'PAID');
CREATE TYPE "InstallmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CommitmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID');

CREATE TABLE "CreditCard" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "limitTotal" DECIMAL(12,2) NOT NULL,
  "closingDay" INTEGER NOT NULL,
  "dueDay" INTEGER NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreditCard_days_check" CHECK ("closingDay" BETWEEN 1 AND 31 AND "dueDay" BETWEEN 1 AND 31),
  CONSTRAINT "CreditCard_limit_check" CHECK ("limitTotal" >= 0)
);

CREATE TABLE "CardInvoice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "month" VARCHAR(7) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CardInvoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CardInvoice_amount_check" CHECK ("amount" >= 0)
);

CREATE TABLE "InstallmentPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "installmentAmount" DECIMAL(12,2) NOT NULL,
  "installmentCount" INTEGER NOT NULL,
  "startMonth" VARCHAR(7) NOT NULL,
  "cardId" TEXT,
  "status" "InstallmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstallmentPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InstallmentPlan_amount_check" CHECK ("totalAmount" > 0 AND "installmentAmount" > 0 AND "installmentCount" > 0)
);

CREATE TABLE "MonthlyCommitment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "category" "TransactionCategory" NOT NULL,
  "recurring" BOOLEAN NOT NULL DEFAULT false,
  "status" "CommitmentStatus" NOT NULL DEFAULT 'PENDING',
  "transactionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MonthlyCommitment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MonthlyCommitment_amount_check" CHECK ("amount" > 0)
);

CREATE INDEX "CreditCard_userId_isActive_isPrimary_idx" ON "CreditCard"("userId", "isActive", "isPrimary");
CREATE UNIQUE INDEX "CardInvoice_cardId_month_key" ON "CardInvoice"("cardId", "month");
CREATE INDEX "CardInvoice_userId_month_idx" ON "CardInvoice"("userId", "month");
CREATE INDEX "InstallmentPlan_userId_startMonth_status_idx" ON "InstallmentPlan"("userId", "startMonth", "status");
CREATE UNIQUE INDEX "MonthlyCommitment_transactionId_key" ON "MonthlyCommitment"("transactionId");
CREATE INDEX "MonthlyCommitment_userId_dueDate_status_idx" ON "MonthlyCommitment"("userId", "dueDate", "status");
ALTER TABLE "CardInvoice" ADD CONSTRAINT "CardInvoice_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CreditCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CreditCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyCommitment" ADD CONSTRAINT "MonthlyCommitment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
