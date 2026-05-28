"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  Clock,
  DollarSign,
  Save,
  Loader2,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Package,
  BarChart3,
  BadgePercent,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchApi } from "@/lib/api/branch";
import type { BranchSettings, UpdateBranchSettingsPayload } from "@/types/school";

const MONTHS = [
  { value: 1, label: "Yanvar" },
  { value: 2, label: "Fevral" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Aprel" },
  { value: 5, label: "May" },
  { value: 6, label: "Iyun" },
  { value: 7, label: "Iyul" },
  { value: 8, label: "Avgust" },
  { value: 9, label: "Sentabr" },
  { value: 10, label: "Oktabr" },
  { value: 11, label: "Noyabr" },
  { value: 12, label: "Dekabr" },
];

const financeConfigItems = [
  {
    label: "Kassalar",
    description: "Naqd va karta kassalarini boshqarish",
    href: "/school/finance/cash-registers",
    icon: Building2,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    label: "Abonement tariflari",
    description: "O'quvchilar uchun to'lov rejalari",
    href: "/school/finance/subscription-plans",
    icon: Package,
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    label: "Kategoriyalar",
    description: "Kirim va chiqim kategoriyalari",
    href: "/school/finance/categories",
    icon: BarChart3,
    color: "bg-teal-50 text-teal-600 border-teal-100",
  },
  {
    label: "Chegirmalar",
    description: "Foiz yoki miqdor chegirmalari",
    href: "/school/finance/discounts",
    icon: BadgePercent,
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
];


export default function BranchSettingsPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id;

  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ["branch-settings", branchId],
    queryFn: () => branchApi.getBranchSettings(branchId!),
    enabled: !!branchId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBranchSettingsPayload) =>
      branchApi.updateBranchSettings(branchId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-settings", branchId] });
      toast.success("Sozlamalar muvaffaqiyatli saqlandi");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Xatolik yuz berdi");
    },
  });

  // Form states
  const [scheduleSettings, setScheduleSettings] = React.useState({
    lesson_duration_minutes: 45,
    break_duration_minutes: 10,
    school_start_time: "08:00:00",
    school_end_time: "17:00:00",
  });

  const [academicSettings, setAcademicSettings] = React.useState({
    academic_year_start_month: 9,
    academic_year_end_month: 6,
  });

  const [salarySettings, setSalarySettings] = React.useState({
    salary_calculation_time: "00:00:00",
    auto_calculate_salary: true,
    salary_calculation_day: 1,
  });

  const [financeSettings, setFinanceSettings] = React.useState({
    late_payment_penalty_percent: "0.00",
    early_payment_discount_percent: "0.00",
  });

  const [workSettings, setWorkSettings] = React.useState({
    work_days_per_week: 6,
    work_hours_per_day: 8,
  });

  React.useEffect(() => {
    if (!settings) return;
    setScheduleSettings({
      lesson_duration_minutes: settings.lesson_duration_minutes,
      break_duration_minutes: settings.break_duration_minutes,
      school_start_time: settings.school_start_time,
      school_end_time: settings.school_end_time,
    });
    setAcademicSettings({
      academic_year_start_month: settings.academic_year_start_month,
      academic_year_end_month: settings.academic_year_end_month,
    });
    setSalarySettings({
      salary_calculation_time: settings.salary_calculation_time,
      auto_calculate_salary: settings.auto_calculate_salary,
      salary_calculation_day: settings.salary_calculation_day,
    });
    setFinanceSettings({
      late_payment_penalty_percent: settings.late_payment_penalty_percent,
      early_payment_discount_percent: settings.early_payment_discount_percent,
    });
    setWorkSettings({
      work_days_per_week: settings.work_days_per_week,
      work_hours_per_day: settings.work_hours_per_day,
    });
  }, [settings]);

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Filial tanlanmagan</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Sozlamalar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sozlamalarni yuklashda xatolik yuz berdi
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4 w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Qayta urinish
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sozlamalar</h1>
          <p className="text-gray-600 mt-1">{settings?.branch_name} — filial konfiguratsiyasi</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="hidden sm:inline">
            Yangilanish: {new Date(settings?.updated_at || "").toLocaleString("uz-UZ")}
          </span>
        </div>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="schedule" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
            <Clock className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Dars Jadvali</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Akademik</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
            <DollarSign className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Moliya</span>
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Maosh</span>
          </TabsTrigger>
          <TabsTrigger value="work" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Ish Vaqti</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Schedule ── */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dars Jadvali Sozlamalari</CardTitle>
              <CardDescription>Dars va tanaffus davomiyligini, maktab ish vaqtini sozlang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lessonDuration">Dars davomiyligi (daqiqa)</Label>
                  <Input
                    id="lessonDuration"
                    type="number"
                    min="30"
                    max="90"
                    value={scheduleSettings.lesson_duration_minutes}
                    onChange={(e) =>
                      setScheduleSettings({ ...scheduleSettings, lesson_duration_minutes: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-gray-500">Standart: 45 daqiqa</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakDuration">Tanaffus davomiyligi (daqiqa)</Label>
                  <Input
                    id="breakDuration"
                    type="number"
                    min="5"
                    max="30"
                    value={scheduleSettings.break_duration_minutes}
                    onChange={(e) =>
                      setScheduleSettings({ ...scheduleSettings, break_duration_minutes: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-gray-500">Standart: 10 daqiqa</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolStart">Darslar boshlanish vaqti</Label>
                  <Input
                    id="schoolStart"
                    type="time"
                    step="1"
                    value={scheduleSettings.school_start_time}
                    onChange={(e) =>
                      setScheduleSettings({
                        ...scheduleSettings,
                        school_start_time: e.target.value + (e.target.value.length === 5 ? ":00" : ""),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolEnd">Darslar tugash vaqti</Label>
                  <Input
                    id="schoolEnd"
                    type="time"
                    step="1"
                    value={scheduleSettings.school_end_time}
                    onChange={(e) =>
                      setScheduleSettings({
                        ...scheduleSettings,
                        school_end_time: e.target.value + (e.target.value.length === 5 ? ":00" : ""),
                      })
                    }
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Dars jadvali sozlamalari avtomatik ravishda barcha yangi dars jadvallariga qo&apos;llaniladi
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateMutation.mutate(scheduleSettings)}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saqlanmoqda...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Saqlash</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Academic ── */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Akademik Yil Sozlamalari</CardTitle>
              <CardDescription>O&apos;quv yilining boshlanish va tugash oylarini belgilang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Akademik yil boshlanish oyi</Label>
                  <Select
                    value={String(academicSettings.academic_year_start_month)}
                    onValueChange={(v) =>
                      setAcademicSettings({ ...academicSettings, academic_year_start_month: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Standart: Sentabr</p>
                </div>

                <div className="space-y-2">
                  <Label>Akademik yil tugash oyi</Label>
                  <Select
                    value={String(academicSettings.academic_year_end_month)}
                    onValueChange={(v) =>
                      setAcademicSettings({ ...academicSettings, academic_year_end_month: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Standart: Iyun</p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Bu sozlamalar yangi akademik yillar yaratishda foydalaniladi</AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateMutation.mutate(academicSettings)}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saqlanmoqda...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Saqlash</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Finance (new) ── */}
        <TabsContent value="finance" className="space-y-6">
          {/* Currency info */}
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-base">Valyuta Ma&apos;lumotlari</CardTitle>
              <CardDescription>Tizim tomonidan boshqariladi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">Valyuta kodi</Label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{settings?.currency || "UZS"}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Valyuta belgisi</Label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{settings?.currency_symbol || "so'm"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment penalty / discount */}
          <Card>
            <CardHeader>
              <CardTitle>To&apos;lov Sozlamalari</CardTitle>
              <CardDescription>Kechikish jarimasi va erta to&apos;lash chegirmasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lateFee">Kechikish jarimasi (%)</Label>
                  <Input
                    id="lateFee"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={financeSettings.late_payment_penalty_percent}
                    onChange={(e) =>
                      setFinanceSettings({ ...financeSettings, late_payment_penalty_percent: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">Muddatidan keyin to&apos;lansa qo&apos;llaniladigan jarima</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="earlyDiscount">Erta to&apos;lash chegirmasi (%)</Label>
                  <Input
                    id="earlyDiscount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={financeSettings.early_payment_discount_percent}
                    onChange={(e) =>
                      setFinanceSettings({ ...financeSettings, early_payment_discount_percent: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">Muddatidan oldin to&apos;lansa beriladigan chegirma</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2 text-sm">Hisoblash namunasi (1 000 000 so&apos;m)</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    Kechikish jarimasi:{" "}
                    <span className="font-semibold">
                      +{(1000000 * parseFloat(financeSettings.late_payment_penalty_percent || "0") / 100).toLocaleString()} so&apos;m
                    </span>
                  </p>
                  <p>
                    Erta to&apos;lash chegirmasi:{" "}
                    <span className="font-semibold">
                      -{(1000000 * parseFloat(financeSettings.early_payment_discount_percent || "0") / 100).toLocaleString()} so&apos;m
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateMutation.mutate(financeSettings)}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saqlanmoqda...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Saqlash</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Finance config links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Moliya konfiguratsiyasi</h3>
            <p className="text-sm text-gray-500 mb-4">
              Kassalar, abonement tariflari, kategoriyalar va chegirmalarni boshqaring
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {financeConfigItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-blue-200">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Salary ── */}
        <TabsContent value="salary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maosh Hisoblash Sozlamalari</CardTitle>
              <CardDescription>Avtomatik maosh hisoblash va to&apos;lash parametrlari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="salaryTime">Maosh hisoblash vaqti</Label>
                  <Input
                    id="salaryTime"
                    type="time"
                    step="1"
                    value={salarySettings.salary_calculation_time}
                    onChange={(e) =>
                      setSalarySettings({
                        ...salarySettings,
                        salary_calculation_time: e.target.value + (e.target.value.length === 5 ? ":00" : ""),
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">Celery Beat har kuni shu vaqtda ishga tushadi</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryDay">Maosh to&apos;lash kuni (oyning)</Label>
                  <Input
                    id="salaryDay"
                    type="number"
                    min="1"
                    max="31"
                    value={salarySettings.salary_calculation_day}
                    onChange={(e) =>
                      setSalarySettings({ ...salarySettings, salary_calculation_day: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-gray-500">1–31 oralig&apos;ida</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="autoCalculate" className="text-base cursor-pointer">
                    Avtomatik maosh hisoblash
                  </Label>
                  <p className="text-sm text-gray-600">
                    Har kuni avtomatik ravishda xodimlarning oylik maoshini hisoblash
                  </p>
                </div>
                <Switch
                  id="autoCalculate"
                  checked={salarySettings.auto_calculate_salary}
                  onCheckedChange={(checked) =>
                    setSalarySettings({ ...salarySettings, auto_calculate_salary: checked })
                  }
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Avtomatik hisoblash o&apos;chirilgan bo&apos;lsa, faqat qo&apos;lda maosh qo&apos;shish mumkin
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateMutation.mutate(salarySettings)}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saqlanmoqda...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Saqlash</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Work ── */}
        <TabsContent value="work" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ish Vaqti Sozlamalari</CardTitle>
              <CardDescription>Xodimlar ish vaqti va kunlarini belgilang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="workDays">Haftada ish kunlari</Label>
                  <Input
                    id="workDays"
                    type="number"
                    min="1"
                    max="7"
                    value={workSettings.work_days_per_week}
                    onChange={(e) =>
                      setWorkSettings({ ...workSettings, work_days_per_week: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-gray-500">1–7 oralig&apos;ida</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workHours">Kunlik ish soatlari</Label>
                  <Input
                    id="workHours"
                    type="number"
                    min="1"
                    max="24"
                    value={workSettings.work_hours_per_day}
                    onChange={(e) =>
                      setWorkSettings({ ...workSettings, work_hours_per_day: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-gray-500">Standart: 8 soat</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Hisoblash</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    Haftalik ish soatlari:{" "}
                    <span className="font-semibold">
                      {workSettings.work_days_per_week * workSettings.work_hours_per_day} soat
                    </span>
                  </p>
                  <p>
                    Oylik ish soatlari (4.3 hafta):{" "}
                    <span className="font-semibold">
                      {Math.round(workSettings.work_days_per_week * workSettings.work_hours_per_day * 4.3)} soat
                    </span>
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bu sozlamalar xodimlar soatlik maoshini hisoblashda ishlatiladi
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateMutation.mutate(workSettings)}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saqlanmoqda...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Saqlash</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
