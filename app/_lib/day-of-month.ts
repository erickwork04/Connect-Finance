export function isDayOfMonth(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 31;
}

export function selectDayOfMonth(current: number | undefined, next: number): number | undefined {
  return isDayOfMonth(next) ? next : current;
}
