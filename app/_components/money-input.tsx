"use client";

import { forwardRef, useRef, type ComponentPropsWithoutRef } from "react";
import { Input } from "./ui/input";
import { appendCurrencyDigit, centsFromAmount, centsFromDigits, decimalFromCents, formatCurrencyCents } from "@/app/_lib/currency-input";
import { cn } from "@/app/_lib/utils";

type CurrencyInputProps = Omit<ComponentPropsWithoutRef<typeof Input>, "type" | "value" | "onChange" | "name"> & {
  value?: number | null;
  onChange: (value: number | undefined) => void;
  name?: string;
  error?: boolean;
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { value, onChange, name, error, className, onKeyDown, onPaste, onFocus, onClick, placeholder = "R$ 0,00", ...props }, ref,
) {
  const internalRef = useRef<HTMLInputElement | null>(null);
  const cents = centsFromAmount(value);
  const update = (next: number | undefined) => onChange(next === undefined ? undefined : next / 100);
  const atEnd = () => {
    const input = internalRef.current;
    if (input) requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
  };
  return <>
    {name && <input type="hidden" name={name} value={decimalFromCents(cents)} />}
    <Input
      {...props}
      className={cn(className, error && "border-rose-500 focus-visible:ring-rose-500")}
      ref={(node) => { internalRef.current = node; if (typeof ref === "function") ref(node); else if (ref) ref.current = node; }}
      type="text" inputMode="numeric" autoComplete="off" aria-invalid={error || undefined}
      value={formatCurrencyCents(cents)} placeholder={placeholder}
      onFocus={(event) => { atEnd(); onFocus?.(event); }}
      onClick={(event) => { atEnd(); onClick?.(event); }}
      onKeyDown={(event) => {
        if (/^\d$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          const selected = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === event.currentTarget.value.length;
          update(appendCurrencyDigit(selected ? undefined : cents, event.key));
        } else if (event.key === "Backspace" || event.key === "Delete") {
          event.preventDefault();
          const selected = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === event.currentTarget.value.length;
          update(selected || event.key === "Delete" || cents === undefined || cents < 10 ? undefined : Math.floor(cents / 10));
        }
        onKeyDown?.(event);
      }}
      onPaste={(event) => {
        event.preventDefault();
        update(centsFromDigits(event.clipboardData.getData("text")));
        onPaste?.(event);
      }}
      onChange={(event) => update(centsFromDigits(event.currentTarget.value))}
    />
  </>;
});

export const MoneyInput = CurrencyInput;
