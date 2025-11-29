import type { RelationshipType } from "@/types/school";
import { User, Users, GraduationCap, CheckCircle2 } from "lucide-react";

export const relationshipTypes: { value: RelationshipType; label: string }[] = [
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

export const STEPS = [
  { id: 1, title: "Telefon raqam", icon: User, fields: ["phone_number"] },
  { id: 2, title: "Shaxsiy ma'lumotlar", icon: User, fields: ["first_name", "last_name", "middle_name", "gender", "date_of_birth", "address", "email", "password"] },
  { id: 3, title: "Yaqinlari", icon: Users, fields: ["relatives"] },
  { id: 4, title: "Akademik holat", icon: GraduationCap, fields: ["class_id", "status"] },
  { id: 5, title: "Tasdiqlash", icon: CheckCircle2 },
];
