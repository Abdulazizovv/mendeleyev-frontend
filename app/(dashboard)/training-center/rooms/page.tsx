"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Room, CreateBuildingRequest, CreateRoomRequest, RoomType, EquipmentItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Users,
  FlaskConical,
  BookOpen,
  Dumbbell,
  Briefcase,
  Theater,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Home,
  MapPin,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

const roomTypeIcons: Record<RoomType, React.ElementType> = {
  classroom: Users,
  lab: FlaskConical,
  library: BookOpen,
  gym: Dumbbell,
  office: Briefcase,
  auditorium: Theater,
  other: MoreHorizontal,
};

const roomTypeLabels: Record<RoomType, string> = {
  classroom: "Dars xonasi",
  lab: "Laboratoriya",
  library: "Kutubxona",
  gym: "Sport zali",
  office: "Ofis",
  auditorium: "Auditoriya",
  other: "Boshqa",
};

const roomTypeColors: Record<RoomType, string> = {
  classroom: "bg-blue-50 text-blue-600",
  lab: "bg-purple-50 text-purple-600",
  library: "bg-amber-50 text-amber-600",
  gym: "bg-green-50 text-green-600",
  office: "bg-gray-50 text-gray-600",
  auditorium: "bg-rose-50 text-rose-600",
  other: "bg-slate-50 text-slate-600",
};

