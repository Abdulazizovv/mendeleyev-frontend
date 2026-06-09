"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
import type { Group, GroupMembership, Student } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Plus,
  Trash2,
  Search,
  Loader2,
  ArrowLeft,
  GraduationCap,
  User,
  BookOpen,
  DollarSign,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import { formatCurrency } from "@/lib/utils";

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const groupId = params.id as string;

  const [group, setGroup] = React.useState<Group | null>(null);
  const [members, setMembers] = React.useState<GroupMembership[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [membersLoading, setMembersLoading] = React.useState(true);

  // Add member dialog
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState("");
  const [students, setStudents] = React.useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = React.useState(false);
  const [addingId, setAddingId] = React.useState<string | null>(null);

  // Remove member
  const [removeTarget, setRemoveTarget] = React.useState<GroupMembership | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const fetchGroup = React.useCallback(async () => {
    if (!branchId || !groupId) return;
    try {
      const data = await schoolApi.getGroup(branchId, groupId);
      setGroup(data);
    } catch {
      toast.error("Guruh ma'lumotlari yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, [branchId, groupId]);

  const fetchMembers = React.useCallback(async () => {
    if (!branchId || !groupId) return;
    try {
      setMembersLoading(true);
      const data = await schoolApi.getGroupMembers(branchId, groupId);
      setMembers(data);
    } catch {
      toast.error("A'zolar yuklanmadi");
    } finally {
      setMembersLoading(false);
    }
  }, [branchId, groupId]);

  React.useEffect(() => {
    fetchGroup();
    fetchMembers();
  }, [fetchGroup, fetchMembers]);

  // Search students for adding
  React.useEffect(() => {
    if (!addDialogOpen || !branchId) return;
    const timeout = setTimeout(async () => {
      try {
        setStudentsLoading(true);
        const data = await schoolApi.getStudents(branchId, {
          search: studentSearch || undefined,
          page_size: 30,
        });
        // Filter out already-added members
        const memberIds = new Set(members.map((m) => m.student));
        const available = data.results.filter((s) => !memberIds.has(s.id));
        setStudents(available);
      } catch {
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [addDialogOpen, studentSearch, branchId, members]);

  const handleAddMember = async (studentId: string) => {
    if (!branchId) return;
    try {
      setAddingId(studentId);
      await schoolApi.addGroupMember(branchId, groupId, studentId);
      await fetchMembers();
      await fetchGroup(); // refresh members_count
      const student = students.find((s) => s.id === studentId);
      toast.success(`${student?.full_name ?? "O'quvchi"} guruhga qo'shildi`);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      toast.error(extractApiError(err) ?? "Qo'shishda xatolik");
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!branchId || !removeTarget) return;
    try {
      setRemoving(true);
      await schoolApi.removeGroupMember(branchId, groupId, removeTarget.id);
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      await fetchGroup();
      toast.success(`${removeTarget.student_name} guruhdan chiqarildi`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(extractApiError(err) ?? "Chiqarishda xatolik");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <p className="text-gray-500">Guruh topilmadi</p>
        <Button variant="outline" onClick={() => router.push("/school/groups")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Orqaga
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/school/groups")}
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              {group.name}
            </h1>
            {group.is_active ? (
              <Badge className="bg-green-100 text-green-800">Faol</Badge>
            ) : (
              <Badge variant="secondary">Nofaol</Badge>
            )}
          </div>
          {group.description && (
            <p className="text-sm text-gray-500 ml-10">{group.description}</p>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <BookOpen className="w-9 h-9 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Fan / Daraja</p>
              {group.subject_level_detail ? (
                <>
                  <p className="font-medium text-sm">{group.subject_level_detail.subject_name}</p>
                  <p className="text-xs text-gray-500">{group.subject_level_detail.name}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Belgilanmagan</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <DollarSign className="w-9 h-9 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Dars narxi</p>
              <p className="font-bold text-lg">
                {group.subject_level_detail
                  ? formatCurrency(group.subject_level_detail.lesson_price)
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <User className="w-9 h-9 text-purple-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">O'qituvchi</p>
              <p className="font-medium text-sm">{group.teacher_name ?? "Belgilanmagan"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <GraduationCap className="w-9 h-9 text-orange-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">O'quvchilar</p>
              <p className="font-bold text-lg">
                {group.members_count}
                <span className="text-sm text-gray-400 font-normal"> / {group.max_students}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-4 h-4" />
              Guruh a'zolari
              <Badge variant="secondary">{members.length}</Badge>
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setStudentSearch("");
                setAddDialogOpen(true);
              }}
              disabled={group.members_count >= group.max_students}
            >
              <Plus className="w-4 h-4 mr-1" />
              O'quvchi qo'shish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-10">
              <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Guruhda hali o'quvchi yo'q</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                O'quvchi qo'shish
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>O'quvchi</TableHead>
                  <TableHead>Shaxsiy raqam</TableHead>
                  <TableHead>Qo'shilgan sana</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member, idx) => (
                  <TableRow key={member.id}>
                    <TableCell className="text-gray-500">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{member.student_name}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {member.student_personal_number ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(member.enrollment_date).toLocaleDateString("uz-UZ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.is_active ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Faol
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <XCircle className="w-3 h-3 mr-1" />
                          Nofaol
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveTarget(member)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>O'quvchi qo'shish</DialogTitle>
            <DialogDescription>
              Guruhga qo'shmoqchi bo'lgan o'quvchini qidiring
            </DialogDescription>
          </DialogHeader>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Ism, familiya yoki telefon bo'yicha qidiring..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto mt-2 space-y-1 min-h-[200px]">
            {studentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {studentSearch ? "O'quvchi topilmadi" : "O'quvchilar yuklanmoqda..."}
              </div>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-sm">{student.full_name}</p>
                    <p className="text-xs text-gray-500">{student.phone_number}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddMember(student.id)}
                    disabled={addingId === student.id}
                  >
                    {addingId === student.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirm */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'quvchini guruhdan chiqarish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{removeTarget?.student_name}</span> ni guruhdan
              chiqarishni tasdiqlaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Chiqarish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
