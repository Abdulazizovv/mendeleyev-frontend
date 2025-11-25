"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_CONFIG } from "@/lib/config";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  length?: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  label = "Tasdiqlash kodi",
  length = APP_CONFIG.OTP_LENGTH,
}) => {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [otpValues, setOtpValues] = React.useState<string[]>(
    Array(length)
      .fill("")
      .map((_, i) => value[i] || "")
  );

  React.useEffect(() => {
    onChange(otpValues.join(""));
  }, [otpValues, onChange]);

  const handleChange = (index: number, val: string) => {
    // Only allow digits
    if (!/^\d*$/.test(val)) return;

    const newOtpValues = [...otpValues];

    if (val.length > 1) {
      // Handle paste
      const pastedData = val.slice(0, length);
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < length) {
          newOtpValues[index + i] = pastedData[i];
        }
      }
      setOtpValues(newOtpValues);

      // Focus on the next empty input or last input
      const nextIndex = Math.min(index + pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtpValues[index] = val;
      setOtpValues(newOtpValues);

      // Move to next input if value is entered
      if (val && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtpValues = [...otpValues];

      if (otpValues[index]) {
        // Clear current input
        newOtpValues[index] = "";
        setOtpValues(newOtpValues);
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtpValues = pastedData.split("");
    while (newOtpValues.length < length) {
      newOtpValues.push("");
    }
    setOtpValues(newOtpValues);

    // Focus on the last filled input
    const lastFilledIndex = Math.min(pastedData.length - 1, length - 1);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 justify-center">
        {otpValues.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-12 h-12 text-center text-lg font-semibold ${
              error ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
};
