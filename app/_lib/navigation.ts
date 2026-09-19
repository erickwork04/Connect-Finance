const YEAR_MONTH_PATTERN = /^(1\d{3}|[2-9]\d{3})-(0[1-9]|1[0-2])$/;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transações" },
  { href: "/cards", label: "Cartões" },
  { href: "/goals", label: "Metas" },
  { href: "/subscription", label: "Assinatura" },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavHref(href: string, month: string | null): string {
  return month && YEAR_MONTH_PATTERN.test(month)
    ? `${href}?month=${month}`
    : href;
}
