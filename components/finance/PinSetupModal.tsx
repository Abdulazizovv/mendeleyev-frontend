"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { useFinanceGuard } from "@/lib/stores/financeGuard";
import { toast } from "sonner";

interface PinSetupModalProps {
  open: boolean;
  onClose?: () => void;
}

export function PinSetupModal({ open, onClose }: PinSetupModalProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [step, setStep] = useState<"setup" | "confirm">("setup");
  const { setupPin } = useFinanceGuard();

  const handleSetup = () => {
    // Validate PIN
    if (!/^\d{6}$/.test(pin)) {
      toast.error("PIN 6 raqamdan iborat bo'lishi kerak");
      return;
    }

    setStep("confirm");
  };

  const handleConfirm = () => {
    if (pin !== confirmPin) {
      toast.error("PIN kodlar mos kelmadi");
      setConfirmPin("");
      return;
    }

    try {
      setupPin(pin);
      toast.success("PIN kod muvaffaqiyatli o'rnatildi");
      setPin("");
      setConfirmPin("");
      setStep("setup");
      onClose?.();
    } catch (error: any) {
      toast.error(error.message || "Xatolik yuz berdi");
    }
  };

  const handleCancel = () => {
    setPin("");
    setConfirmPin("");
    setStep("setup");
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Moliya bo&apos;limi uchun PIN kod
          </DialogTitle>
          <DialogDescription>
            {step === "setup"
              ? "Moliya bo'limini himoyalash uchun 6 raqamli PIN kod o'rnating"
              : "PIN kodni tasdiqlang"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === "setup" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN kod (6 raqam)</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPin(value);
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="pr-10 text-lg tracking-widest text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Eslatma:</strong> PIN kodni yozib qo&apos;ying. Unutilgan
                    taqdirda faqat super admin qayta tiklashi mumkin.
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">PIN kodni tasdiqlang</Label>
                <div className="relative">
                  <Input
                    id="confirm-pin"
                    type={showPin ? "text" : "password"}
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setConfirmPin(value);
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="pr-10 text-lg tracking-widest text-center"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  PIN kod: <span className="font-mono tracking-wider">{pin}</span>
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Bekor qilish
          </Button>
          {step === "setup" ? (
            <Button onClick={handleSetup} disabled={pin.length !== 6}>
              Davom etish
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={confirmPin.length !== 6}>
              Tasdiqlash
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
