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

// Branch Settings Types
export interface BranchSettings {
  id: string;
  branch_id: string;
  branch_name: string;
  
  // Dars jadvali sozlamalari
  lesson_duration_minutes: number;
  break_duration_minutes: number;
  school_start_time: string; // HH:MM:SS
  school_end_time: string; // HH:MM:SS
  daily_lesson_start_time?: string; // HH:MM:SS - darslar boshlanish vaqti
  daily_lesson_end_time?: string; // HH:MM:SS - darslar tugash vaqti (school_end_time dan kech bo'lishi mumkin)
  max_lessons_per_day?: number; // Kunlik maksimal darslar soni
  
  // Tushlik vaqti sozlamalari
  lunch_break_start?: string; // HH:MM:SS, masalan "12:25:00"
  lunch_break_end?: string; // HH:MM:SS, masalan "13:00:00"
  
  // Akademik sozlamalar
  academic_year_start_month: number; // 1-12
  academic_year_end_month: number; // 1-12
  
  // Moliya sozlamalari
  currency: string;
  currency_symbol: string;
  
  // Maosh hisoblash sozlamalari
  salary_calculation_time: string; // HH:MM:SS
  auto_calculate_salary: boolean;
  salary_calculation_day: number; // 1-31
  
  // To'lov va chegirmalar
  late_payment_penalty_percent: string; // decimal
  early_payment_discount_percent: string; // decimal
  
  // Ish vaqti sozlamalari
  work_days_per_week: number; // 1-7
  work_hours_per_day: number;
  
