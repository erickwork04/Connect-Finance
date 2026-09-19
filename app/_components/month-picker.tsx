"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { formatYearMonthPtBr } from "@/app/_lib/month-range";

const monthNameFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

interface MonthPickerProps {
  value: string;
  onChange: (month: string) => void;
  label: string;
  className?: string;
  name?: string;
}

export default function MonthPicker({ value, onChange, label, className = "", name }: MonthPickerProps) {
  const selectedYear = Number(value.slice(0, 4));
  const [viewYear, setViewYear] = useState(selectedYear);
  const [open, setOpen] = useState(false);

  return <Popover open={open} onOpenChange={(nextOpen) => {
    if (nextOpen) setViewYear(selectedYear);
    setOpen(nextOpen);
  }}>
    {name ? <input type="hidden" name={name} value={value} /> : null}
    <PopoverTrigger asChild>
      <button type="button" aria-label={label} aria-expanded={open} className={`flex h-11 min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-white/[.03] px-3 text-sm text-foreground transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}>
        <span className="flex min-w-0 items-center gap-2"><CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{formatYearMonthPtBr(value)}</span></span>
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-[min(18rem,calc(100vw-2rem))] p-3">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Ano anterior" disabled={viewYear <= 1000} onClick={() => setViewYear((year) => year - 1)} className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        <span className="font-semibold tabular-nums">{viewYear}</span>
        <button type="button" aria-label="Próximo ano" disabled={viewYear >= 9999} onClick={() => setViewYear((year) => year + 1)} className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div role="group" aria-label={`Meses de ${viewYear}`} className="grid grid-cols-3 gap-1">
        {Array.from({ length: 12 }, (_, index) => {
          const month = `${viewYear}-${String(index + 1).padStart(2, "0")}`;
          return <button key={month} type="button" aria-pressed={month === value} onClick={() => { onChange(month); setOpen(false); }} className="min-h-11 rounded-md px-1 text-sm capitalize hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary aria-pressed:bg-primary aria-pressed:font-semibold aria-pressed:text-primary-foreground">
            {monthNameFormatter.format(new Date(Date.UTC(viewYear, index, 1)))}
          </button>;
        })}
      </div>
    </PopoverContent>
  </Popover>;
}
