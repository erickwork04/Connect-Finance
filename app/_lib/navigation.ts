const YEAR_MONTH_PATTERN = /^(1\d{3}|[2-9]\d{3})-(0[1-9]|1[0-2])$/;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Principal", section: "main" },
  { href: "/transactions", label: "Transações", section: "main" },
  { href: "/banks", label: "Bancos", section: "main" },
  { href: "/cards", label: "Cartão de Crédito", section: "main" },
  { href: "/installments", label: "Compras Parceladas", section: "main" },
  { href: "/goals", label: "Metas", section: "main" },
  { href: "/subscription", label: "Assinatura", section: "settings" },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavHref(href: string, month: string | null): string {
  return month && YEAR_MONTH_PATTERN.test(month)
    ? `${href}?month=${month}`
    : href;
}
