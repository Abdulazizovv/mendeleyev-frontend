"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatDigitsWithSpaces(value: number): string {
  const digits = Math.max(0, Math.trunc(value)).toString();
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseDigits(raw: string): number {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) return 0;
  const asNumber = Number(digitsOnly);
  return Number.isFinite(asNumber) ? asNumber : 0;
}

export function CurrencyInput(props: {
  id?: string;
  value: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  max?: number;
  className?: string;
}) {
  const { value, onValueChange, max, className, ...rest } = props;
  const [focused, setFocused] = React.useState(false);
  const [display, setDisplay] = React.useState(() => formatDigitsWithSpaces(value));

  React.useEffect(() => {
    if (focused) return;
    setDisplay(formatDigitsWithSpaces(value));
  }, [value, focused]);

  return (
    <div className="relative">
      <Input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setDisplay(formatDigitsWithSpaces(value));
        }}
        onChange={(e) => {
          const next = parseDigits(e.target.value);
          const clamped = typeof max === "number" ? Math.min(next, Math.max(0, max)) : next;
          setDisplay(formatDigitsWithSpaces(clamped));
          onValueChange(clamped);
        }}
        className={cn("pr-14", className)}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        so&apos;m
      </span>
    </div>
  );
}