export default function RoomsPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id || "";

  const [expandedBuildings, setExpandedBuildings] = React.useState<Set<string>>(new Set());
  const [buildingDialog, setBuildingDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: Building;
  }>({ open: false, mode: "create" });
  const [roomDialog, setRoomDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: Room;
    preselectedBuilding?: string;
  }>({ open: false, mode: "create" });
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    type: "building" | "room";
    id?: string;
    name?: string;
  }>({ open: false, type: "building" });

  const [buildingForm, setBuildingForm] = React.useState<CreateBuildingRequest & { floorsStr: string }>({
    name: "",
    address: "",
    floors: 1,
    floorsStr: "1",
    description: "",
    is_active: true,
  });

  const [roomForm, setRoomForm] = React.useState<CreateRoomRequest & { floorStr: string; capacityStr: string }>({
    building: "",
    name: "",
    room_type: "classroom",
    floor: 1,
    floorStr: "1",
    capacity: 30,
    capacityStr: "30",
    equipment: [],
    is_active: true,
  });

  const [equipmentItem, setEquipmentItem] = React.useState<EquipmentItem & { quantityStr: string }>({
    name: "",
    quantity: 1,
    quantityStr: "1",
    unit: "dona",
  });

  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ["buildings", branchId],
    queryFn: () => schoolApi.getBuildings(branchId),
    enabled: !!branchId,
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms", branchId],
    queryFn: () => schoolApi.getRooms(branchId),
    enabled: !!branchId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["buildings", branchId] });
    queryClient.invalidateQueries({ queryKey: ["rooms", branchId] });
  };

  const createBuildingMutation = useMutation({
    mutationFn: (data: CreateBuildingRequest) => schoolApi.createBuilding(branchId, data),
    onSuccess: (_, vars) => {
      invalidate();
      setBuildingDialog({ open: false, mode: "create" });
      toast.success("Bino yaratildi");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || e?.response?.data?.name?.[0] || "Xatolik yuz berdi"),
  });

  const updateBuildingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBuildingRequest> }) =>
      schoolApi.updateBuilding(branchId, id, data),
    onSuccess: () => {
      invalidate();
      setBuildingDialog({ open: false, mode: "create" });
      toast.success("Bino yangilandi");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || e?.response?.data?.name?.[0] || "Xatolik yuz berdi"),
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: (id: string) => schoolApi.deleteBuilding(branchId, id),
    onSuccess: () => {
      invalidate();
      setDeleteDialog({ open: false, type: "building" });
      toast.success("Bino o'chirildi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const createRoomMutation = useMutation({
    mutationFn: (data: CreateRoomRequest) => schoolApi.createRoom(branchId, data),
    onSuccess: () => {
      invalidate();
      setRoomDialog({ open: false, mode: "create" });
      toast.success("Xona yaratildi");
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.detail ||
          e?.response?.data?.building?.[0] ||
          e?.response?.data?.name?.[0] ||
          "Xatolik yuz berdi"
      ),
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoomRequest> }) =>
      schoolApi.updateRoom(branchId, id, data),
    onSuccess: () => {
      invalidate();
      setRoomDialog({ open: false, mode: "create" });
      toast.success("Xona yangilandi");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || e?.response?.data?.name?.[0] || "Xatolik yuz berdi"),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => schoolApi.deleteRoom(branchId, id),
    onSuccess: () => {
      invalidate();
      setDeleteDialog({ open: false, type: "building" });
      toast.success("Xona o'chirildi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const resetBuildingForm = () =>
    setBuildingForm({ name: "", address: "", floors: 1, floorsStr: "1", description: "", is_active: true });

  const resetRoomForm = () => {
    setRoomForm({ building: "", name: "", room_type: "classroom", floor: 1, floorStr: "1", capacity: 30, capacityStr: "30", equipment: [], is_active: true });
    setEquipmentItem({ name: "", quantity: 1, quantityStr: "1", unit: "dona" });
  };

  const openCreateBuilding = () => {
    resetBuildingForm();
    setBuildingDialog({ open: true, mode: "create" });
  };

  const openEditBuilding = (b: Building) => {
    setBuildingForm({ name: b.name, address: b.address || "", floors: b.floors, floorsStr: String(b.floors), description: b.description || "", is_active: b.is_active });
    setBuildingDialog({ open: true, mode: "edit", data: b });
  };

  const openCreateRoom = (buildingId?: string) => {
    resetRoomForm();
    if (buildingId) setRoomForm((p) => ({ ...p, building: buildingId }));
    setRoomDialog({ open: true, mode: "create", preselectedBuilding: buildingId });
  };

  const openEditRoom = (room: Room) => {
    setRoomForm({ building: room.building, name: room.name, room_type: room.room_type, floor: room.floor, floorStr: String(room.floor), capacity: room.capacity, capacityStr: String(room.capacity), equipment: room.equipment || [], is_active: room.is_active });
    setRoomDialog({ open: true, mode: "edit", data: room });
  };

  const handleBuildingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { floorsStr, ...data } = buildingForm;
    if (buildingDialog.mode === "create") createBuildingMutation.mutate(data);
    else if (buildingDialog.data) updateBuildingMutation.mutate({ id: buildingDialog.data.id, data });
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { floorStr, capacityStr, ...data } = roomForm;
    if (roomDialog.mode === "create") createRoomMutation.mutate(data);
    else if (roomDialog.data) updateRoomMutation.mutate({ id: roomDialog.data.id, data });
  };

  const handleDeleteConfirm = () => {
    if (!deleteDialog.id) return;
    if (deleteDialog.type === "building") deleteBuildingMutation.mutate(deleteDialog.id);
    else deleteRoomMutation.mutate(deleteDialog.id);
  };

  const addEquipment = () => {
    if (!equipmentItem.name.trim() || equipmentItem.quantity <= 0 || !equipmentItem.unit.trim()) return;
    const { quantityStr, ...item } = equipmentItem;
    setRoomForm((p) => ({ ...p, equipment: [...(p.equipment || []), item] }));
    setEquipmentItem({ name: "", quantity: 1, quantityStr: "1", unit: "dona" });
  };

  const toggleBuilding = (id: string) => {
    setExpandedBuildings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalRooms = rooms.length;
  const activeRooms = rooms.filter((r) => r.is_active).length;

  if (buildingsLoading || roomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bino va Xonalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {buildings.length} ta bino • {totalRooms} ta xona ({activeRooms} ta faol)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openCreateBuilding}>
            <Building2 className="w-4 h-4 mr-2" />
            Bino qo&apos;shish
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openCreateRoom()}>
            <Plus className="w-4 h-4 mr-2" />
            Xona qo&apos;shish
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{buildings.length}</p>
            <p className="text-xs text-gray-500">Jami binolar</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Home className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalRooms}</p>
            <p className="text-xs text-gray-500">Jami xonalar</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {rooms.reduce((s, r) => s + r.capacity, 0)}
            </p>
            <p className="text-xs text-gray-500">Jami sig&apos;im</p>
          </div>
        </div>
      </div>

      {/* Buildings with rooms */}
      {buildings.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-16">
          <Building2 className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">Binolar topilmadi</h3>
          <p className="text-sm text-gray-500 mb-4">Avval bino qo&apos;shing, so&apos;ng xonalar yarating</p>
          <Button onClick={openCreateBuilding} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Bino qo&apos;shish
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {buildings.map((building) => {
            const buildingRooms = rooms.filter((r) => r.building === building.id);
            const isExpanded = expandedBuildings.has(building.id);
            return (
              <div
                key={building.id}
                className={`bg-white rounded-xl border transition-all ${
                  building.is_active ? "border-gray-200" : "border-gray-100 opacity-70"
                }`}
              >
                {/* Building Header */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleBuilding(building.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{building.name}</span>
                        {!building.is_active && (
                          <Badge variant="secondary" className="text-xs">Nofaol</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {building.address && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {building.address}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {building.floors} qavat
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg mr-2">
                      <Home className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600">{buildingRooms.length} ta xona</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-gray-700"
                      onClick={() => openEditBuilding(building)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() =>
                        setDeleteDialog({ open: true, type: "building", id: building.id, name: building.name })
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded: Rooms Grid */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">Xonalar</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => openCreateRoom(building.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Xona qo&apos;shish
                      </Button>
                    </div>

                    {buildingRooms.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
                        <Home className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">Bu binoda xonalar yo&apos;q</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-blue-600"
                          onClick={() => openCreateRoom(building.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Xona qo&apos;shish
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {buildingRooms.map((room) => {
                          const RoomIcon = roomTypeIcons[room.room_type];
                          const colorClass = roomTypeColors[room.room_type];
                          return (
                            <div
                              key={room.id}
                              className={`rounded-lg border p-3 flex flex-col gap-2 ${
                                room.is_active ? "border-gray-100 bg-gray-50/50" : "border-gray-100 bg-gray-50 opacity-60"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colorClass}`}>
                                    <RoomIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{room.name}</p>
                                    <p className="text-xs text-gray-500">{roomTypeLabels[room.room_type]}</p>
                                  </div>
                                </div>
                                {!room.is_active && (
                                  <Badge variant="secondary" className="text-xs">Nofaol</Badge>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{room.floor}-qavat</span>
                                <span>{room.capacity} kishi</span>
                              </div>

                              {room.equipment && room.equipment.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {room.equipment.slice(0, 2).map((eq, i) => (
                                    <Badge key={i} variant="outline" className="text-xs px-1.5 py-0">
                                      {eq.name}
                                    </Badge>
                                  ))}
                                  {room.equipment.length > 2 && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      +{room.equipment.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-1.5 pt-1 border-t border-gray-100">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 h-7 text-xs text-gray-600"
                                  onClick={() => openEditRoom(room)}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Tahrirlash
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-400 hover:text-red-600"
                                  onClick={() =>
                                    setDeleteDialog({ open: true, type: "room", id: room.id, name: room.name })
                                  }
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Building Dialog */}
      <Dialog open={buildingDialog.open} onOpenChange={(open) => setBuildingDialog((s) => ({ ...s, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {buildingDialog.mode === "create" ? "Yangi Bino" : "Binoni Tahrirlash"}
            </DialogTitle>
            <DialogDescription>Bino ma&apos;lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBuildingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Bino nomi *</Label>
              <Input
                placeholder="Asosiy bino"
                value={buildingForm.name}
                onChange={(e) => setBuildingForm((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Manzil</Label>
              <Input
                placeholder="Ko'cha, shahar"
                value={buildingForm.address}
                onChange={(e) => setBuildingForm((s) => ({ ...s, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Qavatlar soni *</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="3"
                value={buildingForm.floorsStr}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setBuildingForm((s) => ({ ...s, floors: v ? parseInt(v) : 1, floorsStr: v }));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Textarea
                placeholder="Qo'shimcha ma'lumot"
                value={buildingForm.description}
                onChange={(e) => setBuildingForm((s) => ({ ...s, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bldg-active"
                checked={buildingForm.is_active}
                onChange={(e) => setBuildingForm((s) => ({ ...s, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <Label htmlFor="bldg-active" className="cursor-pointer">Faol bino</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBuildingDialog((s) => ({ ...s, open: false }))}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={createBuildingMutation.isPending || updateBuildingMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {(createBuildingMutation.isPending || updateBuildingMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {buildingDialog.mode === "create" ? "Yaratish" : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Room Dialog */}
      <Dialog open={roomDialog.open} onOpenChange={(open) => setRoomDialog((s) => ({ ...s, open }))}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {roomDialog.mode === "create" ? "Yangi Xona" : "Xonani Tahrirlash"}
            </DialogTitle>
            <DialogDescription>Xona ma&apos;lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRoomSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Bino *</Label>
              <Select
                value={roomForm.building}
                onValueChange={(v) => setRoomForm((s) => ({ ...s, building: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Binoni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Xona nomi *</Label>
                <Input
                  placeholder="101"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm((s) => ({ ...s, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Turi *</Label>
                <Select
                  value={roomForm.room_type}
                  onValueChange={(v) => setRoomForm((s) => ({ ...s, room_type: v as RoomType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roomTypeLabels).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Qavat *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="1"
                  value={roomForm.floorStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setRoomForm((s) => ({ ...s, floor: v ? parseInt(v) : 1, floorStr: v }));
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Sig&apos;im *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="30"
                  value={roomForm.capacityStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setRoomForm((s) => ({ ...s, capacity: v ? parseInt(v) : 1, capacityStr: v }));
                  }}
                  required
                />
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label>Jihozlar</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Jihoz nomi"
                  value={equipmentItem.name}
                  onChange={(e) => setEquipmentItem((s) => ({ ...s, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEquipment(); } }}
                />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Soni"
                  value={equipmentItem.quantityStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setEquipmentItem((s) => ({ ...s, quantity: v ? parseInt(v) : 1, quantityStr: v }));
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEquipment(); } }}
                />
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Birlik"
                    value={equipmentItem.unit}
                    onChange={(e) => setEquipmentItem((s) => ({ ...s, unit: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEquipment(); } }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={addEquipment}
                    disabled={!equipmentItem.name.trim() || !equipmentItem.unit.trim()}
                    className="flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {roomForm.equipment && roomForm.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 rounded-lg">
                  {roomForm.equipment.map((eq, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {eq.name} ({eq.quantity} {eq.unit})
                      <button type="button" onClick={() => setRoomForm((p) => ({ ...p, equipment: p.equipment?.filter((_, j) => j !== i) || [] }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="room-active"
                checked={roomForm.is_active}
                onChange={(e) => setRoomForm((s) => ({ ...s, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <Label htmlFor="room-active" className="cursor-pointer">Faol xona</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoomDialog((s) => ({ ...s, open: false }))}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {(createRoomMutation.isPending || updateRoomMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {roomDialog.mode === "create" ? "Yaratish" : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((s) => ({ ...s, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O&apos;chirishni tasdiqlang</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === "building"
                ? `"${deleteDialog.name}" binosi va uning barcha xonalari o'chiriladi.`
                : `"${deleteDialog.name}" xonasi o'chiriladi.`}{" "}
              Bu amalni qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteBuildingMutation.isPending || deleteRoomMutation.isPending}
            >
              {(deleteBuildingMutation.isPending || deleteRoomMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
