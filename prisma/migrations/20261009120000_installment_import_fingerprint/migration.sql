ALTER TABLE "InstallmentPlan" ADD COLUMN "sourceImportHash" TEXT;
CREATE UNIQUE INDEX "InstallmentPlan_sourceImportHash_key" ON "InstallmentPlan"("sourceImportHash");
