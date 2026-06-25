"use client";

import * as React from "react";
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

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  label = "Telefon raqami",
  placeholder = "XX XXX XX XX",
  required = false,
}) => {
  // Extract only the 9 digits after +998
  const getDigits = (v: string) => v.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);

  const [digits, setDigits] = React.useState(() => getDigits(value));

  // Sync when parent resets/changes value
  React.useEffect(() => {
    const d = getDigits(value);
    setDigits(d);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 9);
    setDigits(raw);
    onChange(`+998${raw}`);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor="phone-input" className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div
        className={`flex h-12 rounded-xl border overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400 ${
          error
            ? "border-red-400 focus-within:ring-red-400 focus-within:border-red-400"
            : "border-gray-200"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {/* Static +998 prefix */}
        <div className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 shrink-0 select-none">
          <span className="text-base font-semibold text-gray-700">+998</span>
        </div>

        {/* Digit input */}
        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="tel-national"
          value={digits}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={9}
          className="flex-1 px-3 text-base bg-white focus:outline-none placeholder:text-gray-300 font-medium tracking-wide"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
