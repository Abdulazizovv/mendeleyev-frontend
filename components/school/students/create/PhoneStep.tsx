"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { PhoneInput } from "@/components/auth/PhoneInput";
import type { StudentFormData } from "./schemas";
import type { StudentPhoneCheckResponse } from "@/types/school";
import type { PhoneLookupStatus } from "@/lib/hooks/usePhoneLookup";

interface PhoneStepProps {
  form: UseFormReturn<StudentFormData>;
  phoneLookupStatus: PhoneLookupStatus;
  phoneLookupResult: StudentPhoneCheckResponse | null;
}

export function PhoneStep({ form, phoneLookupStatus, phoneLookupResult }: PhoneStepProps) {
  const renderPhoneLookupBanner = () => {
    const statusMap: Record<PhoneLookupStatus, { icon: React.ElementType | (() => null); color: string; text: string; spin?: boolean }> = {
      checking: { 
        icon: Loader2, 
        color: "text-blue-700 border-blue-200 bg-blue-50", 
        text: "Tekshirilmoqda...", 
        spin: true 
      },
      "exists-in-branch": { 
        icon: AlertCircle, 
        color: "text-red-700 border-red-200 bg-red-50", 
        text: "Bu o'quvchi filialda mavjud." 
      },
      "exists-in-other": { 
        icon: Info, 
        color: "text-blue-700 border-blue-200 bg-blue-50", 
        text: "Raqam boshqa filialda topildi. Ma'lumotlar to'ldirildi." 
      },
      available: { 
        icon: CheckCircle2, 
        color: "text-green-700 border-green-200 bg-green-50", 
        text: "Raqam bo'sh. Yangi o'quvchi yaratish mumkin." 
      },
      error: { 
        icon: AlertCircle, 
        color: "text-red-700 border-red-200 bg-red-50", 
        text: "Tekshirishda xatolik." 
      },
      idle: { 
        icon: () => null, 
        color: "", 
        text: "" 
      }
    };

    if (phoneLookupStatus === "idle") {
      return (
        <p className="text-sm text-muted-foreground mt-2">
          Tizim raqamni avtomatik tekshiradi.
        </p>
      );
    }

    const { icon: Icon, color, text, spin } = statusMap[phoneLookupStatus];
    
    return (
      <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm mt-3 ${color}`}>
        <Icon className={`w-4 h-4 flex-shrink-0 ${spin ? "animate-spin" : ""}`} />
        <span>{text}</span>
      </div>
    );
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="space-y-2 pb-4">
        <CardTitle className="text-2xl font-semibold">1. Telefon raqamini kiriting</CardTitle>
        <CardDescription className="text-base">
          O&apos;quvchining telefon raqami tizimda mavjudligini tekshirish uchun.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Telefon raqami *</FormLabel>
              <FormControl>
                <div className="w-full">
                  <PhoneInput 
                    value={field.value} 
                    onChange={field.onChange} 
                    error={form.formState.errors.phone_number?.message} 
                    required
                    label=""
                  />
                </div>
              </FormControl>
              {renderPhoneLookupBanner()}
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
