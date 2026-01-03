"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  Clock,
  Edit,
  Trash2,
  Copy,
  Loader2,
  BookOpen,
  Users,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimetableGrid } from "@/lib/features/schedule/components/TimetableGrid";
import {
  useTimetableTemplates,
  useTimetableSlots,
} from "@/lib/features/schedule/hooks";
import { CreateTemplateDialog } from "@/components/schedule/CreateTemplateDialog";
import { EditTemplateDialog } from "@/components/schedule/EditTemplateDialog";
import { DeleteTemplateDialog } from "@/components/schedule/DeleteTemplateDialog";
import { CreateSlotDialog } from "@/components/schedule/CreateSlotDialog";
import { EditSlotDialog } from "@/components/schedule/EditSlotDialog";
import { DeleteSlotDialog } from "@/components/schedule/DeleteSlotDialog";
import { toast } from "sonner";
import type { TimetableSlot, TimetableTemplate } from "@/types/academic";

export default function BranchAdminSchedulePage() {
  const { currentBranch } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("templates");

  // Dialog states
  const [createTemplateOpen, setCreateTemplateOpen] = React.useState(false);
  const [editTemplateOpen, setEditTemplateOpen] = React.useState(false);
  const [deleteTemplateOpen, setDeleteTemplateOpen] = React.useState(false);
  const [createSlotOpen, setCreateSlotOpen] = React.useState(false);
  const [editSlotOpen, setEditSlotOpen] = React.useState(false);
  const [deleteSlotOpen, setDeleteSlotOpen] = React.useState(false);

  // Selected items for dialogs
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = React.useState<TimetableTemplate | null>(null);
  const [selectedSlotForEdit, setSelectedSlotForEdit] = React.useState<TimetableSlot | null>(null);

  const branchId = currentBranch?.branch_id;

  // Fetch timetable templates
  const { data: templates, isLoading: templatesLoading } = useTimetableTemplates(
    branchId || '',
    { is_active: true }
  );

  // Fetch timetable slots for selected template
  const { data: slotsData, isLoading: slotsLoading } = useTimetableSlots(
    branchId || '',
    selectedTemplate || '',
    {}
  );

  const slots = slotsData?.results || [];

  // Select first template by default
  React.useEffect(() => {
    if (templates?.results && templates.results.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates.results[0].id);
    }
  }, [templates, selectedTemplate]);

  // Handle slot click
  const handleSlotClick = (slot: TimetableSlot) => {
    setSelectedSlotForEdit(slot);
    setEditSlotOpen(true);
  };

  // Template actions
  const handleEditTemplate = (template: TimetableTemplate) => {
    setSelectedTemplateForEdit(template);
    setEditTemplateOpen(true);
  };

  const handleDeleteTemplate = (template: TimetableTemplate) => {
    setSelectedTemplateForEdit(template);
    setDeleteTemplateOpen(true);
  };

  // Slot actions
  const handleDeleteSlot = (slot: TimetableSlot) => {
    setSelectedSlotForEdit(slot);
    setDeleteSlotOpen(true);
  };

  if (!branchId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Filial tanlanmagan</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const selectedTemplateData = templates?.results?.find((t: TimetableTemplate) => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dars Jadvali</h1>
          <p className="text-gray-600 mt-1">
            Filial dars jadvalini boshqarish va ko&apos;rish
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setCreateTemplateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Yangi Shablon
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Shablonlar</TabsTrigger>
          <TabsTrigger value="schedule">Jadval Ko'rinishi</TabsTrigger>
          <TabsTrigger value="analytics">Statistika</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {/* Template Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Jadval Shablonlari</CardTitle>
            </CardHeader>
            <CardContent>
              {templates?.results && templates.results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.results.map((template: TimetableTemplate) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : ""
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1"
                            onClick={() => setSelectedTemplate(template.id)}
                          >
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {template.academic_year || 'O\'quv yili'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {template.is_active && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                Faol
                              </span>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTemplate(template);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Tahrirlash
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(template);
                                }} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  O&apos;chirish
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0" onClick={() => setSelectedTemplate(template.id)}>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{template.start_date} - {template.end_date}</span>
                          </div>
                          {template.description && (
                            <div className="flex items-start gap-2">
                              <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{template.description}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Jadval shablonlari topilmadi
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Dars jadvalini yaratish uchun avval shablon qo&apos;shing
                  </p>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setCreateTemplateOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yangi Shablon Yaratish
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Details */}
          {selectedTemplateData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Shablon: {selectedTemplateData.name}</CardTitle>
                  <Button
                    onClick={() => setCreateSlotOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Dars Vaqti Qo&apos;shish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">O&apos;quv yili</p>
                    <p className="font-semibold">
                      {selectedTemplateData.academic_year}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Boshlanish sanasi</p>
                    <p className="font-semibold">
                      {selectedTemplateData.start_date}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Tugash sanasi</p>
                    <p className="font-semibold">
                      {selectedTemplateData.end_date}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Holati</p>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                        selectedTemplateData.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedTemplateData.is_active ? "Faol" : "Nofaol"}
                    </span>
                  </div>
                </div>

                {/* Slots table */}
                {slotsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </div>
                ) : slots.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Kun
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Dars №
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Vaqt
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Sinf - Fan
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Xona
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                            Amallar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {slots.map((slot: TimetableSlot) => {
                          const dayNames: Record<number, string> = {
                            1: 'Dushanba',
                            2: 'Seshanba',
                            3: 'Chorshanba',
                            4: 'Payshanba',
                            5: 'Juma',
                            6: 'Shanba',
                            7: 'Yakshanba',
                          };
                          
                          return (
                            <tr key={slot.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                {dayNames[slot.day_of_week] || slot.day_of_week}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {slot.lesson_number}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {slot.start_time} - {slot.end_time}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {slot.class_subject?.class_name || '-'} - {slot.class_subject?.subject_name || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {slot.room || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSlotForEdit(slot);
                                      setEditSlotOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSlot(slot)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p>Ushbu shablon uchun dars vaqtlari mavjud emas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedule View Tab */}
        <TabsContent value="schedule" className="space-y-6">
          {selectedTemplate && slots.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Haftalik Jadval</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCreateSlotOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Dars Qo&apos;shish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TimetableGrid slots={slots} onSlotClick={handleSlotClick} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Dars jadvali bo&apos;sh
                </h3>
                <p className="text-gray-600 mb-4">
                  Tanlangan shablon uchun darslar mavjud emas
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setCreateSlotOpen(true)}
                  disabled={!selectedTemplate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dars Qo&apos;shish
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jami Darslar</CardTitle>
                <BookOpen className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{slots.length}</div>
                <p className="text-xs text-gray-600 mt-1">Haftalik</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">O'qituvchilar</CardTitle>
                <Users className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(slots.map((s: TimetableSlot) => s.class_subject?.teacher_id).filter(Boolean)).size}
                </div>
                <p className="text-xs text-gray-600 mt-1">Faol o'qituvchilar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fanlar</CardTitle>
                <BookOpen className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(slots.map((s: TimetableSlot) => s.class_subject?.subject_id).filter(Boolean)).size}
                </div>
                <p className="text-xs text-gray-600 mt-1">Noyob fanlar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Xonalar</CardTitle>
                <BookOpen className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {slots.filter((s: TimetableSlot) => s.room).length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Xonali darslar</p>
              </CardContent>
            </Card>
          </div>

          {/* Most Active Subjects */}
          <Card>
            <CardHeader>
              <CardTitle>Eng Ko'p O'qitiladigan Fanlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const subjectCounts = slots.reduce((acc: Map<string, number>, slot: TimetableSlot) => {
                    const subjectName = slot.class_subject?.subject_name || 'Noma\'lum';
                    acc.set(subjectName, (acc.get(subjectName) || 0) + 1);
                    return acc;
                  }, new Map<string, number>());
                  
                  return Array.from(subjectCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([subjectName, count]) => (
                    <div key={subjectName} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium">{subjectName}</span>
                      </div>
                      <span className="text-gray-600">{count} dars/hafta</span>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTemplateDialog
        open={createTemplateOpen}
        onOpenChange={setCreateTemplateOpen}
        branchId={branchId || ''}
      />

      <EditTemplateDialog
        open={editTemplateOpen}
        onOpenChange={setEditTemplateOpen}
        branchId={branchId || ''}
        template={selectedTemplateForEdit}
      />

      <DeleteTemplateDialog
        open={deleteTemplateOpen}
        onOpenChange={setDeleteTemplateOpen}
        branchId={branchId || ''}
        template={selectedTemplateForEdit}
      />

      {selectedTemplate && (
        <>
          <CreateSlotDialog
            open={createSlotOpen}
            onOpenChange={setCreateSlotOpen}
            branchId={branchId || ''}
            templateId={selectedTemplate}
          />

          <EditSlotDialog
            open={editSlotOpen}
            onOpenChange={setEditSlotOpen}
            branchId={branchId || ''}
            templateId={selectedTemplate}
            slot={selectedSlotForEdit}
          />

          <DeleteSlotDialog
            open={deleteSlotOpen}
            onOpenChange={setDeleteSlotOpen}
            branchId={branchId || ''}
            templateId={selectedTemplate}
            slot={selectedSlotForEdit}
          />
        </>
      )}
    </div>
  );
}
