"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Building2,
  Clock,
  DollarSign,
  Save,
  Loader2,
  Calendar,
  Bell,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function BranchSettingsPage() {
  const { currentBranch, user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("general");

  // General settings state
  const [generalSettings, setGeneralSettings] = React.useState({
    branchName: currentBranch?.branch_name || "",
    branchType: currentBranch?.branch_type || "",
    address: "",
    phone: "",
    email: "",
  });

  // Academic settings state
  const [academicSettings, setAcademicSettings] = React.useState({
    academicYearStart: "2024-09-01",
    academicYearEnd: "2025-06-30",
    quarterCount: 4,
    lessonDuration: 45,
    breakDuration: 10,
    lunchBreakDuration: 30,
  });

  // Financial settings state
  const [financialSettings, setFinancialSettings] = React.useState({
    currency: "UZS",
    paymentDueDay: 5,
    latePaymentFee: 50000,
    enableAutoReminders: true,
    reminderDaysBefore: 3,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = React.useState({
    enableSMS: true,
    enableEmail: false,
    enablePush: true,
    attendanceNotifications: true,
    gradeNotifications: true,
    paymentNotifications: true,
    homeworkNotifications: true,
  });

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save general settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Umumiy sozlamalar saqlandi");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAcademic = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save academic settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("O'quv sozlamalari saqlandi");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinancial = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save financial settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Moliya sozlamalari saqlandi");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save notification settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Bildirishnoma sozlamalari saqlandi");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Filial Sozlamalari</h1>
          <p className="text-gray-600 mt-1">
            Filial konfiguratsiyasi va sozlamalarini boshqarish
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Building2 className="w-4 h-4 mr-2" />
            Umumiy
          </TabsTrigger>
          <TabsTrigger value="academic">
            <Calendar className="w-4 h-4 mr-2" />
            O'quv
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="w-4 h-4 mr-2" />
            Moliya
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Bildirishnomalar
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Umumiy Ma'lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="branchName">Filial nomi</Label>
                  <Input
                    id="branchName"
                    value={generalSettings.branchName}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, branchName: e.target.value })
                    }
                    placeholder="Filial nomini kiriting"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchType">Filial turi</Label>
                  <Input
                    id="branchType"
                    value={generalSettings.branchType === "school" ? "Maktab" : "O'quv Markazi"}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Manzil</Label>
                  <Input
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, address: e.target.value })
                    }
                    placeholder="Filial manzilini kiriting"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={generalSettings.phone}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, phone: e.target.value })
                    }
                    placeholder="+998 XX XXX-XX-XX"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={generalSettings.email}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, email: e.target.value })
                    }
                    placeholder="example@school.uz"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveGeneral}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Settings */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>O'quv Yili Sozlamalari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="academicYearStart">O'quv yili boshlanishi</Label>
                  <Input
                    id="academicYearStart"
                    type="date"
                    value={academicSettings.academicYearStart}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        academicYearStart: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYearEnd">O'quv yili tugashi</Label>
                  <Input
                    id="academicYearEnd"
                    type="date"
                    value={academicSettings.academicYearEnd}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        academicYearEnd: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quarterCount">Choraklar soni</Label>
                  <Input
                    id="quarterCount"
                    type="number"
                    min="2"
                    max="4"
                    value={academicSettings.quarterCount}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        quarterCount: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dars Sozlamalari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lessonDuration">Dars davomiyligi (daqiqa)</Label>
                  <Input
                    id="lessonDuration"
                    type="number"
                    min="30"
                    max="90"
                    value={academicSettings.lessonDuration}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        lessonDuration: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakDuration">Tanaffus davomiyligi (daqiqa)</Label>
                  <Input
                    id="breakDuration"
                    type="number"
                    min="5"
                    max="30"
                    value={academicSettings.breakDuration}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        breakDuration: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lunchBreakDuration">Tushlik tanaffusi (daqiqa)</Label>
                  <Input
                    id="lunchBreakDuration"
                    type="number"
                    min="15"
                    max="60"
                    value={academicSettings.lunchBreakDuration}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        lunchBreakDuration: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAcademic}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Settings */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>To'lov Sozlamalari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Valyuta</Label>
                  <Input id="currency" value={financialSettings.currency} disabled className="bg-gray-50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDueDay">To'lov muddati (oy kuni)</Label>
                  <Input
                    id="paymentDueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={financialSettings.paymentDueDay}
                    onChange={(e) =>
                      setFinancialSettings({
                        ...financialSettings,
                        paymentDueDay: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latePaymentFee">Kechikish jarima (UZS)</Label>
                  <Input
                    id="latePaymentFee"
                    type="number"
                    min="0"
                    value={financialSettings.latePaymentFee}
                    onChange={(e) =>
                      setFinancialSettings({
                        ...financialSettings,
                        latePaymentFee: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminderDaysBefore">Eslatma kunlar oldin</Label>
                  <Input
                    id="reminderDaysBefore"
                    type="number"
                    min="1"
                    max="10"
                    value={financialSettings.reminderDaysBefore}
                    onChange={(e) =>
                      setFinancialSettings({
                        ...financialSettings,
                        reminderDaysBefore: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <input
                  type="checkbox"
                  id="enableAutoReminders"
                  checked={financialSettings.enableAutoReminders}
                  onChange={(e) =>
                    setFinancialSettings({
                      ...financialSettings,
                      enableAutoReminders: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <Label htmlFor="enableAutoReminders" className="cursor-pointer">
                  Avtomatik eslatmalarni yoqish
                </Label>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveFinancial}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bildirishnoma Kanallari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enableSMS">SMS Bildirishnomalar</Label>
                  <p className="text-sm text-gray-600">
                    SMS orqali bildirishnoma yuborish
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="enableSMS"
                  checked={notificationSettings.enableSMS}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      enableSMS: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enableEmail">Email Bildirishnomalar</Label>
                  <p className="text-sm text-gray-600">
                    Email orqali bildirishnoma yuborish
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="enableEmail"
                  checked={notificationSettings.enableEmail}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      enableEmail: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enablePush">Push Bildirishnomalar</Label>
                  <p className="text-sm text-gray-600">
                    Mobil ilovaga push yuborish
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="enablePush"
                  checked={notificationSettings.enablePush}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      enablePush: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bildirishnoma Turlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="attendanceNotifications">Davomat</Label>
                  <p className="text-sm text-gray-600">
                    Davomat haqida bildirishnomalar
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="attendanceNotifications"
                  checked={notificationSettings.attendanceNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      attendanceNotifications: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="gradeNotifications">Baholar</Label>
                  <p className="text-sm text-gray-600">
                    Baholar haqida bildirishnomalar
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="gradeNotifications"
                  checked={notificationSettings.gradeNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      gradeNotifications: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="paymentNotifications">To'lovlar</Label>
                  <p className="text-sm text-gray-600">
                    To'lovlar haqida bildirishnomalar
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="paymentNotifications"
                  checked={notificationSettings.paymentNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      paymentNotifications: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="homeworkNotifications">Uyga vazifalar</Label>
                  <p className="text-sm text-gray-600">
                    Uyga vazifalar haqida bildirishnomalar
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="homeworkNotifications"
                  checked={notificationSettings.homeworkNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      homeworkNotifications: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
