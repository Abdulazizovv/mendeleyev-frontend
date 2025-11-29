"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");

  // If empty, return empty
  if (digits.length === 0) return "";

  // Extract the actual phone digits (skip 998 prefix if present)
  let phoneDigits = digits;
  if (digits.startsWith("998") && digits.length > 3) {
    phoneDigits = digits.substring(3);
  }

  // Format: +998 (XX) XXX-XX-XX
  let formatted = "+998";

  if (phoneDigits.length > 0) {
    formatted += ` (${phoneDigits.substring(0, 2)}`;
  }
  if (phoneDigits.length > 2) {
    formatted += `) ${phoneDigits.substring(2, 5)}`;
  }
  if (phoneDigits.length > 5) {
    formatted += `-${phoneDigits.substring(5, 7)}`;
  }
  if (phoneDigits.length > 7) {
    formatted += `-${phoneDigits.substring(7, 9)}`;
  }

  return formatted;
};

const unformatPhoneNumber = (value: string): string => {
  // Keep only digits
  const digits = value.replace(/\D/g, "");
  
  // Extract phone digits (skip 998 prefix if present)
  let phoneDigits = digits;
  if (digits.startsWith("998") && digits.length > 3) {
    phoneDigits = digits.substring(3);
  }
  
  return `+998${phoneDigits}`;
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  label = "Telefon raqami",
  placeholder = "+998 (XX) XXX-XX-XX",
  required = false,
}) => {
  const [displayValue, setDisplayValue] = React.useState(() => formatPhoneNumber(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, "");

    // Extract phone digits (skip 998 prefix if present)
    let phoneDigits = digits;
    if (digits.startsWith("998") && digits.length > 3) {
      phoneDigits = digits.substring(3);
    }

    // Limit to 9 digits (after 998 prefix)
    if (phoneDigits.length <= 9) {
      const formatted = formatPhoneNumber(input);
      setDisplayValue(formatted);
      onChange(unformatPhoneNumber(input));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl/cmd+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: Ctrl/cmd+C
      (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: Ctrl/cmd+V
      (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: Ctrl/cmd+X
      (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="phone-input" className="text-lg font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        id="phone-input"
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-12 text-lg ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
        required={required}
      />
      {error && <p className="text-base text-red-500 mt-1.5">{error}</p>}
    </div>
  );
};
