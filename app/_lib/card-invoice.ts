export function invoiceRemainingAmount(
  amount: number,
  paidAmount: number,
  status: "OPEN" | "PAID",
): number {
  if (status === "PAID") return 0;
  const totalCents = Math.round(amount * 100);
  const paidCents = Math.round(paidAmount * 100);
  return Math.max(0, totalCents - paidCents) / 100;
}

export function applyInvoicePayment(
  amount: number,
  paidAmount: number,
  payment: number,
): { paidAmount: number; status: "OPEN" | "PAID" } | null {
  const totalCents = Math.round(amount * 100);
  const currentPaidCents = Math.round(paidAmount * 100);
  const paymentCents = Math.round(payment * 100);

  if (
    !Number.isSafeInteger(totalCents) ||
    !Number.isSafeInteger(currentPaidCents) ||
    !Number.isSafeInteger(paymentCents) ||
    paymentCents <= 0 ||
    currentPaidCents < 0 ||
    currentPaidCents > totalCents ||
    paymentCents > totalCents - currentPaidCents
  ) {
    return null;
  }

  const updatedPaidCents = currentPaidCents + paymentCents;
  return {
    paidAmount: updatedPaidCents / 100,
    status: updatedPaidCents === totalCents ? "PAID" : "OPEN",
  };
}
