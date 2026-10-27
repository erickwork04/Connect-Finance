import test from "node:test";
import assert from "node:assert/strict";
import { persistImportBatch } from "./persist-import-batch.ts";

function makeClient(existingHashes = []) {
  const calls = [];
  const record = (name) => async (args) => {
    calls.push({ name, args });
    if (name === "installmentPlan.findMany") return existingHashes.map((sourceImportHash) => ({ sourceImportHash }));
    return { count: args?.data?.length ?? 1 };
  };
  return {
    calls,
    tx: {
      importBatch: { create: record("importBatch.create") },
      transaction: { createMany: record("transaction.createMany") },
      installmentPlan: {
        findMany: record("installmentPlan.findMany"),
        createMany: record("installmentPlan.createMany"),
      },
      monthlyCommitment: { createMany: record("monthlyCommitment.createMany") },
    },
  };
}

function makeRows(count) {
  return Array.from({ length: count }, (_, index) => ({
    name: `Compra parcelada ${index}`,
    amount: 19.9,
    type: "EXPENSE",
    category: "OTHER",
    paymentMethod: "CREDIT_CARD",
    date: new Date("2026-10-10T12:00:00.000Z"),
    userId: "synthetic-user",
    source: "CARD_INVOICE",
    importHash: `synthetic-hash-${index}`,
    importBatchId: "synthetic-batch",
    installmentInfo: { description: `Compra ${index}`, current: 2, total: 10 },
  }));
}

const inputFor = (rows) => ({
  userId: "synthetic-user",
  batchId: "synthetic-batch",
  fileName: "synthetic-invoice.csv",
  source: "CARD_INVOICE",
  rows,
  invoiceMonth: "2026-10",
  shiftYearMonth: (month, offset) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  },
  monthlyDueDate: (month, day) => {
    const [year, monthNumber] = month.split("-").map(Number);
    return new Date(Date.UTC(year, monthNumber - 1, day));
  },
});

test("batch persistence keeps Prisma operation count constant for 1, 10 and 50 installments", async () => {
  for (const count of [1, 10, 50]) {
    const client = makeClient();
    const result = await persistImportBatch(client.tx, inputFor(makeRows(count)));
    assert.equal(result.installmentsAdded, count);
    assert.equal(client.calls.length, 5);
    assert.deepEqual(client.calls.map(({ name }) => name).sort(), [
      "importBatch.create",
      "installmentPlan.createMany",
      "installmentPlan.findMany",
      "monthlyCommitment.createMany",
      "transaction.createMany",
    ]);

    const oldPerRowOperations = 1 + count * 4;
    assert.equal(oldPerRowOperations, 1 + count * 4);
    assert.ok(client.calls.length < oldPerRowOperations || count === 1);
  }
});

test("existing and repeated installment hashes do not create duplicate plans or commitments", async () => {
  const rows = makeRows(3);
  rows[1].importHash = "existing-plan";
  rows[2].importHash = rows[0].importHash;
  const client = makeClient(["existing-plan"]);

  const result = await persistImportBatch(client.tx, inputFor(rows));

  assert.equal(result.installmentsAdded, 1);
  assert.equal(client.calls.find(({ name }) => name === "transaction.createMany").args.data.length, 3);
  assert.equal(client.calls.find(({ name }) => name === "installmentPlan.createMany").args.data.length, 1);
  assert.equal(client.calls.find(({ name }) => name === "monthlyCommitment.createMany").args.data.length, 1);
});
