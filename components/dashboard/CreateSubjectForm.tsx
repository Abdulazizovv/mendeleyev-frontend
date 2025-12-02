"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { schoolApi } from "@/lib/api";
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
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

// Validation schema
const subjectSchema = z.object({
  name: z.string().min(1, "Fan nomi majburiy"),
  code: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Rang formati #RRGGBB bo'lishi kerak")
    .optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

interface CreateSubjectFormProps {
  branchId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateSubjectForm({ branchId, onSuccess, onCancel }: CreateSubjectFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      is_active: true,
      color: "#3b82f6", // default blue-500
    },
  });

  const onSubmit = async (data: SubjectFormValues) => {
    try {
      setIsSubmitting(true);

      // Clean up empty strings
      const payload = {
        name: data.name.trim(),
        code: data.code?.trim() || undefined,
        description: data.description?.trim() || undefined,
        is_active: data.is_active,
        color: data.color?.trim() || undefined,
      };

      await schoolApi.createSubject(branchId, payload);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to create subject:", error);
      
      // Handle validation errors
      if (error.response?.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach((key) => {
          if (key in form.formState.errors) {
            form.setError(key as keyof SubjectFormValues, {
              type: "manual",
              message: Array.isArray(errors[key]) ? errors[key][0] : errors[key],
            });
          }
        });
      }
      
      toast.error("Fanni yaratishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
