"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/app/_lib/utils";
import { isDayOfMonth, selectDayOfMonth } from "@/app/_lib/day-of-month";

export function DayOfMonthPicker({ value, onChange, name, label, disabled = false, className }: {
  value?: number; onChange: (day: number) => void; name?: string; label: string; disabled?: boolean; className?: string;
}) {
  const [open, setOpen] = useState(false);
  return <>
    {name && <input type="hidden" name={name} value={isDayOfMonth(value) ? String(value) : ""} />}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><button type="button" disabled={disabled} aria-label={label} aria-haspopup="dialog" aria-expanded={open}
        className={cn("flex h-11 w-full min-w-0 items-center justify-between rounded-lg border border-border bg-background px-3 text-left text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50", className)}>
        <span>{isDayOfMonth(value) ? `Dia ${value}` : "Selecione o dia"}</span><CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button></PopoverTrigger>
      <PopoverContent align="start" collisionPadding={8} className="w-[min(19rem,calc(100vw-1rem))] p-3">
        <p className="mb-2 text-sm font-medium">{label}</p>
        <div role="group" aria-label="Dias do mês" className="grid grid-cols-7 gap-1">
          {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <button type="button" key={day}
            aria-label={`Dia ${day}`} aria-pressed={value === day}
            className={cn("flex h-9 items-center justify-center rounded-md text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", value === day && "bg-primary font-semibold text-primary-foreground hover:bg-primary/90")}
            onClick={() => { const selected = selectDayOfMonth(value, day); if (selected !== undefined) onChange(selected); setOpen(false); }}>{day}</button>)}
        </div>
      </PopoverContent>
    </Popover>
  </>;
}
