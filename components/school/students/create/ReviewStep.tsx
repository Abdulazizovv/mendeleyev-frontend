"use client";

import * as React from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { StudentFormData } from "./schemas";
import type { Class } from "@/types/school";
import { relationshipTypes } from "./constants";

interface ReviewStepProps {
  form: UseFormReturn<StudentFormData>;
  fields: UseFieldArrayReturn<StudentFormData, "relatives", "id">["fields"];
  classes: Class[];
}

export function ReviewStep({ form, fields, classes }: ReviewStepProps) {
  const formValues = form.getValues();
  const selectedClass = classes.find(c => c.id === formValues.class_id);

  const getGenderLabel = (gender: string) => {
    const genderMap: Record<string, string> = {
      male: "Erkak",
      female: "Ayol",
      other: "Boshqa",
      unspecified: "Ko'rsatilmagan",
    };
    return genderMap[gender] || gender;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "Aktiv",
      archived: "Arxivlangan",
      suspended: "Muzlatilgan",
      graduated: "Bitirgan",
      transferred: "O'tkazilgan",
    };
    return statusMap[status] || status;
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="space-y-2 pb-4">
        <CardTitle className="text-2xl font-semibold">5. Ma&apos;lumotlarni tasdiqlash</CardTitle>
        <CardDescription className="text-base">
          Kiritilgan ma&apos;lumotlarni tekshiring va o&apos;quvchini yarating.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Shaxsiy ma'lumotlar</h3>
          <div className="rounded-lg border divide-y">
            <div className="grid grid-cols-3 gap-4 p-3">
              <p className="text-base text-muted-foreground">To'liq ism:</p>
              <p className="col-span-2 text-base font-medium">
                {[formValues.first_name, formValues.last_name, formValues.middle_name]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 p-3">
              <p className="text-base text-muted-foreground">Telefon:</p>
              <p className="col-span-2 text-base font-medium">
                {formValues.phone_number || "—"}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 p-3">
              <p className="text-base text-muted-foreground">Jins:</p>
              <p className="col-span-2 text-base font-medium">
                {getGenderLabel(formValues.gender)}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 p-3">
              <p className="text-base text-muted-foreground">Tug'ilgan sana:</p>
              <p className="col-span-2 text-base font-medium">
                {formValues.date_of_birth || "Kiritilmagan"}
              </p>
            </div>

            {formValues.address && (
              <div className="grid grid-cols-3 gap-4 p-3">
                <p className="text-base text-muted-foreground">Manzil:</p>
                <p className="col-span-2 text-base font-medium">
                  {formValues.address}
                </p>
              </div>
            )}

            {formValues.email && (
              <div className="grid grid-cols-3 gap-4 p-3">
                <p className="text-base text-muted-foreground">Email:</p>
                <p className="col-span-2 text-base font-medium">
                  {formValues.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Academic Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Akademik ma'lumotlar</h3>
          <div className="rounded-lg border divide-y">
            <div className="grid grid-cols-3 gap-4 p-3">
              <p className="text-base text-muted-foreground">Holat:</p>
              <p className="col-span-2 text-base font-medium">
                {getStatusLabel(formValues.status)}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 p-3">
              <p className="text-base text-muted-foreground">Sinf:</p>
              <p className="col-span-2 text-base font-medium">
                {selectedClass?.name 
                  ? `${selectedClass.name} (${selectedClass.academic_year_name})`
                  : "Biriktirilmagan"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Relatives */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">
            Yaqinlari ({fields.length})
          </h3>
          {fields.length > 0 ? (
            <div className="space-y-2">
              {fields.map((relative) => (
                <div 
                  key={relative.id} 
                  className="p-4 border rounded-lg space-y-1"
                >
                  <p className="font-medium text-base">
                    {[relative.first_name, relative.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {relationshipTypes.find(
                        rt => rt.value === relative.relationship_type
                      )?.label}
                    </span>
                    {relative.phone_number && (
                      <>
                        <span>•</span>
                        <span>{relative.phone_number}</span>
                      </>
                    )}
                  </div>
                  {(relative.is_primary_contact || relative.is_guardian) && (
                    <div className="flex gap-1.5 mt-1.5">
                      {relative.is_primary_contact && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700">
                          Asosiy kontakt
                        </span>
                      )}
                      {relative.is_guardian && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-purple-100 text-purple-700">
                          Vasiy
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-base text-muted-foreground p-4 bg-muted/50 rounded-lg border border-dashed">
              Yaqinlar qo'shilmagan.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
