"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { schoolApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { toast } from "sonner";
import { handleApiError } from "@/lib/api/client";
import {
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
  AlertCircle,
  Info,
  CheckCircle2,
} from "lucide-react";
import type {
  CreateStudentRequest,
  CreateStudentRelativeRequest,
  RelationshipType,
  Class,
  StudentPhoneCheckResponse,
  StudentProfileSummary,
} from "@/types/school";

type PhoneLookupStatus =
  | "idle"
  | "checking"
  | "available"
  | "exists-in-branch"
  | "exists-in-other"
  | "error";

const relationshipTypes: { value: RelationshipType; label: string }[] = [
  { value: "father", label: "Otasi" },
  { value: "mother", label: "Onasi" },
  { value: "brother", label: "Akasi" },
  { value: "sister", label: "Opasi" },
  { value: "grandfather", label: "Bobosi" },
  { value: "grandmother", label: "Buvisi" },
  { value: "uncle", label: "Amakisi/Tog'asi" },
  { value: "aunt", label: "Xolasi/Teyzasi" },
  { value: "guardian", label: "Vasiy" },
  { value: "other", label: "Boshqa" },
];

const relativeSchema = z.object({
  relationship_type: z.enum([
    "father",
    "mother",
    "brother",
    "sister",
    "grandfather",
    "grandmother",
    "uncle",
    "aunt",
    "guardian",
    "other",
  ]),
  first_name: z.string().min(1, "Ism kiritilishi shart"),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  phone_number: z
    .string()
    .regex(/^\+998\d{9}$/, "Telefon raqami noto'g'ri formatda")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Email noto'g'ri formatda").optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", "unspecified"]).optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  workplace: z.string().optional(),
  position: z.string().optional(),
  passport_number: z.string().optional(),
  is_primary_contact: z.boolean().default(false),
  is_guardian: z.boolean().default(false),
  notes: z.string().optional(),
});

