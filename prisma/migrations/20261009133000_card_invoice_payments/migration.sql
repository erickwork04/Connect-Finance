ALTER TABLE "CardInvoice"
ADD COLUMN "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE "CardInvoice"
SET "paidAmount" = "amount"
WHERE "status" = 'PAID';

ALTER TABLE "CardInvoice"
ADD CONSTRAINT "CardInvoice_paidAmount_check"
CHECK ("paidAmount" >= 0 AND "paidAmount" <= "amount");
