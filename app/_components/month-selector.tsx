"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { resolveYearMonth } from "@/app/_lib/month-range";
import MonthPicker from "./month-picker";

export default function MonthSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = resolveYearMonth(searchParams.get("month"));

  return <MonthPicker value={month} label="Mês financeiro" className="w-full" onChange={(selected) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", selected);
    router.push(`${pathname}?${params.toString()}`);
  }} />;
}
