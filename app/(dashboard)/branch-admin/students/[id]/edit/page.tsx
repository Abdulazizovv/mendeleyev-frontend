"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { schoolApi, financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertCircle,
} from "lucide-react";

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

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [birthCertificate, setBirthCertificate] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "suspended" | "graduated" | "transferred">("active");
  const [classId, setClassId] = useState("");
  const [subscriptionPlanId, setSubscriptionPlanId] = useState("");
  const [discountId, setDiscountId] = useState("");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionNextPaymentDate, setSubscriptionNextPaymentDate] = useState("");

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes", branchId],
    queryFn: () => schoolApi.getClasses(branchId!),
    enabled: !!branchId,
  });

  // Fetch subscription plans
  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans", branchId],
    queryFn: () => financeApi.getSubscriptionPlans({ branch_id: branchId }),
    enabled: !!branchId,
  });
  const plans = plansData?.results || [];

  // Fetch discounts
  const { data: discountsData } = useQuery({
    queryKey: ["discounts", branchId],
    queryFn: () =>
      financeApi.getDiscounts({
        branch_id: branchId,
        is_active: true,
      }),
    enabled: !!branchId,
  });
  const discounts = discountsData?.results || [];

  // Set initial values when student data loads
  useState(() => {
    if (student) {
      setFirstName(student.first_name || "");
      setLastName(student.last_name || "");
      setMiddleName(student.middle_name || "");
      setPhoneNumber(student.phone_number || "");
      setEmail(student.email || "");
      setGender((student.gender as any) || "male");
      setDateOfBirth(student.date_of_birth || "");
      setAddress(student.address || "");
      setPassportNumber((student as any).passport_number || "");
      setNationality((student as any).nationality || "");
      setBirthCertificate(student.birth_certificate || "");
      setMembershipId((student as any).membership_id || "");
      setStatus((student.status as any) || "active");
      setClassId((student as any).class_info?.id || "");
      
      // Get active subscription if exists
      const activeSubscription = student.subscriptions?.find(s => s.is_active);
      if (activeSubscription) {
        setSubscriptionPlanId(activeSubscription.subscription_plan?.id || "");
        setDiscountId(activeSubscription.discount?.id || "");
        setSubscriptionStartDate(activeSubscription.start_date || "");
        setSubscriptionNextPaymentDate(activeSubscription.next_payment_date || "");
      }
    }
  });

  // Update mutation
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
        error?.response?.data?.detail || "Xatolik yuz berdi"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !phoneNumber) {
      toast.error("Ism va telefon raqam majburiy");
      return;
    }

    const updateData = {
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName,
      phone_number: phoneNumber,
      email: email || undefined,
      gender: gender,
      date_of_birth: dateOfBirth || undefined,
      address: address || undefined,
      passport_number: passportNumber || undefined,
      nationality: nationality || undefined,
      birth_certificate: birthCertificate || undefined,
      membership_id: membershipId || undefined,
      status: status,
      class_id: classId && classId !== "none" ? classId : undefined,
    };

    updateStudentMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          O&apos;quvchi topilmadi
        </h2>
        <Button onClick={() => router.push("/branch-admin/students")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Orqaga
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/branch-admin/students/${studentId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                O&apos;quvchini Tahrirlash
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {student.full_name} • {student.personal_number}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Shaxsiy Ma&apos;lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="firstName">
                    Ism <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ali"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">Otasining ismi</Label>
                  <Input
                    id="middleName"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Valiyevich"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Familiya</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Valiyev"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Jins</Label>
                  <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Erkak</SelectItem>
                      <SelectItem value="female">Ayol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Tug&apos;ilgan sana</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passportNumber">Pasport seriya va raqam</Label>
                  <Input
                    id="passportNumber"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    placeholder="AA1234567"
                  />
                </div>
                <div>
                  <Label htmlFor="nationality">Millati</Label>
                  <Input
                    id="nationality"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="O'zbek"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthCertificate">Tug&apos;ilganlik guvohnomasi</Label>
                  <Input
                    id="birthCertificate"
                    value={birthCertificate}
                    onChange={(e) => setBirthCertificate(e.target.value)}
                    placeholder="I-AA 1234567"
                  />
                </div>
                <div>
                  <Label htmlFor="membershipId">A&apos;zolik ID</Label>
                  <Input
                    id="membershipId"
                    value={membershipId}
                    onChange={(e) => setMembershipId(e.target.value)}
                    placeholder="MEM-2024-001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Aloqa Ma&apos;lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber">
                    Telefon raqam <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+998901234567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ali@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Manzil</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Toshkent shahar, Yunusobod tumani"
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Ta&apos;lim Ma&apos;lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="suspended">To&apos;xtatilgan</SelectItem>
                      <SelectItem value="archived">Arxivlangan</SelectItem>
                      <SelectItem value="graduated">Bitirgan</SelectItem>
                      <SelectItem value="transferred">Ko&apos;chirilgan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="class">Sinf</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info - Read Only */}
          {student.subscriptions && student.subscriptions.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Abonement Ma&apos;lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">
                        Abonementni to&apos;g&apos;ridan-to&apos;g&apos;ri tahrirlash mumkin emas
                      </p>
                      <p className="text-blue-700">
                        Abonementni o&apos;zgartirish yoki bekor qilish uchun moliya bo&apos;limiga
                        murojaat qiling.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-blue-200">
                    {student.subscriptions
                      .filter((s: any) => s.is_active)
                      .map((sub: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">Joriy abonement:</span>
                          <span className="font-medium">
                            {sub.subscription_plan?.name || "Noma'lum"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-lg shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/branch-admin/students/${studentId}`)}
              disabled={updateStudentMutation.isPending}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={updateStudentMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateStudentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
      </div>
    </div>
  );
}
