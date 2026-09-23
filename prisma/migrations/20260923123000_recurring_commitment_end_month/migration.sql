-- A nullable end month leaves existing recurring definitions active.
ALTER TABLE "RecurringCommitment" ADD COLUMN "endMonth" VARCHAR(7);
