"use client";

import React, { useState, useEffect } from "react";
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
import { Lock, Eye, EyeOff, AlertTriangle, Clock } from "lucide-react";
import { useFinanceGuard } from "@/lib/stores/financeGuard";
import { toast } from "sonner";

interface PinVerifyModalProps {
  open: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PinVerifyModal({ open, onSuccess, onCancel }: PinVerifyModalProps) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockTime, setBlockTime] = useState(0);
  
  const { verifyPin, failedAttempts, isBlocked, getRemainingBlockTime } = useFinanceGuard();

  // Block timer
  useEffect(() => {
    if (isBlocked()) {
      setBlockTime(getRemainingBlockTime());
      
      const interval = setInterval(() => {
        const remaining = getRemainingBlockTime();
        setBlockTime(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isBlocked, getRemainingBlockTime]);

  const handleVerify = async () => {
    if (isBlocked()) {
      toast.error(`${blockTime} soniya kuting`);
      return;
    }

    if (pin.length !== 6) {
      toast.error("PIN 6 raqamdan iborat bo'lishi kerak");
      return;
    }

    setIsSubmitting(true);

    try {
      const isValid = verifyPin(pin);

      if (isValid) {
        toast.success("PIN kod to'g'ri! Moliya bo'limiga xush kelibsiz");
        setPin("");
        onSuccess();
      } else {
        const attempts = useFinanceGuard.getState().failedAttempts;
        const remaining = 3 - attempts;
        
        if (remaining > 0) {
          toast.error(`Noto'g'ri PIN kod. ${remaining} ta urinish qoldi`);
        } else {
          toast.error("3 ta noto'g'ri urinish. 5 daqiqa kuting");
          setBlockTime(300); // 5 minutes
        }
        
        setPin("");
      }
    } catch (error: any) {
      toast.error(error.message || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPin("");
    onCancel?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Moliya bo&apos;limiga kirish
          </DialogTitle>
          <DialogDescription>
            Davom etish uchun PIN kodni kiriting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Blocked warning */}
          {isBlocked() && blockTime > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Bloklangan</p>
                  <p className="text-sm text-red-700">
                    3 ta noto'g'ri urinish. Iltimos, kuting
                  </p>
                  <p className="text-lg font-mono text-red-900 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTime(blockTime)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed attempts warning */}
          {!isBlocked() && failedAttempts > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {failedAttempts} ta noto'g'ri urinish. {3 - failedAttempts} ta urinish qoldi
                </span>
              </p>
            </div>
          )}

          {/* PIN input */}
          <div className="space-y-2">
            <Label htmlFor="verify-pin">PIN kod (6 raqam)</Label>
            <div className="relative">
              <Input
                id="verify-pin"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pin.length === 6 && !isBlocked()) {
                    handleVerify();
                  }
                }}
                placeholder="000000"
                maxLength={6}
                disabled={isBlocked()}
                className="pr-10 text-lg tracking-widest text-center"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                disabled={isBlocked()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Session 30 daqiqa davom etadi. Keyin qaytadan PIN so&apos;raladi.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleVerify}
            disabled={pin.length !== 6 || isSubmitting || isBlocked()}
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            )}
            Kirish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
