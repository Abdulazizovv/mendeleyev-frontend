"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentFormData } from "./schemas";
import type { Class } from "@/types/school";

interface AcademicStepProps {
  form: UseFormReturn<StudentFormData>;
  classes: Class[];
}

export function AcademicStep({ form, classes }: AcademicStepProps) {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="space-y-2 pb-4">
        <CardTitle className="text-2xl font-semibold">4. Akademik ma&apos;lumotlar</CardTitle>
        <CardDescription className="text-base">
          Filialdagi holati va sinfga biriktirish.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <h3 className="text-base font-medium text-muted-foreground uppercase tracking-wide">O'quvchi holati</h3>
          <FormField 
            control={form.control} 
            name="status" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Holat</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-12 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="archived">Arxivlangan</SelectItem>
                    <SelectItem value="suspended">Muzlatilgan</SelectItem>
                    <SelectItem value="graduated">Bitirgan</SelectItem>
                    <SelectItem value="transferred">O&apos;tkazilgan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} 
          />
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-base font-medium text-muted-foreground uppercase tracking-wide">Sinf biriktirilishi</h3>
          <FormField 
            control={form.control} 
            name="class_id" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Sinf</FormLabel>
                <Select 
                  value={field.value || ""} 
                  onValueChange={(value) => field.onChange(value || "")}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 text-lg">
                      <SelectValue placeholder="Sinfni tanlang (ixtiyoriy)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <SelectItem value="no-classes" disabled>
                        Sinflar topilmadi
                      </SelectItem>
                    ) : (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.academic_year_name})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription className="text-sm">
                  Sinfni keyinroq ham biriktirish mumkin.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
