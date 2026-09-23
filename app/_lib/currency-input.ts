const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function centsFromDigits(input: string): number | undefined {
  const digits = input.replace(/\D/g, "");
  if (!digits) return undefined;
  const cents = Number(digits);
  return Number.isSafeInteger(cents) ? cents : undefined;
}

export function centsFromAmount(amount: number | undefined | null): number | undefined {
  if (amount === undefined || amount === null || !Number.isFinite(amount) || amount < 0) return undefined;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : undefined;
}

export function formatCurrencyCents(cents: number | undefined): string {
  return cents === undefined ? "" : formatter.format(cents / 100).replace(/\u00a0/g, " ");
}

export function decimalFromCents(cents: number | undefined): string {
  return cents === undefined ? "" : (cents / 100).toFixed(2);
}

export function appendCurrencyDigit(cents: number | undefined, digit: string): number | undefined {
  if (!/^\d$/.test(digit)) return cents;
  const next = (cents ?? 0) * 10 + Number(digit);
  return Number.isSafeInteger(next) ? next : cents;
}
