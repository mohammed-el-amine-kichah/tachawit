"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Radix items can't have an empty value, so "nothing chosen" travels as this stand-in.
const NONE = "__none__";

/**
 * A styled dropdown for admin forms. With `noneLabel`, the empty value ("") is offered as a
 * first choice under that label.
 */
export function ChoiceSelect<T extends string>({
  id,
  value,
  onChange,
  options,
  noneLabel,
  disabled,
  dir,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: T | "";
  onChange: (value: T | "") => void;
  options: readonly { value: T; label: string }[];
  noneLabel?: string;
  disabled?: boolean;
  /** For choices written in one direction whatever the UI language (Tachawit words). */
  dir?: "ltr" | "rtl";
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Select value={value === "" ? NONE : value} onValueChange={(next) => onChange(next === NONE ? "" : (next as T))} disabled={disabled} dir={dir}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn("w-full bg-background data-[size=default]:h-10", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        {noneLabel !== undefined && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
