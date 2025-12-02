"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { schoolApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { toast } from "sonner";
import { handleApiError } from "@/lib/api/client";
import { Loader2, Save, X, User, GraduationCap, Phone, Calendar, MapPin, FileText } from "lucide-react";
import type { CreateStudentRequest, Class, Student } from "@/types/school";
import { z } from "zod";

interface EditStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  classes?: Class[];
  student: Student;
}

const editStudentSchema = z.object({
  first_name: z.string().min(1, "Ism majburiy"),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  email: z.string().email("Noto'g'ri email").optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", "unspecified"]),
  status: z.enum(["active", "archived", "suspended", "graduated", "transferred"]),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  class_id: z.string().optional(),
  passport_number: z.string().optional(),
  nationality: z.string().optional(),
  passport_issued_date: z.string().optional(),
  passport_expiry_date: z.string().optional(),
});

type EditStudentFormData = z.infer<typeof editStudentSchema>;

const ensureArray = <T,>(value: T[] | undefined | null): T[] => 
  Array.isArray(value) ? value : [];

export function EditStudentForm({ 
  open, 
  onOpenChange, 
  onSuccess, 
  classes,
  student 
}: EditStudentFormProps) {
  const { currentBranch } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const classesArray = React.useMemo(() => ensureArray(classes), [classes]);

  const form = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      middle_name: student.middle_name || "",
      email: student.email || "",
      gender: student.gender || "unspecified",
      status: student.status || "active",
      date_of_birth: student.date_of_birth || "",
      address: student.address || "",
      class_id: student.current_class?.id || "",
      passport_number: student.additional_fields?.passport_number || "",
      nationality: student.additional_fields?.nationality || "",
      passport_issued_date: student.additional_fields?.passport_issued_date || "",
      passport_expiry_date: student.additional_fields?.passport_expiry_date || "",
    },
  });

  // Reset form when student changes
  React.useEffect(() => {
    if (open && student) {
      form.reset({
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        middle_name: student.middle_name || "",
        email: student.email || "",
        gender: student.gender || "unspecified",
        status: student.status || "active",
        date_of_birth: student.date_of_birth || "",
        address: student.address || "",
        class_id: student.current_class?.id || "",
        passport_number: student.additional_fields?.passport_number || "",
        nationality: student.additional_fields?.nationality || "",
        passport_issued_date: student.additional_fields?.passport_issued_date || "",
        passport_expiry_date: student.additional_fields?.passport_expiry_date || "",
      });
    }
  }, [open, student, form]);

  const handleSubmit = async (data: EditStudentFormData) => {
    if (!currentBranch?.branch_id) {
      return toast.error("Filial tanlanmagan");
    }

    setIsSubmitting(true);
    try {
      const requestData: Partial<CreateStudentRequest> = {
        first_name: data.first_name,
        last_name: data.last_name || undefined,
        middle_name: data.middle_name || undefined,
        email: data.email || undefined,
        gender: data.gender !== "unspecified" ? data.gender : undefined,
        status: data.status,
        date_of_birth: data.date_of_birth || undefined,
        address: data.address || undefined,
        class_id: data.class_id || undefined,
        additional_fields: {
          ...(student.additional_fields || {}),
          ...(data.passport_number && { passport_number: data.passport_number }),
          ...(data.nationality && { nationality: data.nationality }),
          ...(data.passport_issued_date && { passport_issued_date: data.passport_issued_date }),
          ...(data.passport_expiry_date && { passport_expiry_date: data.passport_expiry_date }),
        },
      };

      await schoolApi.updateStudent(currentBranch.branch_id, student.id, requestData);
      toast.success("O'quvchi ma'lumotlari muvaffaqiyatli yangilandi!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(apiError.message || "O'quvchi ma'lumotlarini yangilashda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isSubmitting) {
      onOpenChange(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: "Aktiv", color: "text-green-700" },
      archived: { label: "Arxivlangan", color: "text-gray-700" },
      suspended: { label: "Muzlatilgan", color: "text-red-700" },
      graduated: { label: "Bitirgan", color: "text-blue-700" },
      transferred: { label: "O'tkazilgan", color: "text-orange-700" },
    };
    return statusMap[status] || { label: status, color: "text-gray-700" };
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                O'quvchi ma'lumotlarini tahrirlash
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {student.full_name} ma'lumotlarini yangilang
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Shaxsiy ma'lumotlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Phone Number - Read Only */}
                    <div className="md:col-span-2">
                      <FormLabel className="text-base font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefon raqami
                      </FormLabel>
                      <Input
                        value={student.phone_number}
                        disabled
                        className="mt-2 h-12 text-lg bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Telefon raqamini o'zgartirib bo'lmaydi</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Ism *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ali"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Familiya</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Valiyev"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="middle_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Otasining ismi</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Olim o'g'li"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="ali@example.com"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Jins *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-lg">
                                <SelectValue placeholder="Tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Erkak</SelectItem>
                              <SelectItem value="female">Ayol</SelectItem>
                              <SelectItem value="other">Boshqa</SelectItem>
                              <SelectItem value="unspecified">Ko'rsatilmagan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Tug'ilgan sana
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Manzil
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Toshkent shahri, Chilonzor tumani"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    Akademik ma'lumotlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="class_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Sinf</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 text-lg">
                                <SelectValue placeholder="Sinfga biriktirilmagan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classesArray.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Holat *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-lg">
                                <SelectValue placeholder="Tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>Aktiv</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="archived">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                  <span>Arxivlangan</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="suspended">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span>Muzlatilgan</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="graduated">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span>Bitirgan</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="transferred">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span>O'tkazilgan</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Document Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Hujjat ma'lumotlari
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="passport_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Pasport / ID karta raqami</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="AB1234567"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Millati</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="UZ"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passport_issued_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Pasport berilgan sana</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passport_expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Pasport amal qilish muddati</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="h-12 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Footer */}
        <Separator />
        <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Bekor qilish
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                O'zgarishlarni saqlash
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