  // Qo'shimcha sozlamalar
  additional_settings: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

export interface UpdateBranchSettingsPayload {
  lesson_duration_minutes?: number;
  break_duration_minutes?: number;
  school_start_time?: string;
  school_end_time?: string;
  daily_lesson_start_time?: string;
  daily_lesson_end_time?: string;
  max_lessons_per_day?: number;
  lunch_break_start?: string;
  lunch_break_end?: string;
  academic_year_start_month?: number;
  academic_year_end_month?: number;
  currency?: string;
  currency_symbol?: string;
  salary_calculation_time?: string;
  auto_calculate_salary?: boolean;
  salary_calculation_day?: number;
  late_payment_penalty_percent?: string;
  early_payment_discount_percent?: string;
  work_days_per_week?: number;
  work_hours_per_day?: number;
  additional_settings?: Record<string, any>;
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
  avatar?: string | null;
  avatar_url?: string | null;
  birth_certificate: string | null;
  birth_certificate_url: string | null;
  additional_fields: Record<string, any>;
  current_class: {
    id: string;
    name: string;
    academic_year: string;
  } | null;
  relatives_count: number;
  relatives?: StudentRelative[];
  subscriptions?: {
    id: string;
    subscription_plan: {
      id: string;
      name: string;
      price: number;
      period: string;
      period_display: string;
    };
    discount?: {
      id: string;
      name: string;
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
    };
    is_active: boolean;
    start_date: string;
    end_date: string | null;
    next_payment_date: string;
    last_payment_date: string | null;
    total_debt: number;
    notes: string;
    created_at: string;
  }[];
  payment_due?: {
    has_subscription: boolean;
    total_amount: number;
    subscriptions: {
      subscription_id: string;
      subscription_plan_name: string;
      subscription_period: string;
      subscription_price: number;
      current_amount: number;
      debt_amount: number;
      total_amount: number;
      next_due_date: string | null;
      overdue_months: number;
      is_expired: boolean;
      is_overdue: boolean;
    }[];
  };
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
  recent_transactions?: {
    id: string;
    transaction_type: string;
    transaction_type_display: string;
    status: string;
    status_display: string;
    amount: number;
    payment_method: string;
    payment_method_display: string;
    description?: string;
    reference_number?: string;
    transaction_date: string;
    cash_register?: {
      id: string;
      name: string;
    };
    category?: {
      id: string;
      name: string;
      type: string;
    };
    employee?: {
      id: string;
      user_id: string;
      full_name: string;
      phone_number: string;
      role: string;
      role_display: string;
      avatar?: string;
    };
  }[];
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
  branch?: string; // UUID - backend talab qiladi
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

// HR Types
export type EmploymentType = "full_time" | "part_time" | "contract" | "temporary";
export type StaffStatus = "active" | "inactive" | "on_leave" | "terminated";
export type TransactionType = "deposit" | "withdrawal" | "salary" | "bonus" | "fine" | "adjustment" | "advance";
export type PaymentMethod = "cash" | "bank_transfer" | "card" | "click" | "payme" | "other";
export type SalaryStatus = "pending" | "paid" | "cancelled" | "failed";

export interface StaffRole {
  id: string; // UUID
  name: string;
  code: string;
  branch: string; // UUID
  branch_name: string;
  permissions: string[];
  salary_range_min?: number;
  salary_range_max?: number;
  description?: string;
  is_active: boolean;
  staff_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
}

export interface StaffRoleInfo {
  id: number;
  name: string;
  code: string;
}

export interface BalanceSummary {
  current_balance: number;
  total_credits: number;
  total_debits: number;
  net: number;
}

export interface StaffProfile {
  id: string; // UUID
  user: string; // UUID
  user_info: UserInfo;
  user_name: string;
  phone_number: string;
  email?: string;
  branch: string; // UUID
  branch_name: string;
  membership?: string; // UUID
  staff_role: string; // UUID
  staff_role_info: StaffRoleInfo;
  role_name: string;
  role_code: string;
  employment_type: EmploymentType;
  employment_type_display: string;
  hire_date: string;
  termination_date?: string | null;
  base_salary: number;
  current_balance: number;
  balance_status: "positive" | "negative" | "zero";
  balance_summary: BalanceSummary;
  bank_account?: string;
  tax_id?: string;
  status: StaffStatus;
  status_display: string;
  notes?: string;
  days_employed: number;
  is_active_membership: boolean;
  created_at: string;
  updated_at: string;
}

export interface BalanceTransaction {
  id: string; // UUID
  staff: string; // UUID
  staff_name: string;
  transaction_type: TransactionType;
  transaction_type_display: string;
  amount: number;
  previous_balance: number;
  new_balance: number;
  reference?: string;
  description?: string;
  salary_payment?: string | null; // UUID
  processed_by?: string; // UUID
  processed_by_name?: string;
  created_at: string;
}

export interface SalaryPayment {
  id: string; // UUID
  staff: string; // UUID
  staff_name: string;
  month: string;
  amount: number;
  payment_date?: string;
  payment_method?: PaymentMethod;
  payment_method_display?: string;
  status: SalaryStatus;
  status_display: string;
  notes?: string;
  reference_number?: string;
  processed_by?: string; // UUID
  processed_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffRoleRequest {
  name: string;
  code: string;
  branch: string; // UUID
  permissions?: string[];
  salary_range_min?: number;
  salary_range_max?: number;
  description?: string;
  is_active: boolean;
}

// Basic staff profile request (deprecated - use EnhancedCreateStaffRequest)
export interface CreateStaffProfileRequest {
  user: string; // UUID
  branch: string; // UUID
  membership?: string; // UUID
  staff_role: string; // UUID
  employment_type: EmploymentType;
  hire_date: string;
  base_salary: number;
  bank_account?: string;
  tax_id?: string;
  notes?: string;
}

// Enhanced staff creation request (recommended)
export interface EnhancedCreateStaffRequest {
  phone_number: string; // +998901234567 formatida
  first_name: string;
  last_name?: string;
  email?: string;
  password?: string; // Ixtiyoriy, berilmasa unusable password
  branch_id: string; // UUID
  staff_role_id: string; // UUID
  employment_type: EmploymentType;
  hire_date: string; // YYYY-MM-DD
  base_salary: number; // UZS
  bank_account?: string;
  tax_id?: string;
  notes?: string;
}

export interface CreateTransactionRequest {
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  reference?: string;
}

export interface CreateSalaryPaymentRequest {
  staff: string; // UUID
  month: string;
  amount: number;
  payment_date?: string;
  payment_method?: PaymentMethod;
  notes?: string;
}

// Check Staff User Response
export interface CheckStaffUserResponse {
  exists_in_branch: boolean;
  exists_globally: boolean;
  branch_data: {
    branch_id: string;
    branch_name: string;
    is_active: boolean;
    created_at: string;
    user: {
      id: string;
      phone_number: string;
      first_name: string;
      last_name: string;
      full_name: string;
      email?: string;
    };
    staff_profile: {
      id: string;
      staff_role: {
        id: string;
        name: string;
        code: string;
      };
      employment_type: EmploymentType;
      employment_type_display: string;
      base_salary: number;
      current_balance: number;
      status: StaffStatus;
      status_display: string;
      hire_date: string;
      termination_date?: string | null;
    };
  } | null;
  all_branches_data: Array<{
    branch_id: string;
    branch_name: string;
    is_active: boolean;
    created_at: string;
    user: {
      id: string;
      phone_number: string;
      first_name: string;
      last_name: string;
      full_name: string;
      email?: string;
    };
    staff_profile: {
      id: string;
      staff_role: {
        id: string;
        name: string;
        code: string;
      };
      employment_type: EmploymentType;
      employment_type_display: string;
      base_salary: number;
      current_balance: number;
      status: StaffStatus;
      status_display: string;
      hire_date: string;
      termination_date?: string | null;
    };
  }>;
}

// Staff Statistics Response
export interface StaffStatisticsResponse {
  summary: {
    total_count: number;
    active_count: number;
    inactive_count: number;
    total_salary: number;
    avg_salary: number;
    total_balance: number;
    positive_balance_count: number;
    negative_balance_count: number;
  };
  by_employment_type: Array<{
    employment_type: EmploymentType;
    count: number;
    total_salary: number;
  }>;
  by_role: Array<{
    staff_role__name: string;
    staff_role__id: string;
    count: number;
    avg_salary: number;
  }>;
  by_branch: Array<{
    branch__name: string;
    branch__id: string;
    count: number;
    total_salary: number;
  }>;
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

// Bulk Salary Payment Request
export interface BulkSalaryPaymentRequest {
  month: string;
  payments: Array<{
    staff_id: string; // UUID
    amount: number;
    payment_date: string;
    payment_method: PaymentMethod;
    notes?: string;
  }>;
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
