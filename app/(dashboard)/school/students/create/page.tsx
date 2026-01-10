"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  User,
  Users,
  FileText,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RelativeForm {
  relationship_type: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  gender: string;
  date_of_birth: string;
  address: string;
  workplace: string;
  position: string;
  passport_number: string;
  is_primary_contact: boolean;
  is_guardian: boolean;
  notes: string;
}

export default function CreateStudentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Student Basic Info
  const [phoneNumber, setPhoneNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Student123!");
  const [gender, setGender] = useState("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [nationality, setNationality] = useState("UZ");
  const [status, setStatus] = useState("active");

  // Step 2: Class & Subscription
  const [classId, setClassId] = useState("");
  const [subscriptionPlanId, setSubscriptionPlanId] = useState("");
  const [discountId, setDiscountId] = useState("");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionNextPaymentDate, setSubscriptionNextPaymentDate] = useState("");

  // Step 3: Relatives
  const [relatives, setRelatives] = useState<RelativeForm[]>([]);
  const [currentRelative, setCurrentRelative] = useState<RelativeForm>({
    relationship_type: "father",
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    gender: "male",
    date_of_birth: "",
    address: "",
    workplace: "",
    position: "",
    passport_number: "",
    is_primary_contact: false,
    is_guardian: true,
    notes: "",
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes", branchId],
    queryFn: () =>
      schoolApi.getClasses(branchId!, {
        is_active: true,
      }),
    enabled: !!branchId,
  });

  // Fetch subscription plans
  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans", branchId],
    queryFn: () =>
      financeApi.getSubscriptionPlans({
        branch_id: branchId,
      }),
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

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (data: any) => schoolApi.createStudent(data),
    onSuccess: (data) => {
      toast.success("O'quvchi muvaffaqiyatli yaratildi!");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      router.push(`/branch-admin/students/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  const handleAddRelative = () => {
    if (!currentRelative.first_name || !currentRelative.phone_number) {
      toast.error("Ism va telefon raqam majburiy");
      return;
    }
    setRelatives([...relatives, currentRelative]);
    setCurrentRelative({
      relationship_type: "father",
      first_name: "",
      middle_name: "",
      last_name: "",
      phone_number: "",
      email: "",
      gender: "male",
      date_of_birth: "",
      address: "",
      workplace: "",
      position: "",
      passport_number: "",
      is_primary_contact: false,
      is_guardian: true,
      notes: "",
    });
    toast.success("Yaqin qo'shildi");
  };

  const handleRemoveRelative = (index: number) => {
    setRelatives(relatives.filter((_, i) => i !== index));
    toast.success("Yaqin o'chirildi");
  };

  const handleSubmit = () => {
    if (!firstName || !phoneNumber) {
      toast.error("Ism va telefon raqam majburiy");
      return;
    }

    const studentData = {
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName,
      email: email || undefined,
      password: password,
      branch_id: branchId,
      gender: gender,
      status: status,
      date_of_birth: dateOfBirth || undefined,
      address: address || undefined,
      passport_number: passportNumber || undefined,
      nationality: nationality || undefined,
      class_id: classId || undefined,
      subscription_plan_id: subscriptionPlanId || undefined,
      discount_id: discountId && discountId !== "none" ? discountId : undefined,
      subscription_start_date: subscriptionStartDate || undefined,
      subscription_next_payment_date: subscriptionNextPaymentDate || undefined,
      relatives: relatives.length > 0 ? relatives : undefined,
    };

    createStudentMutation.mutate(studentData);
  };

  const steps = [
    { number: 1, title: "Asosiy Ma'lumotlar", icon: User },
    { number: 2, title: "Sinf va Abonement", icon: CreditCard },
    { number: 3, title: "Yaqinlar", icon: Users },
    { number: 4, title: "Tasdiqlash", icon: CheckCircle2 },
  ];

  const canProceedStep1 = firstName && phoneNumber;
  const canProceedStep2 = true; // Optional
  const canProceedStep3 = true; // Optional

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin/students")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Yangi O&apos;quvchi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              O&apos;quvchi ma&apos;lumotlarini to&apos;ldiring
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isActive
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <p
                        className={`text-xs sm:text-sm mt-2 text-center ${
                          isActive ? "font-semibold text-gray-900" : "text-gray-600"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Telefon Raqam <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+998901234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      Ism <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Ali"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Familiya</Label>
                    <Input
                      id="lastName"
                      placeholder="Valiyev"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="middleName">Otasining ismi</Label>
                    <Input
                      id="middleName"
                      placeholder="Olim o'g'li"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ali@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Parol</Label>
                    <Input
                      id="password"
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Default: Student123!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Jinsi</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger id="gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Erkak</SelectItem>
                        <SelectItem value="female">Ayol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Tug&apos;ilgan Sana</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">Pasport/ID Raqam</Label>
                    <Input
                      id="passportNumber"
                      placeholder="AB1234567"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">Millati</Label>
                    <Input
                      id="nationality"
                      placeholder="UZ"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Holat</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktiv</SelectItem>
                        <SelectItem value="archived">Arxivlangan</SelectItem>
                        <SelectItem value="suspended">To&apos;xtatilgan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Manzil</Label>
                  <Input
                    id="address"
                    placeholder="Toshkent shahri, Chilonzor tumani"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Class & Subscription */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="class">Sinf</Label>
                    <Select value={classId} onValueChange={setClassId}>
                      <SelectTrigger id="class">
                        <SelectValue placeholder="Tanlang..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sinfsiz</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - {cls.academic_year_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subscription">Abonement</Label>
                    <Select value={subscriptionPlanId} onValueChange={setSubscriptionPlanId}>
                      <SelectTrigger id="subscription">
                        <SelectValue placeholder="Tanlang..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Abonomentsiz</SelectItem>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {plan.price.toLocaleString()} so&apos;m
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Discount and Date Fields - Only show if subscription selected */}
                {subscriptionPlanId && subscriptionPlanId !== "none" && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Abonement Sozlamalari
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Discount */}
                        <div className="space-y-2">
                          <Label htmlFor="discount">Chegirma (ixtiyoriy)</Label>
                          <Select value={discountId} onValueChange={setDiscountId}>
                            <SelectTrigger id="discount">
                              <SelectValue placeholder="Chegirma tanlang..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Chegirmasiz</SelectItem>
                              {discounts.map((discount: any) => (
                                <SelectItem key={discount.id} value={discount.id}>
                                  {discount.name} - {discount.discount_type === 'percentage' 
                                    ? `${discount.discount_value}%` 
                                    : `${discount.discount_value.toLocaleString()} so'm`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Abonementga chegirma qo&apos;llash
                          </p>
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                          <Label htmlFor="subscriptionStartDate">
                            Boshlanish Sanasi (ixtiyoriy)
                          </Label>
                          <Input
                            id="subscriptionStartDate"
                            type="date"
                            value={subscriptionStartDate}
                            onChange={(e) => setSubscriptionStartDate(e.target.value)}
                          />
                          <p className="text-xs text-gray-500">
                            Agar bo&apos;sh qoldirilsa, bugungi sana ishlatiladi
                          </p>
                        </div>

                        {/* Next Payment Date */}
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="subscriptionNextPaymentDate">
                            Keyingi To&apos;lov Sanasi (ixtiyoriy)
                          </Label>
                          <Input
                            id="subscriptionNextPaymentDate"
                            type="date"
                            value={subscriptionNextPaymentDate}
                            onChange={(e) => setSubscriptionNextPaymentDate(e.target.value)}
                          />
                          <p className="text-xs text-gray-500">
                            Agar bo&apos;sh qoldirilsa, avtomatik hisoblanadi (oylik: +1 oy, choraklik: +3 oy, yillik: +1 yil)
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Eslatma:</strong> Abonement yaratiladi, lekin to&apos;lov hali qilinmaydi. To&apos;lov keyinchalik to&apos;lovlar bo&apos;limidan amalga oshiriladi.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Relatives */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {relatives.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Qo&apos;shilgan Yaqinlar ({relatives.length})</h3>
                    {relatives.map((relative, index) => (
                      <Card key={index}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {relative.first_name} {relative.middle_name} {relative.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {relative.relationship_type} • {relative.phone_number}
                            </p>
                            {relative.is_primary_contact && (
                              <Badge className="mt-1">Asosiy Aloqa</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRelative(index)}
                            className="text-red-600"
                          >
                            O&apos;chirish
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold">Yangi Yaqin Qo&apos;shish</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Qariindoshlik Turi</Label>
                      <Select
                        value={currentRelative.relationship_type}
                        onValueChange={(value) =>
                          setCurrentRelative({ ...currentRelative, relationship_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="father">Otasi</SelectItem>
                          <SelectItem value="mother">Onasi</SelectItem>
                          <SelectItem value="guardian">Vasiy</SelectItem>
                          <SelectItem value="sibling">Aka/Uka/Opa/Singil</SelectItem>
                          <SelectItem value="grandparent">Bobo/Buvi</SelectItem>
                          <SelectItem value="other">Boshqa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Telefon <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="+998901234568"
                        value={currentRelative.phone_number}
                        onChange={(e) =>
                          setCurrentRelative({ ...currentRelative, phone_number: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ism <span className="text-red-500">*</span></Label>
                      <Input
                        value={currentRelative.first_name}
                        onChange={(e) =>
                          setCurrentRelative({ ...currentRelative, first_name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Otasining ismi</Label>
                      <Input
                        value={currentRelative.middle_name}
                        onChange={(e) =>
                          setCurrentRelative({ ...currentRelative, middle_name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Familiya</Label>
                      <Input
                        value={currentRelative.last_name}
                        onChange={(e) =>
                          setCurrentRelative({ ...currentRelative, last_name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={currentRelative.email}
                        onChange={(e) =>
                          setCurrentRelative({ ...currentRelative, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ish Joyi</Label>
                      <Input
                        value={currentRelative.workplace}
                        onChange={(e) =>
                          setCurrentRelative({ ...currentRelative, workplace: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Lavozim</Label>
                      <Input
                        value={currentRelative.position}
                        onChange={(e) =>
                          setCurrentRelative({ ...currentRelative, position: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentRelative.is_primary_contact}
                        onChange={(e) =>
                          setCurrentRelative({
                            ...currentRelative,
                            is_primary_contact: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Asosiy Aloqa</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentRelative.is_guardian}
                        onChange={(e) =>
                          setCurrentRelative({
                            ...currentRelative,
                            is_guardian: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Vasiy</span>
                    </label>
                  </div>

                  <Button onClick={handleAddRelative} className="w-full">
                    Yaqin Qo&apos;shish
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Ma&apos;lumotlarni Tekshiring
                  </h3>
                  <p className="text-sm text-blue-700">
                    O&apos;quvchi yaratilgandan so&apos;ng, avtomatik balans va foydalanuvchi
                    akkaunti yaratiladi.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Asosiy Ma&apos;lumotlar</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><strong>Ism:</strong> {firstName} {middleName} {lastName}</p>
                      <p><strong>Telefon:</strong> {phoneNumber}</p>
                      <p><strong>Email:</strong> {email || "-"}</p>
                      <p><strong>Jinsi:</strong> {gender === "male" ? "Erkak" : "Ayol"}</p>
                      <p><strong>Tug&apos;ilgan Sana:</strong> {dateOfBirth || "-"}</p>
                    </div>
                  </div>

                  {(classId || subscriptionPlanId) && (
                    <div>
                      <h4 className="font-semibold mb-2">Sinf va Abonement</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        {classId && classId !== "none" && (
                          <p>
                            <strong>Sinf:</strong>{" "}
                            {classes.find((c) => c.id === classId)?.name || "-"}
                          </p>
                        )}
                        {subscriptionPlanId && subscriptionPlanId !== "none" && (
                          <>
                            <p>
                              <strong>Abonement:</strong>{" "}
                              {plans.find((p) => p.id === subscriptionPlanId)?.name || "-"}
                            </p>
                            {discountId && discountId !== "none" && (
                              <p className="text-green-700">
                                <strong>Chegirma:</strong>{" "}
                                {discounts.find((d: any) => d.id === discountId)?.name || "-"}
                              </p>
                            )}
                            {subscriptionStartDate && (
                              <p>
                                <strong>Boshlanish:</strong>{" "}
                                {new Date(subscriptionStartDate).toLocaleDateString("uz-UZ")}
                              </p>
                            )}
                            {subscriptionNextPaymentDate && (
                              <p>
                                <strong>Keyingi to&apos;lov:</strong>{" "}
                                {new Date(subscriptionNextPaymentDate).toLocaleDateString("uz-UZ")}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {relatives.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">
                        Yaqinlar ({relatives.length})
                      </h4>
                      <div className="space-y-2">
                        {relatives.map((relative, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium">
                              {relative.first_name} {relative.middle_name} {relative.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {relative.relationship_type} • {relative.phone_number}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1 || createStudentMutation.isPending}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Orqaga
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 1 && !canProceedStep1) ||
                createStudentMutation.isPending
              }
            >
              Keyingi
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createStudentMutation.isPending}
              className="gap-2"
            >
              {createStudentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Yaratilmoqda...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  O&apos;quvchi Yaratish
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