const studentSchema = z.object({
  phone_number: z
    .string()
    .regex(/^\+998\d{9}$/, "Telefon raqami noto'g'ri formatda"),
  first_name: z.string().min(1, "Ism kiritilishi shart"),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  email: z.string().email("Email noto'g'ri formatda").optional().or(z.literal("")),
  password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak").optional(),
  gender: z.enum(["male", "female", "other", "unspecified"]).optional(),
  status: z
    .enum(["active", "archived", "suspended", "graduated", "transferred"])
    .default("active"),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  class_id: z.string().optional(),
  relatives: z.array(relativeSchema).optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface CreateStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  classes?: Class[];
}

// Helper to ensure classes is always an array
const ensureArray = <T,>(value: T[] | undefined | null): T[] => {
  return Array.isArray(value) ? value : [];
};

export function CreateStudentForm({
  open,
  onOpenChange,
  onSuccess,
  classes,
}: CreateStudentFormProps) {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [phoneLookupStatus, setPhoneLookupStatus] = React.useState<PhoneLookupStatus>("idle");
  const [phoneLookupResult, setPhoneLookupResult] = React.useState<StudentPhoneCheckResponse | null>(null);
  const phoneAutofillRef = React.useRef<string | null>(null);
  
  // Ensure classes is always an array
  const classesArray = React.useMemo(() => ensureArray(classes), [classes]);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      phone_number: "",
      first_name: "",
      last_name: "",
      middle_name: "",
      email: "",
      password: "",
      gender: "unspecified",
      status: "active",
      date_of_birth: "",
      address: "",
      class_id: "",
      relatives: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "relatives",
  });

  const phoneNumber = form.watch("phone_number");

  const prefillStudentFromProfile = React.useCallback(
    (profile?: StudentProfileSummary | null) => {
      if (!profile || !phoneNumber) return;
      if (phoneAutofillRef.current === phoneNumber) return;
      phoneAutofillRef.current = phoneNumber;

      const currentValues = form.getValues();
      const fullName = profile.full_name?.trim();

      const applyNameParts = () => {
        if (!fullName) return;
        const parts = fullName.split(/\s+/);
        if (!parts.length) return;
        const firstNameFromProfile = profile.first_name || parts[0];
        const lastNameFromProfile = profile.last_name || (parts.length > 1 ? parts[parts.length - 1] : "");
        const middleNameFromProfile =
          profile.middle_name ||
          (parts.length > 2 ? parts.slice(1, parts.length - 1).join(" ") : "");

        if (!currentValues.first_name && firstNameFromProfile) {
          form.setValue("first_name", firstNameFromProfile);
        }
        if (!currentValues.last_name && lastNameFromProfile) {
          form.setValue("last_name", lastNameFromProfile);
        }
        if (!currentValues.middle_name && middleNameFromProfile) {
          form.setValue("middle_name", middleNameFromProfile);
        }
      };

      applyNameParts();

      if (!currentValues.gender && profile.gender) {
        form.setValue("gender", profile.gender);
      }

      if (!currentValues.date_of_birth && profile.date_of_birth) {
        form.setValue("date_of_birth", profile.date_of_birth);
      }

      if (!currentValues.email && profile.email) {
        form.setValue("email", profile.email);
      }
    },
    [form, phoneNumber]
  );

  React.useEffect(() => {
    if (!phoneNumber || !/^\+998\d{9}$/.test(phoneNumber)) {
      setPhoneLookupStatus("idle");
      setPhoneLookupResult(null);
      phoneAutofillRef.current = null;
      return;
    }

    let isActive = true;
    setPhoneLookupStatus("checking");

    const timeoutId = setTimeout(async () => {
      try {
        const result = await schoolApi.checkStudentByPhone(
          phoneNumber,
          currentBranch?.branch_id
        );
        if (!isActive) return;

        setPhoneLookupResult(result);

        if (result.exists_in_branch) {
          setPhoneLookupStatus("exists-in-branch");
        } else if (result.exists_globally) {
          setPhoneLookupStatus("exists-in-other");
          const profile =
            result.branch_data?.student_profile ??
            result.all_branches_data?.[0]?.student_profile;
          prefillStudentFromProfile(profile);
        } else {
          setPhoneLookupStatus("available");
        }
      } catch (error) {
        if (!isActive) return;
        console.error("Phone lookup failed:", error);
        setPhoneLookupStatus("error");
        setPhoneLookupResult(null);
      }
    }, 600);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [phoneNumber, currentBranch?.branch_id, prefillStudentFromProfile]);

  const primaryProfile =
    phoneLookupResult?.branch_data?.student_profile ??
    phoneLookupResult?.all_branches_data?.[0]?.student_profile ??
    null;

  const canSubmit = !phoneLookupResult?.exists_in_branch;

  const onSubmit = async (data: StudentFormData) => {
    if (!currentBranch?.branch_id) {
      toast.error("Filial tanlanmagan");
      return;
    }

    if (!canSubmit) {
      toast.error("Bu telefon raqamdagi o'quvchi allaqachon mavjud.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare request data
      const requestData: CreateStudentRequest = {
        phone_number: data.phone_number,
        first_name: data.first_name,
        last_name: data.last_name || undefined,
        middle_name: data.middle_name || undefined,
        email: data.email || undefined,
        password: data.password || undefined,
        gender: data.gender !== "unspecified" ? data.gender : undefined,
        status: data.status,
        date_of_birth: data.date_of_birth || undefined,
        address: data.address || undefined,
        class_id: data.class_id || undefined,
        relatives: data.relatives?.map((rel) => ({
          ...rel,
          phone_number: rel.phone_number || undefined,
          email: rel.email || undefined,
        })),
      };

      await schoolApi.createStudent(currentBranch.branch_id, requestData);

      toast.success("O'quvchi muvaffaqiyatli yaratildi");
      form.reset();
      setPhoneLookupStatus("idle");
      setPhoneLookupResult(null);
      phoneAutofillRef.current = null;
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const apiError = handleApiError(error);
      const errorMessage =
        apiError.detail ||
        apiError.message ||
        "O'quvchi yaratishda xatolik yuz berdi";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRelative = () => {
    append({
      relationship_type: "father",
      first_name: "",
      last_name: "",
      middle_name: "",
      phone_number: "",
      email: "",
      gender: "unspecified",
      date_of_birth: "",
      address: "",
      workplace: "",
      position: "",
      passport_number: "",
      is_primary_contact: false,
      is_guardian: false,
      notes: "",
    });
  };

  const renderPhoneLookupBanner = () => {
    if (phoneLookupStatus === "idle") {
      return null;
    }

    const branches = phoneLookupResult?.all_branches_data ?? [];

    if (phoneLookupStatus === "checking") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          Telefon raqami bo'yicha ma'lumot qidirilmoqda...
        </div>
      );
    }

    if (phoneLookupStatus === "exists-in-branch") {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">
                Bu telefon raqamdagi o'quvchi allaqachon ushbu filialda ro'yxatdan o'tgan.
              </p>
              {primaryProfile?.full_name && (
                <p className="text-sm text-red-700 mt-1">{primaryProfile.full_name}</p>
              )}
            </div>
          </div>
          {primaryProfile?.id && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-red-700">
                Takroriy yozuv yaratmaslik uchun mavjud o'quvchini tekshiring.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/branch-admin/students?studentId=${primaryProfile.id}`);
                }}
              >
                Batafsil ko'rish
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (phoneLookupStatus === "exists-in-other") {
      return (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800">
                Bu raqam boshqa filial(lar)da mavjud. Ma'lumotlar avtomatik to'ldirildi.
              </p>
              {primaryProfile?.full_name && (
                <p className="text-sm text-blue-700 mt-1">{primaryProfile.full_name}</p>
              )}
            </div>
          </div>
          {branches.length > 0 && (
            <div className="rounded-lg bg-white/70 p-3 text-sm text-blue-700 space-y-1">
              {branches.map((branch) => (
                <div key={`${branch.branch_id}-${branch.student_profile?.id}`}>
                  {branch.branch_name} — {branch.student_profile?.status_display || branch.role_display}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (phoneLookupStatus === "available") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          Telefon raqami bo'sh, yangi o'quvchi yaratish mumkin.
        </div>
      );
    }

    if (phoneLookupStatus === "error") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          Telefon raqam bo'yicha ma'lumotni tekshirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Yangi o'quvchi qo'shish
          </DialogTitle>
          <DialogDescription>
            O'quvchi ma'lumotlarini to'ldiring va kerak bo'lsa yaqinlarini qo'shing
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-6 lg:grid-cols-[2fr,1fr]"
          >
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
                  <CardDescription>
                    O'quvchining asosiy identifikatsiya va demografik ma'lumotlari
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ism *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ali" {...field} />
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
                          <FormLabel>Familiya</FormLabel>
                          <FormControl>
                            <Input placeholder="Valiyev" {...field} />
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
                          <FormLabel>Otasining ismi</FormLabel>
                          <FormControl>
                            <Input placeholder="Olim o'g'li" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jins</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Jinsni tanlang" />
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
                          <FormLabel>Tug'ilgan sana</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manzil</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Toshkent shahri, Chilonzor tumani"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Akademik ma'lumotlar</CardTitle>
                  <CardDescription>Filialdagi holat va sinfga biriktirish</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Holat</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Aktiv</SelectItem>
                              <SelectItem value="archived">Arxivlangan</SelectItem>
                              <SelectItem value="suspended">Muzlatilgan</SelectItem>
                              <SelectItem value="graduated">Bitirgan</SelectItem>
                              <SelectItem value="transferred">O'tkazilgan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="class_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sinf</FormLabel>
                          <Select
                            value={field.value || undefined}
                            onValueChange={(value) => field.onChange(value || "")}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sinfni tanlang (ixtiyoriy)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classesArray.length === 0 ? (
                                <SelectItem value="no-classes" disabled>
                                  Sinflar topilmadi
                                </SelectItem>
                              ) : (
                                classesArray.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name} ({cls.academic_year_name})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Sinf tanlash ixtiyoriy. Keyinroq sinfga biriktirish mumkin.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Yaqinlar ({fields.length})
                    </CardTitle>
                    <CardDescription>Ota-ona yoki vasiy ma'lumotlari</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addRelative}>
                    <Plus className="w-4 h-4 mr-2" />
                    Yaqin qo'shish
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Yaqinlar qo'shilmagan</p>
                      <p className="text-sm mt-1">
                        Yaqin qo'shish uchun “Yaqin qo'shish” tugmasini bosing
                      </p>
                    </div>
                  )}

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Yaqin #{index + 1}</p>
                          <p className="font-semibold text-gray-900">
                            {form.watch(`relatives.${index}.first_name`) || "Ism kiritilmagan"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.relationship_type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qarindoshlik darajasi *</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {relationshipTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
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
                          name={`relatives.${index}.first_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ism *</FormLabel>
                              <FormControl>
                                <Input placeholder="Olim" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.last_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Familiya</FormLabel>
                              <FormControl>
                                <Input placeholder="Valiyev" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.middle_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Otasining ismi</FormLabel>
                              <FormControl>
                                <Input placeholder="Karim o'g'li" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.phone_number`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon raqami</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  error={
                                    form.formState.errors.relatives?.[index]?.phone_number
                                      ?.message
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.email`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="olim@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.gender`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jins</FormLabel>
                              <Select
                                value={field.value || "unspecified"}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
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
                          name={`relatives.${index}.date_of_birth`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tug'ilgan sana</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.workplace`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ish joyi</FormLabel>
                              <FormControl>
                                <Input placeholder="Ish joyi nomi" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.position`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lavozim</FormLabel>
                              <FormControl>
                                <Input placeholder="Lavozim" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`relatives.${index}.address`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manzil</FormLabel>
                            <FormControl>
                              <Input placeholder="Manzil" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex flex-wrap items-center gap-4">
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.is_primary_contact`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Asosiy kontakt</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.is_guardian`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Vasiy</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kontakt va tizim ma'lumotlari</CardTitle>
                  <CardDescription>
                    Telefon raqami asosida mavjud o'quvchini tekshiruvchi aqlli forma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon raqami *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                              error={form.formState.errors.phone_number?.message}
                              required
                            />
                            {phoneLookupStatus === "checking" && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600 absolute right-3 top-1/2 -translate-y-1/2" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                        <div className="mt-3">
                          {renderPhoneLookupBanner() ?? (
                            <p className="text-sm text-gray-500">
                              Telefon raqamini kiritgach tizim avtomatik tekshiradi va mavjud profilni aniqlaydi.
                            </p>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ali@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parol</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Ixtiyoriy" {...field} />
                        </FormControl>
                        <FormDescription>
                          Parol kiritish shart emas; o'quvchi keyinchalik shaxsiy kabinetida parol o'rnatadi.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {(primaryProfile || (phoneLookupResult?.all_branches_data?.length ?? 0) > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Topilgan profil ma'lumotlari</CardTitle>
                    <CardDescription>Avtomatik to'ldirilgan ma'lumotlar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {primaryProfile && (
                      <div className="rounded-lg bg-gray-50 p-3 space-y-1">
                        <p className="font-semibold text-gray-900">{primaryProfile.full_name}</p>
                        <p className="text-gray-600">
                          Shaxsiy raqam: {primaryProfile.personal_number || "—"}
                        </p>
                        <p className="text-gray-600">
                          Tug'ilgan sana: {primaryProfile.date_of_birth || "—"}
                        </p>
                        <p className="text-gray-600">
                          Holat: {primaryProfile.status_display || primaryProfile.status || "—"}
                        </p>
                      </div>
                    )}
                    {(phoneLookupResult?.all_branches_data?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <p className="text-gray-500">O'quvchi mavjud bo'lgan filiallar:</p>
                        {phoneLookupResult?.all_branches_data?.map((branch) => (
                          <div
                            key={`${branch.branch_id}-${branch.student_profile?.id || "profile"}`}
                            className="rounded-lg border border-gray-100 p-3"
                          >
                            <p className="font-medium text-gray-900">{branch.branch_name}</p>
                            <p className="text-xs text-gray-500">
                              {branch.role_display} • {branch.student_profile?.status_display || "Holat noma'lum"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
              {!canSubmit && (
                <p className="text-sm text-red-600 sm:mr-auto">
                  Takroriy o'quvchini yaratib bo'lmaydi. Avval mavjud profilni tekshiring.
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={isSubmitting || !canSubmit}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Yaratilmoqda...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      O'quvchini yaratish
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

