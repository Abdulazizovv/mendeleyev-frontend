"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { schoolApi, financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  CreditCard,
  Lock,
  Globe,
  Hash,
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { StudentRelative, RelationshipType } from "@/types/school";
import type { StudentSubscription, SubscriptionPlan } from "@/types/finance";

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const studentId = params.id as string;

  // Fetch student data
  const { data: student, isLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => schoolApi.getStudent(branchId!, studentId),
    enabled: !!branchId,
  });

  // Fetch relatives
  const { data: relatives = [], refetch: refetchRelatives } = useQuery({
    queryKey: ["student-relatives", studentId],
    queryFn: () => schoolApi.getStudentRelatives(studentId),
    enabled: !!studentId,
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes", branchId],
    queryFn: () => schoolApi.getClasses(branchId!),
    enabled: !!branchId,
  });

  // Fetch subscription plans
  const { data: subscriptionPlansData } = useQuery({
    queryKey: ["subscription-plans", branchId],
    queryFn: () => financeApi.getSubscriptionPlans({ branch_id: branchId, is_active: true }),
    enabled: !!branchId,
  });
  const subscriptionPlans = subscriptionPlansData?.results || [];

  // Fetch student subscriptions
  const { data: studentSubscriptionsData, refetch: refetchSubscriptions } = useQuery({
    queryKey: ["student-subscriptions", studentId],
    queryFn: () =>
      financeApi.getStudentSubscriptions({
        student_profile: studentId,
        is_active: true,
      }),
    enabled: !!studentId,
  });
  const studentSubscriptions = studentSubscriptionsData?.results || [];

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "unspecified">("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [passportIssuedDate, setPassportIssuedDate] = useState("");
  const [passportExpiryDate, setPassportExpiryDate] = useState("");
  const [birthCertificate, setBirthCertificate] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "suspended" | "graduated" | "transferred">("active");
  const [classId, setClassId] = useState("");

  // Subscription management
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<StudentSubscription | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    subscription_plan: "",
    start_date: "",
    next_payment_date: "",
    notes: "",
  });

  // Relatives management
  const [isRelativeDialogOpen, setIsRelativeDialogOpen] = useState(false);
  const [editingRelative, setEditingRelative] = useState<StudentRelative | null>(null);
  const [relativeForm, setRelativeForm] = useState({
    relationship_type: "father" as RelationshipType,
    first_name: "",
    last_name: "",
    middle_name: "",
    phone_number: "",
    email: "",
    gender: "male" as "male" | "female" | "other" | "unspecified",
    date_of_birth: "",
    address: "",
    workplace: "",
    position: "",
    passport_number: "",
    is_primary_contact: false,
    is_guardian: false,
    notes: "",
  });

  // Set initial values when student data loads
  useEffect(() => {
    if (student) {
      setFirstName(student.first_name || "");
      setLastName(student.last_name || "");
      setMiddleName(student.middle_name || "");
      setPhoneNumber(student.phone_number || "");
      setEmail(student.email || "");
      setGender((student.gender as any) || "male");
      setDateOfBirth(student.date_of_birth || "");
      setAddress(student.address || "");
      
      const additionalFields = student.additional_fields || {};
      setPassportNumber(additionalFields.passport_number || "");
      setNationality(additionalFields.nationality || "");
      setPassportIssuedDate(additionalFields.passport_issued_date || "");
      setPassportExpiryDate(additionalFields.passport_expiry_date || "");
      
      setBirthCertificate(student.birth_certificate || "");
      setMembershipId((student as any).membership_id || "");
      setStatus((student.status as any) || "active");
      setClassId((student as any).class_info?.id || "");

      // Set active subscription if exists
      const activeSubscription = student.subscriptions?.find((s: any) => s.is_active);
      if (activeSubscription) {
        setSubscriptionForm({
          subscription_plan: activeSubscription.subscription_plan?.id || "",
          start_date: activeSubscription.start_date || "",
          next_payment_date: activeSubscription.next_payment_date || "",
          notes: activeSubscription.notes || "",
        });
      }
    }
  }, [student]);

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: (data: any) => schoolApi.updateStudent(branchId!, studentId, data),
    onSuccess: () => {
      toast.success("O'quvchi muvaffaqiyatli yangilandi");
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      router.push(`/branch-admin/students/${studentId}`);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || error?.response?.data?.message || "Xatolik yuz berdi"
      );
    },
  });

  // Add relative mutation
  const addRelativeMutation = useMutation({
    mutationFn: (data: any) => schoolApi.addStudentRelative(studentId, data),
    onSuccess: () => {
      toast.success("Yaqin muvaffaqiyatli qo'shildi");
      refetchRelatives();
      setIsRelativeDialogOpen(false);
      resetRelativeForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || error?.response?.data?.message || "Yaqin qo'shishda xatolik"
      );
    },
  });

  // Update relative mutation
  const updateRelativeMutation = useMutation({
    mutationFn: ({ relativeId, data }: { relativeId: string; data: any }) =>
      schoolApi.updateStudentRelative(studentId, relativeId, data),
    onSuccess: () => {
      toast.success("Yaqin muvaffaqiyatli yangilandi");
      refetchRelatives();
      setIsRelativeDialogOpen(false);
      setEditingRelative(null);
      resetRelativeForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || error?.response?.data?.message || "Yaqin yangilashda xatolik"
      );
    },
  });

  // Delete relative mutation
  const deleteRelativeMutation = useMutation({
    mutationFn: (relativeId: string) => schoolApi.deleteStudentRelative(studentId, relativeId),
    onSuccess: () => {
      toast.success("Yaqin muvaffaqiyatli o'chirildi");
      refetchRelatives();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || error?.response?.data?.message || "Yaqin o'chirishda xatolik"
      );
    },
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: (data: any) =>
      financeApi.createStudentSubscription({
        student_profile: studentId,
        subscription_plan: data.subscription_plan,
        branch: branchId!,
        start_date: data.start_date,
        next_payment_date: data.next_payment_date,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Abonement muvaffaqiyatli qo'shildi");
      refetchSubscriptions();
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      setIsSubscriptionDialogOpen(false);
      resetSubscriptionForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || error?.response?.data?.message || "Abonement qo'shishda xatolik"
      );
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ subscriptionId, data }: { subscriptionId: string; data: any }) =>
      financeApi.updateStudentSubscription(subscriptionId, data),
    onSuccess: () => {
      toast.success("Abonement muvaffaqiyatli yangilandi");
      refetchSubscriptions();
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      setIsSubscriptionDialogOpen(false);
      setEditingSubscription(null);
      resetSubscriptionForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || error?.response?.data?.message || "Abonement yangilashda xatolik"
      );
    },
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: (subscriptionId: string) => financeApi.deleteStudentSubscription(subscriptionId),
    onSuccess: () => {
      toast.success("Abonement muvaffaqiyatli o'chirildi");
      refetchSubscriptions();
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || error?.response?.data?.message || "Abonement o'chirishda xatolik"
      );
    },
  });

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      subscription_plan: "",
      start_date: "",
      next_payment_date: "",
      notes: "",
    });
    setEditingSubscription(null);
  };

  const openAddSubscriptionDialog = () => {
    resetSubscriptionForm();
    setIsSubscriptionDialogOpen(true);
  };

  const openEditSubscriptionDialog = (subscription: StudentSubscription) => {
    setEditingSubscription(subscription);
    setSubscriptionForm({
      subscription_plan: subscription.subscription_plan,
      start_date: subscription.start_date,
      next_payment_date: subscription.next_payment_date,
      notes: subscription.notes || "",
    });
    setIsSubscriptionDialogOpen(true);
  };

  const handleSaveSubscription = () => {
    if (!subscriptionForm.subscription_plan) {
      toast.error("Abonement rejasini tanlang");
      return;
    }
    if (!subscriptionForm.start_date) {
      toast.error("Boshlanish sanasini kiriting");
      return;
    }
    if (!subscriptionForm.next_payment_date) {
      toast.error("Keyingi to'lov sanasini kiriting");
      return;
    }

    if (editingSubscription) {
      updateSubscriptionMutation.mutate({
        subscriptionId: editingSubscription.id,
        data: {
          next_payment_date: subscriptionForm.next_payment_date,
          notes: subscriptionForm.notes || undefined,
        },
      });
    } else {
      createSubscriptionMutation.mutate(subscriptionForm);
    }
  };

  const handleDeleteSubscription = (subscriptionId: string, subscriptionName: string) => {
    if (confirm(`${subscriptionName} abonementini o'chirishni tasdiqlaysizmi?`)) {
      deleteSubscriptionMutation.mutate(subscriptionId);
    }
  };

  const resetRelativeForm = () => {
    setRelativeForm({
      relationship_type: "father",
      first_name: "",
      last_name: "",
      middle_name: "",
      phone_number: "",
      email: "",
      gender: "male",
      date_of_birth: "",
      address: "",
      workplace: "",
      position: "",
      passport_number: "",
      is_primary_contact: false,
      is_guardian: false,
      notes: "",
    });
    setEditingRelative(null);
  };

  const openAddRelativeDialog = () => {
    resetRelativeForm();
    setIsRelativeDialogOpen(true);
  };

  const openEditRelativeDialog = (relative: StudentRelative) => {
    setEditingRelative(relative);
    setRelativeForm({
      relationship_type: relative.relationship_type,
      first_name: relative.first_name,
      last_name: relative.last_name || "",
      middle_name: relative.middle_name || "",
      phone_number: relative.phone_number || "",
      email: relative.email || "",
      gender: relative.gender || "male",
      date_of_birth: relative.date_of_birth || "",
      address: relative.address || "",
      workplace: relative.workplace || "",
      position: relative.position || "",
      passport_number: relative.passport_number || "",
      is_primary_contact: relative.is_primary_contact,
      is_guardian: relative.is_guardian,
      notes: relative.notes || "",
    });
    setIsRelativeDialogOpen(true);
  };

  const handleSaveRelative = () => {
    if (!relativeForm.first_name) {
      toast.error("Ism kiritilishi shart");
      return;
    }

    if (editingRelative) {
      updateRelativeMutation.mutate({
        relativeId: editingRelative.id,
        data: relativeForm,
      });
    } else {
      addRelativeMutation.mutate(relativeForm);
    }
  };

  const handleDeleteRelative = (relativeId: string, relativeName: string) => {
    if (confirm(`${relativeName} ni o'chirishni tasdiqlaysizmi?`)) {
      deleteRelativeMutation.mutate(relativeId);
    }
  };

  // Transfer student mutation
  const transferStudentMutation = useMutation({
    mutationFn: ({ currentClassId, targetClassId, membershipId }: { currentClassId: string; targetClassId: string; membershipId: string }) =>
      schoolApi.transferStudent(currentClassId, membershipId, {
        target_class_id: targetClassId,
        notes: "Sinf o'zgartirildi",
      }),
    onSuccess: () => {
      toast.success("O'quvchi muvaffaqiyatli boshqa sinfga ko'chirildi");
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      router.push(`/branch-admin/students/${studentId}`);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || error?.response?.data?.message || "Sinf o'zgartirishda xatolik"
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName) {
      toast.error("Ism majburiy");
      return;
    }

    const additionalFields: Record<string, any> = {
      ...(student?.additional_fields || {}),
    };

    if (passportNumber) additionalFields.passport_number = passportNumber;
    if (nationality) additionalFields.nationality = nationality;
    if (passportIssuedDate) additionalFields.passport_issued_date = passportIssuedDate;
    if (passportExpiryDate) additionalFields.passport_expiry_date = passportExpiryDate;

    const updateData: any = {
      first_name: firstName,
      last_name: lastName || undefined,
      middle_name: middleName || undefined,
      email: email || undefined,
      gender: gender !== "unspecified" ? gender : undefined,
      date_of_birth: dateOfBirth || undefined,
      address: address || undefined,
      birth_certificate: birthCertificate || undefined,
      membership_id: membershipId || undefined,
      status: status,
      additional_fields: Object.keys(additionalFields).length > 0 ? additionalFields : undefined,
    };

    // Sinf o'zgartirish logikasi
    const currentClassId = student?.current_class?.id;
    const membershipIdForTransfer = (student as any)?.membership_id || student?.id;
    const newClassId = classId && classId !== "none" ? classId : null;

    // Agar o'quvchi allaqachon sinfda bo'lsa va yangi sinf tanlangan bo'lsa
    if (currentClassId && newClassId && currentClassId !== newClassId) {
      // Transfer API'ni ishlatish
      if (membershipIdForTransfer) {
        transferStudentMutation.mutate({
          currentClassId,
          targetClassId: newClassId,
          membershipId: membershipIdForTransfer,
        });
        // Boshqa ma'lumotlarni ham yangilash
        updateStudentMutation.mutate({
          ...updateData,
          class_id: undefined, // Transfer API ishlatilganda class_id yuborilmaydi
        });
        return;
      }
    }

    // Agar o'quvchi sinfda emas va yangi sinf tanlangan bo'lsa
    if (!currentClassId && newClassId) {
      updateData.class_id = newClassId;
    }
    // Agar o'quvchi sinfda va "none" tanlangan bo'lsa (sinfdan olib tashlash)
    else if (currentClassId && !newClassId) {
      // Sinfdan olib tashlash uchun null yuborish
      updateData.class_id = null;
    }
    // Agar sinf o'zgarmagan bo'lsa, class_id yuborilmaydi
    else if (currentClassId === newClassId) {
      // Sinf o'zgarmagan, class_id yuborilmaydi
    }

    updateStudentMutation.mutate(updateData);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">O'quvchi topilmadi</h2>
        <Button onClick={() => router.push("/branch-admin/students")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Orqaga
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/branch-admin/students/${studentId}`)}
                className="hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  O'quvchini Tahrirlash
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {student.full_name} • {student.personal_number}
                </p>
              </div>
            </div>
            <Badge
              variant={
                status === "active"
                  ? "default"
                  : status === "suspended"
                  ? "destructive"
                  : "secondary"
              }
              className="text-xs sm:text-sm px-2 sm:px-3 py-1 flex-shrink-0 self-start sm:self-auto"
            >
              {status === "active"
                ? "Aktiv"
                : status === "suspended"
                ? "To'xtatilgan"
                : status === "archived"
                ? "Arxivlangan"
                : status === "graduated"
                ? "Bitirgan"
                : "Ko'chirilgan"}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="w-5 h-5 text-blue-600" />
                    Shaxsiy Ma'lumotlar
                  </CardTitle>
                  <CardDescription>O'quvchining asosiy shaxsiy ma'lumotlari</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        Ism <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ali"
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName" className="text-sm font-medium">
                        Otasining ismi
                      </Label>
                      <Input
                        id="middleName"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="Valiyevich"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Familiya
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Valiyev"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-medium">
                        Jins
                      </Label>
                      <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Erkak</SelectItem>
                          <SelectItem value="female">Ayol</SelectItem>
                          <SelectItem value="other">Boshqa</SelectItem>
                          <SelectItem value="unspecified">Belgilanmagan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                        Tug'ilgan sana
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700">Pasport Ma'lumotlari</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passportNumber" className="text-sm font-medium">
                          Pasport seriya va raqam
                        </Label>
                        <Input
                          id="passportNumber"
                          value={passportNumber}
                          onChange={(e) => setPassportNumber(e.target.value)}
                          placeholder="AA1234567"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality" className="text-sm font-medium">
                          Millati
                        </Label>
                        <Input
                          id="nationality"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          placeholder="O'zbek"
                          className="h-10"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passportIssuedDate" className="text-sm font-medium">
                          Pasport berilgan sana
                        </Label>
                        <Input
                          id="passportIssuedDate"
                          type="date"
                          value={passportIssuedDate}
                          onChange={(e) => setPassportIssuedDate(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passportExpiryDate" className="text-sm font-medium">
                          Pasport amal qilish muddati
                        </Label>
                        <Input
                          id="passportExpiryDate"
                          type="date"
                          value={passportExpiryDate}
                          onChange={(e) => setPassportExpiryDate(e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthCertificate" className="text-sm font-medium">
                        Tug'ilganlik guvohnomasi
                      </Label>
                      <Input
                        id="birthCertificate"
                        value={birthCertificate}
                        onChange={(e) => setBirthCertificate(e.target.value)}
                        placeholder="I-AA 1234567"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="membershipId" className="text-sm font-medium">
                        A'zolik ID
                      </Label>
                      <Input
                        id="membershipId"
                        value={membershipId}
                        onChange={(e) => setMembershipId(e.target.value)}
                        placeholder="MEM-2024-001"
                        className="h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Phone className="w-5 h-5 text-green-600" />
                    Aloqa Ma'lumotlari
                  </CardTitle>
                  <CardDescription>Telefon, email va manzil ma'lumotlari</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        Telefon raqam
                      </Label>
                      <div className="relative">
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          disabled
                          className="bg-gray-50 cursor-not-allowed pr-10 h-10"
                          placeholder="+998901234567"
                        />
                        <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Telefon raqamni o'zgartirish uchun tizim administratoriga murojaat qiling
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        Email manzil
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ali@example.com"
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      Manzil
                    </Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Toshkent shahar, Yunusobod tumani"
                      className="h-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information */}
              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    Ta'lim Ma'lumotlari
                  </CardTitle>
                  <CardDescription>Sinf va status ma'lumotlari</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">
                        Status
                      </Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktiv</SelectItem>
                          <SelectItem value="suspended">To'xtatilgan</SelectItem>
                          <SelectItem value="archived">Arxivlangan</SelectItem>
                          <SelectItem value="graduated">Bitirgan</SelectItem>
                          <SelectItem value="transferred">Ko'chirilgan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class" className="text-sm font-medium">
                        Sinf
                      </Label>
                      <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Sinfni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sinfsiz</SelectItem>
                          {classes.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {student?.current_class && classId !== student.current_class.id && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Joriy sinf: {student.current_class.name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Management */}
              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b rounded-t-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <CreditCard className="w-5 h-5 text-cyan-600" />
                        Abonementlar
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {studentSubscriptions.length} ta faol abonement
                      </CardDescription>
                    </div>
                    <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          onClick={openAddSubscriptionDialog}
                          className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Abonement Qo'shish</span>
                          <span className="sm:hidden">+</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">
                            {editingSubscription ? "Abonementni Tahrirlash" : "Yangi Abonement Qo'shish"}
                          </DialogTitle>
                          <DialogDescription className="text-sm">
                            O'quvchiga abonement qo'shing yoki mavjud abonementni tahrirlang
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2 sm:py-4">
                          <div className="space-y-2">
                            <Label>Abonement Rejasi *</Label>
                            <Select
                              value={subscriptionForm.subscription_plan}
                              onValueChange={(v) =>
                                setSubscriptionForm({ ...subscriptionForm, subscription_plan: v })
                              }
                              disabled={!!editingSubscription}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Abonement rejasini tanlang" />
                              </SelectTrigger>
                              <SelectContent>
                                {subscriptionPlans.map((plan: SubscriptionPlan) => (
                                  <SelectItem key={plan.id} value={plan.id}>
                                    {plan.name} - {new Intl.NumberFormat("uz-UZ").format(plan.price)} so'm / {plan.period_display}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {editingSubscription && (
                              <p className="text-xs text-gray-500">
                                Abonement rejasini o'zgartirib bo'lmaydi
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Boshlanish sanasi *</Label>
                              <Input
                                type="date"
                                value={subscriptionForm.start_date}
                                onChange={(e) =>
                                  setSubscriptionForm({ ...subscriptionForm, start_date: e.target.value })
                                }
                                disabled={!!editingSubscription}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Keyingi to'lov sanasi *</Label>
                              <Input
                                type="date"
                                value={subscriptionForm.next_payment_date}
                                onChange={(e) =>
                                  setSubscriptionForm({
                                    ...subscriptionForm,
                                    next_payment_date: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Eslatmalar</Label>
                            <Input
                              value={subscriptionForm.notes}
                              onChange={(e) =>
                                setSubscriptionForm({ ...subscriptionForm, notes: e.target.value })
                              }
                              placeholder="Qo'shimcha ma'lumotlar"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsSubscriptionDialogOpen(false);
                                resetSubscriptionForm();
                              }}
                            >
                              Bekor qilish
                            </Button>
                            <Button
                              type="button"
                              onClick={handleSaveSubscription}
                              disabled={
                                createSubscriptionMutation.isPending ||
                                updateSubscriptionMutation.isPending
                              }
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              {(createSubscriptionMutation.isPending ||
                                updateSubscriptionMutation.isPending) ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saqlanmoqda...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Saqlash
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {studentSubscriptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Abonementlar ro'yxati bo'sh</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openAddSubscriptionDialog}
                        className="mt-4"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Abonement qo'shish
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentSubscriptions.map((subscription) => (
                        <div
                          key={subscription.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {subscription.subscription_plan_name}
                              </p>
                              {subscription.is_active && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                  Faol
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                              <p>
                                Narx: {new Intl.NumberFormat("uz-UZ").format(subscription.subscription_plan_price)} so'm / {subscription.period_display}
                              </p>
                              <p>
                                Keyingi to'lov: {new Date(subscription.next_payment_date).toLocaleDateString("uz-UZ")}
                              </p>
                              {subscription.total_debt > 0 && (
                                <p className="text-red-600 font-medium">
                                  Qarz: {new Intl.NumberFormat("uz-UZ").format(subscription.total_debt)} so'm
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditSubscriptionDialog(subscription)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteSubscription(
                                  subscription.id,
                                  subscription.subscription_plan_name
                                )
                              }
                              disabled={deleteSubscriptionMutation.isPending}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deleteSubscriptionMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Relatives */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b rounded-t-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Users className="w-5 h-5 text-orange-600" />
                        Yaqinlar
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {relatives.length} ta yaqin ro'yxatda
                      </CardDescription>
                    </div>
                    <Dialog open={isRelativeDialogOpen} onOpenChange={setIsRelativeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          onClick={openAddRelativeDialog}
                          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Qo'shish</span>
                          <span className="sm:hidden">+</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">
                            {editingRelative ? "Yaqinni Tahrirlash" : "Yangi Yaqin Qo'shish"}
                          </DialogTitle>
                          <DialogDescription className="text-sm">
                            O'quvchining yaqinlaridan birini qo'shing yoki tahrirlang
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2 sm:py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Qarindoshlik darajasi *</Label>
                              <Select
                                value={relativeForm.relationship_type}
                                onValueChange={(v: RelationshipType) =>
                                  setRelativeForm({ ...relativeForm, relationship_type: v })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {relationshipTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Ism *</Label>
                              <Input
                                value={relativeForm.first_name}
                                onChange={(e) =>
                                  setRelativeForm({ ...relativeForm, first_name: e.target.value })
                                }
                                placeholder="Olim"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Otasining ismi</Label>
                              <Input
                                value={relativeForm.middle_name}
                                onChange={(e) =>
                                  setRelativeForm({ ...relativeForm, middle_name: e.target.value })
                                }
                                placeholder="Karim o'g'li"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Familiya</Label>
                              <Input
                                value={relativeForm.last_name}
                                onChange={(e) =>
                                  setRelativeForm({ ...relativeForm, last_name: e.target.value })
                                }
                                placeholder="Valiyev"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Telefon raqam</Label>
                              <Input
                                value={relativeForm.phone_number}
                                onChange={(e) =>
                                  setRelativeForm({ ...relativeForm, phone_number: e.target.value })
                                }
                                placeholder="+998901234567"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={relativeForm.email}
                                onChange={(e) =>
                                  setRelativeForm({ ...relativeForm, email: e.target.value })
                                }
                                placeholder="olim@example.com"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Jins</Label>
                              <Select
                                value={relativeForm.gender}
                                onValueChange={(v: any) =>
                                  setRelativeForm({ ...relativeForm, gender: v })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">Erkak</SelectItem>
                                  <SelectItem value="female">Ayol</SelectItem>
                                  <SelectItem value="other">Boshqa</SelectItem>
                                  <SelectItem value="unspecified">Belgilanmagan</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Tug'ilgan sana</Label>
                              <Input
                                type="date"
                                value={relativeForm.date_of_birth}
                                onChange={(e) =>
                                  setRelativeForm({ ...relativeForm, date_of_birth: e.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Manzil</Label>
                            <Input
                              value={relativeForm.address}
                              onChange={(e) =>
                                setRelativeForm({ ...relativeForm, address: e.target.value })
                              }
                              placeholder="Toshkent shahar"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Ish joyi</Label>
                              <Input
                                value={relativeForm.workplace}
                                onChange={(e) =>
                                  setRelativeForm({ ...relativeForm, workplace: e.target.value })
                                }
                                placeholder="IT Kompaniya"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Lavozim</Label>
                              <Input
                                value={relativeForm.position}
                                onChange={(e) =>
                                  setRelativeForm({ ...relativeForm, position: e.target.value })
                                }
                                placeholder="Dasturchi"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Pasport seriya va raqam</Label>
                            <Input
                              value={relativeForm.passport_number}
                              onChange={(e) =>
                                setRelativeForm({ ...relativeForm, passport_number: e.target.value })
                              }
                              placeholder="AB1234567"
                            />
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="is_primary_contact"
                                checked={relativeForm.is_primary_contact}
                                onChange={(e) =>
                                  setRelativeForm({
                                    ...relativeForm,
                                    is_primary_contact: e.target.checked,
                                  })
                                }
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="is_primary_contact" className="text-sm">
                                Asosiy aloqa shaxsi
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="is_guardian"
                                checked={relativeForm.is_guardian}
                                onChange={(e) =>
                                  setRelativeForm({
                                    ...relativeForm,
                                    is_guardian: e.target.checked,
                                  })
                                }
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="is_guardian" className="text-sm">
                                Vasiy
                              </Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Eslatmalar</Label>
                            <Input
                              value={relativeForm.notes}
                              onChange={(e) =>
                                setRelativeForm({ ...relativeForm, notes: e.target.value })
                              }
                              placeholder="Qo'shimcha ma'lumotlar"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsRelativeDialogOpen(false);
                                resetRelativeForm();
                              }}
                            >
                              Bekor qilish
                            </Button>
                            <Button
                              type="button"
                              onClick={handleSaveRelative}
                              disabled={
                                addRelativeMutation.isPending || updateRelativeMutation.isPending
                              }
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              {(addRelativeMutation.isPending || updateRelativeMutation.isPending) ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saqlanmoqda...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Saqlash
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {relatives.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Yaqinlar ro'yxati bo'sh</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openAddRelativeDialog}
                        className="mt-4"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Yaqin qo'shish
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {relatives.map((relative) => (
                        <div
                          key={relative.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{relative.full_name}</p>
                              <Badge variant="outline" className="text-xs">
                                {relative.relationship_type_display}
                              </Badge>
                              {relative.is_primary_contact && (
                                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                  Asosiy
                                </Badge>
                              )}
                              {relative.is_guardian && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                  Vasiy
                                </Badge>
                              )}
                            </div>
                            {relative.phone_number && (
                              <p className="text-sm text-gray-600 mt-1">{relative.phone_number}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditRelativeDialog(relative)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRelative(relative.id, relative.full_name)}
                              disabled={deleteRelativeMutation.isPending}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deleteRelativeMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-lg shadow-lg p-3 sm:p-4 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 z-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/branch-admin/students/${studentId}`)}
                disabled={updateStudentMutation.isPending}
                className="w-full sm:w-auto sm:min-w-[120px]"
              >
                <X className="w-4 h-4 mr-2" />
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={updateStudentMutation.isPending}
                className="w-full sm:w-auto sm:min-w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {updateStudentMutation.isPending ? (
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
          </div>
        </form>
      </div>
    </div>
  );
}
