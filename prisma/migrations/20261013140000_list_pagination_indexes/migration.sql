CREATE INDEX "Transaction_userId_date_createdAt_id_idx"
  ON "Transaction"("userId", "date", "createdAt", "id");

CREATE INDEX "CreditCard_userId_isActive_isPrimary_createdAt_idx"
  ON "CreditCard"("userId", "isActive", "isPrimary", "createdAt");

CREATE INDEX "CardInvoice_userId_status_cardId_idx"
  ON "CardInvoice"("userId", "status", "cardId");

CREATE INDEX "InstallmentPlan_userId_status_startMonth_createdAt_idx"
  ON "InstallmentPlan"("userId", "status", "startMonth", "createdAt");

CREATE INDEX "MonthlyCommitment_userId_dueDate_createdAt_idx"
  ON "MonthlyCommitment"("userId", "dueDate", "createdAt");
