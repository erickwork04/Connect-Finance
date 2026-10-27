export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const MAX_PAGE_SIZE = 100;

export type PaginationState = { page: number; pageSize: number };

function positiveInteger(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parsePagination(pageValue?: string | string[], sizeValue?: string | string[]): PaginationState {
  const requestedSize = positiveInteger(sizeValue);
  const pageSize = requestedSize && PAGE_SIZE_OPTIONS.includes(requestedSize as (typeof PAGE_SIZE_OPTIONS)[number])
    ? requestedSize
    : DEFAULT_PAGE_SIZE;
  return { page: positiveInteger(pageValue) ?? 1, pageSize };
}

export function getPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(page: number, total: number, pageSize: number): number {
  return Math.min(page, getPageCount(total, pageSize));
}

export function updatePaginationQuery(current: string, updates: Record<string, string | null>): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
  }
  return params.toString();
}
