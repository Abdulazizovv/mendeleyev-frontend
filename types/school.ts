/**
 * School Module Types - Backend API ga mos ravishda
 */

// Pagination Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Academic Year Types
export interface Quarter {
  id: string;
  name: string;
  number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  branch: string;
  branch_name: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  quarters: Quarter[];
  created_at: string;
  updated_at: string;
}

// Class Types
export interface Class {
  id: string;
  branch: string;
  branch_name: string;
  academic_year: string;
  academic_year_name: string;
  name: string;
  grade_level: number;
  section?: string;
  class_teacher?: string;
  class_teacher_name?: string;
  max_students: number;
  current_students_count: number;
  can_add_student: boolean;
  room?: string;
  room_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassStudent {
  id: string;
  class_obj: string;
  membership: string;
  membership_id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  student_balance: number;
  enrollment_date: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Subject Types
export interface Subject {
  id: string;
  branch: string;
  branch_name: string;
  name: string;
  code?: string;
  description?: string;
  /** Hex rang kodi (#RRGGBB) - dars jadvali va UI da ishlatiladi */
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ClassSubject {
  id: string;
  class_obj: string;
  class_name: string;
  subject: string;
  subject_name: string;
  subject_code?: string;
  teacher?: string;
  teacher_name?: string;
  hours_per_week: number;
  quarter?: string;
  quarter_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Room Types
export type RoomType = "classroom" | "lab" | "library" | "gym" | "office" | "auditorium" | "other";

export interface Building {
  id: string;
  branch: string;
  branch_name: string;
  name: string;
  address?: string;
  floors: number;
  description?: string;
  is_active: boolean;
  rooms_count: number;
  created_at: string;
  updated_at: string;
}

export interface EquipmentItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface Room {
  id: string;
  branch: string;
  branch_name: string;
  building: string;
  building_name: string;
  name: string;
  room_type: RoomType;
  room_type_display: string;
  floor: number;
  capacity: number;
  equipment?: EquipmentItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Dashboard Types - Teacher
export interface TeacherClass {
  id: string;
  branch: string;
  branch_name: string;
  academic_year: string;
  academic_year_name: string;
  name: string;
  grade_level: number;
  section?: string;
  max_students: number;
  current_students_count: number;
  subjects_count?: number;
  room?: string;
  room_name?: string;
  is_active: boolean;
}

export interface TeacherSubject {
  id: string;
  subject: string;
  subject_name: string;
  subject_code?: string;
  class_obj: string;
  class_id: string;
  class_name: string;
  academic_year_name: string;
  hours_per_week: number;
  quarter?: string;
  quarter_name?: string;
  students_count: number;
  is_active: boolean;
}

export interface TeacherStudent {
  id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  class_obj: string;
  class_id: string;
  class_name: string;
  academic_year_name: string;
  enrollment_date: string;
  is_active: boolean;
}

// Dashboard Types - Student
export interface StudentClassSubject {
  id: string;
  subject_id: string;
  subject_name: string;
  subject_code?: string;
  teacher_id?: string;
  teacher_name?: string;
  hours_per_week: number;
  quarter_id?: string;
  quarter_name?: string;
}

export interface StudentClass {
  id: string;
  branch: string;
  branch_name: string;
  academic_year: string;
  academic_year_name: string;
  name: string;
  grade_level: number;
  section?: string;
  class_teacher?: string;
  class_teacher_name?: string;
  max_students: number;
  students_count: number;
  room?: string;
  room_name?: string;
  subjects: StudentClassSubject[];
  is_active: boolean;
}

export interface StudentSubject {
  id: string;
  subject: string;
  subject_name: string;
  subject_code?: string;
  teacher?: string;
  teacher_id?: string;
  teacher_name?: string;
  hours_per_week: number;
  quarter?: string;
  quarter_name?: string;
  is_active: boolean;
}

// Student Types
export interface Student {
  id: string;
  personal_number: string | null;
  user_id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  full_name: string;
  email: string;
  branch_id: string;
  branch_name: string;
  membership_id?: string; // Available students endpoint returns this
  gender: "male" | "female" | "other" | "unspecified";
  status: "active" | "archived" | "suspended" | "graduated" | "transferred";
  status_display?: string;
  date_of_birth: string;
  address: string;
  birth_certificate: string | null;
  birth_certificate_url: string | null;
  additional_fields: Record<string, any>;
  current_class: {
    id: string;
    name: string;
    academic_year: string;
  } | null;
  relatives_count: number;
  balance?: {
    id: string;
    balance: number;
    notes?: string;
    updated_at?: string;
    transactions_summary?: {
      total_income: number;
      total_expense: number;
      net_balance: number;
      transactions_count: number;
    };
    payments_summary?: {
      total_payments: number;
      payments_count: number;
      last_payment?: {
        id: string;
        amount: number;
        date: string;
        period: string;
        period_display?: string;
      };
    };
  };
  created_at: string;
  updated_at: string;
}

// Relative Types
export type RelationshipType = 
  | "father" 
  | "mother" 
  | "brother" 
  | "sister" 
  | "grandfather" 
  | "grandmother" 
  | "uncle" 
  | "aunt" 
  | "guardian" 
  | "other";

export interface StudentRelative {
  id: string;
  student_profile: string;
  relationship_type: RelationshipType;
  relationship_type_display: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  gender?: "male" | "female" | "other" | "unspecified";
  date_of_birth?: string;
  address?: string;
  workplace?: string;
  position?: string;
  passport_number?: string;
  photo?: string | null;
  is_primary_contact: boolean;
  is_guardian: boolean;
  additional_info?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfileSummary {
  id: string;
  personal_number?: string | null;
  full_name: string;
  status?: Student["status"];
  status_display?: string;
  gender?: Student["gender"];
  date_of_birth?: string | null;
  phone_number?: string;
  email?: string | null;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
}

export interface StudentPhoneCheckBranchData {
  branch_id: string;
  branch_name: string;
  role: string;
  role_display: string;
  is_active: boolean;
  created_at: string;
  student_profile?: StudentProfileSummary | null;
}

export interface StudentPhoneCheckResponse {
  exists_in_branch: boolean;
  exists_globally: boolean;
  branch_data: StudentPhoneCheckBranchData | null;
  all_branches_data: StudentPhoneCheckBranchData[];
}

// Request Types
export interface CreateAcademicYearRequest {
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface CreateQuarterRequest {
  name: string;
  number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface CreateClassRequest {
  branch: string; // Required by API - must match branch_id in URL
  academic_year: string;
  name: string;
  grade_level: number;
  section?: string;
  class_teacher?: string;
  max_students: number;
  room?: string;
  is_active: boolean;
}

export interface AddStudentToClassRequest {
  membership: string;
  is_active: boolean;
  notes?: string;
}

export interface CreateSubjectRequest {
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  /** Filial ID - backend yangilangan bo'lsa body da talab qilinishi mumkin */
  branch?: string;
  /** Hex rang kodi (#RRGGBB) */
  color?: string;
}

export interface AddSubjectToClassRequest {
  subject: string;
  teacher?: string;
  hours_per_week: number;
  quarter?: string;
  is_active: boolean;
}

export interface CreateBuildingRequest {
  name: string;
  address?: string;
  floors: number;
  description?: string;
  is_active: boolean;
}

export interface CreateRoomRequest {
  building: string;
  name: string;
  room_type: RoomType;
  floor: number;
  capacity: number;
  equipment?: EquipmentItem[];
  is_active: boolean;
}

// Student Request Types
export interface CreateStudentRelativeRequest {
  relationship_type: RelationshipType;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone_number?: string;
  email?: string;
  gender?: "male" | "female" | "other" | "unspecified";
  date_of_birth?: string;
  address?: string;
  workplace?: string;
  position?: string;
  passport_number?: string;
  is_primary_contact?: boolean;
  is_guardian?: boolean;
  additional_info?: Record<string, any>;
  notes?: string;
}

export interface CreateStudentRequest {
  phone_number: string;
  first_name: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  password?: string;
  gender?: "male" | "female" | "other" | "unspecified";
  status?: "active" | "archived" | "suspended" | "graduated" | "transferred";
  date_of_birth?: string;
  address?: string;
  birth_certificate?: string | null;
  additional_fields?: Record<string, any>;
  class_id?: string;
  relatives?: CreateStudentRelativeRequest[];
}
