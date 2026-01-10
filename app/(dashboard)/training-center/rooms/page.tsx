"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Room, CreateBuildingRequest, CreateRoomRequest, RoomType, EquipmentItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Home,
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
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Xona turlari ikonlari
const roomTypeIcons: Record<RoomType, React.ElementType> = {
  classroom: Users,
  lab: FlaskConical,
  library: BookOpen,
  gym: Dumbbell,
  office: Briefcase,
  auditorium: Theater,
  other: MoreHorizontal,
};

// Xona turlari o'zbek tilida
const roomTypeLabels: Record<RoomType, string> = {
  classroom: "Dars xonasi",
  lab: "Laboratoriya",
  library: "Kutubxona",
  gym: "Sport zali",
  office: "Ofis",
  auditorium: "Auditoriya",
  other: "Boshqa",
};

export default function RoomsPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id || "";

  // Filters
  const [selectedBuilding, setSelectedBuilding] = React.useState<string>("all");
  const [selectedRoomType, setSelectedRoomType] = React.useState<string>("all");

  // State management
  const [buildingDialog, setBuildingDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: Building;
  }>({ open: false, mode: "create" });

  const [roomDialog, setRoomDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: Room;
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

  // Queries
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

  // Mutations
  const createBuildingMutation = useMutation({
    mutationFn: (data: CreateBuildingRequest) => schoolApi.createBuilding(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings", branchId] });
      setBuildingDialog({ open: false, mode: "create" });
      resetBuildingForm();
      toast.success("Bino muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || 
        error?.response?.data?.name?.[0] ||
        "Bino yaratishda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  const updateBuildingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBuildingRequest> }) =>
      schoolApi.updateBuilding(branchId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings", branchId] });
      setBuildingDialog({ open: false, mode: "create" });
      resetBuildingForm();
      toast.success("Bino muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail ||
        error?.response?.data?.name?.[0] ||
        "Binoni yangilashda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: (id: string) => schoolApi.deleteBuilding(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings", branchId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", branchId] });
      setDeleteDialog({ open: false, type: "building" });
      toast.success("Bino muvaffaqiyatli o'chirildi");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail ||
        "Binoni o'chirishda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: (data: CreateRoomRequest) => schoolApi.createRoom(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", branchId] });
      queryClient.invalidateQueries({ queryKey: ["buildings", branchId] });
      setRoomDialog({ open: false, mode: "create" });
      resetRoomForm();
      toast.success("Xona muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail ||
        error?.response?.data?.building?.[0] ||
        error?.response?.data?.floor?.[0] ||
        error?.response?.data?.name?.[0] ||
        error?.response?.data?.equipment?.[0] ||
        "Xona yaratishda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoomRequest> }) =>
      schoolApi.updateRoom(branchId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", branchId] });
      queryClient.invalidateQueries({ queryKey: ["buildings", branchId] });
      setRoomDialog({ open: false, mode: "create" });
      resetRoomForm();
      toast.success("Xona muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail ||
        error?.response?.data?.building?.[0] ||
        error?.response?.data?.floor?.[0] ||
        error?.response?.data?.name?.[0] ||
        error?.response?.data?.equipment?.[0] ||
        "Xonani yangilashda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => schoolApi.deleteRoom(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", branchId] });
      queryClient.invalidateQueries({ queryKey: ["buildings", branchId] });
      setDeleteDialog({ open: false, type: "room" });
      toast.success("Xona muvaffaqiyatli o'chirildi");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail ||
        "Xonani o'chirishda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  // Helper functions
  const resetBuildingForm = () => {
    setBuildingForm({
      name: "",
      address: "",
      floors: 1,
      floorsStr: "1",
      description: "",
      is_active: true,
    });
  };

  const resetRoomForm = () => {
    setRoomForm({
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
    setEquipmentItem({ name: "", quantity: 1, quantityStr: "1", unit: "dona" });
  };

  const openCreateBuildingDialog = () => {
    resetBuildingForm();
    setBuildingDialog({ open: true, mode: "create" });
  };

  const openEditBuildingDialog = (building: Building) => {
    setBuildingForm({
      name: building.name,
      address: building.address || "",
      floors: building.floors,
      floorsStr: String(building.floors),
      description: building.description || "",
      is_active: building.is_active,
    });
    setBuildingDialog({ open: true, mode: "edit", data: building });
  };

  const openCreateRoomDialog = (buildingId?: string) => {
    resetRoomForm();
    if (buildingId) {
      setRoomForm((prev) => ({ ...prev, building: buildingId }));
    }
    setRoomDialog({ open: true, mode: "create" });
  };

  const openEditRoomDialog = (room: Room) => {
    setRoomForm({
      building: room.building,
      name: room.name,
      room_type: room.room_type,
      floor: room.floor,
      floorStr: String(room.floor),
      capacity: room.capacity,
      capacityStr: String(room.capacity),
      equipment: room.equipment || [],
      is_active: room.is_active,
    });
    setRoomDialog({ open: true, mode: "edit", data: room });
  };

  const handleBuildingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { floorsStr, ...submitData } = buildingForm;
    if (buildingDialog.mode === "create") {
      createBuildingMutation.mutate(submitData);
    } else if (buildingDialog.data) {
      updateBuildingMutation.mutate({ id: buildingDialog.data.id, data: submitData });
    }
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { floorStr, capacityStr, ...submitData } = roomForm;
    console.log('Submitting room data:', submitData);
    console.log('Equipment:', submitData.equipment);
    if (roomDialog.mode === "create") {
      createRoomMutation.mutate(submitData);
    } else if (roomDialog.data) {
      updateRoomMutation.mutate({ id: roomDialog.data.id, data: submitData });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.type === "building" && deleteDialog.id) {
      deleteBuildingMutation.mutate(deleteDialog.id);
    } else if (deleteDialog.type === "room" && deleteDialog.id) {
      deleteRoomMutation.mutate(deleteDialog.id);
    }
  };

  const addEquipment = () => {
    if (equipmentItem.name.trim() && equipmentItem.quantity > 0 && equipmentItem.unit.trim()) {
      const { quantityStr, ...itemToAdd } = equipmentItem;
      console.log('Adding equipment:', itemToAdd);
      setRoomForm((prev) => ({
        ...prev,
        equipment: [...(prev.equipment || []), itemToAdd],
      }));
      setEquipmentItem({ name: "", quantity: 1, quantityStr: "1", unit: "dona" });
    } else {
      console.log('Cannot add equipment - missing fields:', {
        name: equipmentItem.name,
        quantity: equipmentItem.quantity,
        unit: equipmentItem.unit
      });
    }
  };

  const removeEquipment = (index: number) => {
    setRoomForm((prev) => ({
      ...prev,
      equipment: prev.equipment?.filter((_, i) => i !== index) || [],
    }));
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    if (selectedBuilding !== "all" && room.building !== selectedBuilding) return false;
    if (selectedRoomType !== "all" && room.room_type !== selectedRoomType) return false;
    return true;
  });

  if (buildingsLoading || roomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xonalar</h1>
          <p className="text-gray-600 mt-1">
            {buildings.length} ta bino • {filteredRooms.length} ta xona
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={openCreateBuildingDialog}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Building2 className="w-4 h-4" />
            Bino
          </Button>
          <Button onClick={() => openCreateRoomDialog()} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Xona qo&apos;shish
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm text-gray-600 mb-2 block">Bino</Label>
              <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha binolar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha binolar</SelectItem>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label className="text-sm text-gray-600 mb-2 block">Xona turi</Label>
              <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha turlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  {Object.entries(roomTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xonalar topilmadi</h3>
            <p className="text-gray-600 mb-6">
              Yangi xona qo&apos;shish uchun tugmani bosing
            </p>
            <Button onClick={() => openCreateRoomDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Xona qo&apos;shish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const RoomIcon = roomTypeIcons[room.room_type];
            return (
              <Card
                key={room.id}
                className={`hover:shadow-lg transition-all ${
                  !room.is_active ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          room.is_active
                            ? "bg-gradient-to-br from-blue-100 to-indigo-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <RoomIcon
                          className={`w-6 h-6 ${
                            room.is_active ? "text-blue-600" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">
                          {roomTypeLabels[room.room_type]}
                        </p>
                      </div>
                    </div>
                    <Badge variant={room.is_active ? "default" : "secondary"} className="text-xs">
                      {room.is_active ? "Faol" : "Nofaol"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>{room.building_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Qavat:</span>
                      <span className="font-medium">{room.floor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sig&apos;im:</span>
                      <span className="font-medium">{room.capacity} kishi</span>
                    </div>
                  </div>

                  {room.equipment && room.equipment.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Jihozlar:</p>
                        <div className="flex flex-wrap gap-1">
                          {room.equipment.slice(0, 3).map((eq, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {eq.name} ({eq.quantity} {eq.unit})
                            </Badge>
                          ))}
                          {room.equipment.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{room.equipment.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditRoomDialog(room)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Tahrirlash
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          type: "room",
                          id: room.id,
                          name: room.name,
                        })
                      }
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Buildings Section */}
      {buildings.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Binolar</CardTitle>
              <Button variant="ghost" size="sm" onClick={openCreateBuildingDialog}>
                <Plus className="w-4 h-4 mr-1" />
                Bino qo&apos;shish
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {buildings.map((building) => (
                <div
                  key={building.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">{building.name}</h4>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span>{building.floors} qavat</span>
                        <span>•</span>
                        <span>{building.rooms_count} xona</span>
                        {building.address && (
                          <>
                            <span>•</span>
                            <span>{building.address}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={building.is_active ? "default" : "secondary"}>
                      {building.is_active ? "Faol" : "Nofaol"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditBuildingDialog(building)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          type: "building",
                          id: building.id,
                          name: building.name,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Building Dialog */}
      <Dialog
        open={buildingDialog.open}
        onOpenChange={(open) => setBuildingDialog({ ...buildingDialog, open })}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {buildingDialog.mode === "create" ? "Yangi bino qo'shish" : "Binoni tahrirlash"}
            </DialogTitle>
            <DialogDescription>Bino ma&apos;lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBuildingSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="building-name">
                  Bino nomi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="building-name"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  placeholder="Masalan: Asosiy bino"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="building-address">Manzil</Label>
                <Input
                  id="building-address"
                  value={buildingForm.address}
                  onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })}
                  placeholder="Masalan: Toshkent shahar, Chilonzor tumani"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="building-floors">
                  Qavatlar soni <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="building-floors"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={buildingForm.floorsStr}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value === '') {
                      setBuildingForm({ ...buildingForm, floors: 1, floorsStr: '' });
                    } else {
                      const numValue = parseInt(value);
                      setBuildingForm({ ...buildingForm, floors: numValue, floorsStr: value });
                    }
                  }}
                  placeholder="Masalan: 3"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="building-description">Tavsif</Label>
                <Textarea
                  id="building-description"
                  value={buildingForm.description}
                  onChange={(e) =>
                    setBuildingForm({ ...buildingForm, description: e.target.value })
                  }
                  placeholder="Bino haqida qo'shimcha ma'lumot"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="building-active"
                  checked={buildingForm.is_active}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBuildingForm({ ...buildingForm, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <Label htmlFor="building-active" className="cursor-pointer">
                  Faol bino
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBuildingDialog({ ...buildingDialog, open: false })}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={createBuildingMutation.isPending || updateBuildingMutation.isPending}
              >
                {(createBuildingMutation.isPending || updateBuildingMutation.isPending) && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                {buildingDialog.mode === "create" ? "Yaratish" : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Room Dialog */}
      <Dialog open={roomDialog.open} onOpenChange={(open) => setRoomDialog({ ...roomDialog, open })}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {roomDialog.mode === "create" ? "Yangi xona qo'shish" : "Xonani tahrirlash"}
            </DialogTitle>
            <DialogDescription>Xona ma&apos;lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRoomSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="room-building">
                  Bino <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={roomForm.building}
                  onValueChange={(value) => setRoomForm({ ...roomForm, building: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Binoni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">
                    Xona nomi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="room-name"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    placeholder="Masalan: 101"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room-type">
                    Xona turi <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={roomForm.room_type}
                    onValueChange={(value) =>
                      setRoomForm({ ...roomForm, room_type: value as RoomType })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roomTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room-floor">
                    Qavat <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="room-floor"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={roomForm.floorStr}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value === '') {
                        setRoomForm({ ...roomForm, floor: 1, floorStr: '' });
                      } else {
                        const numValue = parseInt(value);
                        setRoomForm({ ...roomForm, floor: numValue, floorStr: value });
                      }
                    }}
                    placeholder="Masalan: 1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room-capacity">
                    Sig&apos;im <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="room-capacity"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={roomForm.capacityStr}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value === '') {
                        setRoomForm({ ...roomForm, capacity: 1, capacityStr: '' });
                      } else {
                        const numValue = parseInt(value);
                        setRoomForm({ ...roomForm, capacity: numValue, capacityStr: value });
                      }
                    }}
                    placeholder="Masalan: 30"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jihozlar</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Jihoz nomi"
                    value={equipmentItem.name}
                    onChange={(e) => setEquipmentItem({ ...equipmentItem, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEquipment();
                      }
                    }}
                  />
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Soni"
                    value={equipmentItem.quantityStr}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value === '') {
                        setEquipmentItem({ ...equipmentItem, quantity: 1, quantityStr: '' });
                      } else {
                        const numValue = parseInt(value);
                        setEquipmentItem({ ...equipmentItem, quantity: numValue, quantityStr: value });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEquipment();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Birlik (dona, m², kg)"
                      value={equipmentItem.unit}
                      onChange={(e) =>
                        setEquipmentItem({ ...equipmentItem, unit: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addEquipment();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={addEquipment} 
                      size="sm"
                      disabled={!equipmentItem.name.trim() || equipmentItem.quantity <= 0 || !equipmentItem.unit.trim()}
                      title={!equipmentItem.name.trim() || !equipmentItem.unit.trim() ? "Jihoz nomi va birligini kiriting" : ""}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {roomForm.equipment && roomForm.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
                    {roomForm.equipment.map((eq, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-2 pr-1">
                        {eq.name} ({eq.quantity} {eq.unit})
                        <button
                          type="button"
                          onClick={() => removeEquipment(idx)}
                          className="ml-1 hover:text-red-600 p-1 rounded hover:bg-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="room-active"
                  checked={roomForm.is_active}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRoomForm({ ...roomForm, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <Label htmlFor="room-active" className="cursor-pointer">
                  Faol xona
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoomDialog({ ...roomDialog, open: false })}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
              >
                {(createRoomMutation.isPending || updateRoomMutation.isPending) && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                {roomDialog.mode === "create" ? "Yaratish" : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === "building"
                ? `"${deleteDialog.name}" binosi o'chiriladi. Bu amalni qaytarib bo'lmaydi.`
                : `"${deleteDialog.name}" xonasi o'chiriladi. Bu amalni qaytarib bo'lmaydi.`}
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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
