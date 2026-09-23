-- Existing monthly commitments remain unchanged. New recurring definitions own only new occurrences.
CREATE TABLE "RecurringCommitment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "startMonth" VARCHAR(7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecurringCommitment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MonthlyCommitment" ADD COLUMN "recurrenceId" TEXT;
ALTER TABLE "MonthlyCommitment" ADD COLUMN "occurrenceMonth" VARCHAR(7);
ALTER TABLE "MonthlyCommitment" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "RecurringCommitment_userId_startMonth_idx" ON "RecurringCommitment"("userId", "startMonth");
CREATE UNIQUE INDEX "MonthlyCommitment_recurrenceId_occurrenceMonth_key" ON "MonthlyCommitment"("recurrenceId", "occurrenceMonth");

ALTER TABLE "MonthlyCommitment" ADD CONSTRAINT "MonthlyCommitment_recurrenceId_fkey"
  FOREIGN KEY ("recurrenceId") REFERENCES "RecurringCommitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
