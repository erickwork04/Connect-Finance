export function monthlyBalance(revenue: number, expenses: number, investments: number): number {
  return revenue - expenses - investments;
}

export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function availableAfterCommitments(balance: number, pendingAmounts: number[]): number {
  return balance - pendingAmounts.reduce((sum, amount) => sum + amount, 0);
}

export function outstandingCommitmentAmounts(items: { amount: number; status: "PENDING" | "CONFIRMED" | "PAID"; transactionId: string | null }[]): number[] {
  return items.filter((item) => item.status !== "PAID" && item.transactionId === null).map((item) => item.amount);
}

export function creditLimit(total: number, used: number) {
  return {
    available: total - used,
    percent: total > 0 ? (used / total) * 100 : 0,
  };
}
