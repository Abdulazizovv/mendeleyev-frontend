"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { schoolApi } from "@/lib/api";
import type { Subject } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, X, BookOpen, Code, FileText } from "lucide-react";
import { toast } from "sonner";

// Validation schema - same as create but all fields can be updated
const editSubjectSchema = z.object({
  name: z.string().min(1, "Fan nomi majburiy"),
  code: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Rang formati #RRGGBB bo'lishi kerak")
    .optional(),
});

type EditSubjectFormValues = z.infer<typeof editSubjectSchema>;

interface EditSubjectFormProps {
  branchId: string;
  subject: Subject;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditSubjectForm({ branchId, subject, onSuccess, onCancel }: EditSubjectFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditSubjectFormValues>({
    resolver: zodResolver(editSubjectSchema),
    defaultValues: {
      name: subject.name,
      code: subject.code || "",
      description: subject.description || "",
      is_active: subject.is_active,
      color: subject.color || "#3b82f6",
    },
  });

  const onSubmit = async (data: EditSubjectFormValues) => {
    try {
      setIsSubmitting(true);

      // Clean up and prepare payload
      const payload = {
        name: data.name.trim(),
        code: data.code?.trim() || undefined,
        description: data.description?.trim() || undefined,
        is_active: data.is_active,
        color: data.color?.trim() || undefined,
      };

      await schoolApi.updateSubject(branchId, subject.id, payload);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to update subject:", error);
      
      // Handle validation errors
      if (error.response?.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach((key) => {
          if (key in form.formState.errors) {
            form.setError(key as keyof EditSubjectFormValues, {
              type: "manual",
              message: Array.isArray(errors[key]) ? errors[key][0] : errors[key],
            });
          }
        });
      }
      
      toast.error("Fanni yangilashda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Asosiy ma'lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Fan nomi <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Matematika"
                      {...field}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fan kodi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MATH"
                      {...field}
                      disabled={isSubmitting}
                      className="h-11 font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Fan uchun qisqa kod (ixtiyoriy)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Description Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Qo'shimcha ma'lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tavsif</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Fan haqida qisqacha ma'lumot..."
                      {...field}
                      disabled={isSubmitting}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormDescription>
                    Fan haqida qo'shimcha ma'lumot (ixtiyoriy)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

              {/* Color */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rang</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={field.value || "#3b82f6"}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isSubmitting}
                          className="h-11 w-16 rounded-md border p-1"
                        />
                        <Input
                          placeholder="#RRGGBB"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isSubmitting}
                          className="h-11 font-mono"
                        />
                        <div
                          className="h-11 w-11 rounded-md border"
                          style={{ backgroundColor: field.value || "#3b82f6" }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Jadval va UI da fanni ajratib ko'rsatish uchun rang
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            {/* Is Active */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Faol fan</FormLabel>
                    <FormDescription>
                      Bu fanni darslar jadvalida ishlatish mumkin
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            Bekor qilish
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Saqlash
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
