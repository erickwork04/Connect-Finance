"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CategoryPeriod } from "@/app/_data/get-dashboard";

export default function CategoryFilter({ value }: { value: CategoryPeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return <select aria-label="Período dos gastos por categoria" value={value} onChange={(event) => {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value === "month") params.delete("categoryPeriod");
    else params.set("categoryPeriod", event.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }} className="h-9 max-w-[145px] rounded-lg border border-border bg-[#1c211e] px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
    <option value="month">Este mês</option><option value="three">Últimos 3 meses</option><option value="six">Últimos 6 meses</option><option value="year">Este ano</option>
  </select>;
}
