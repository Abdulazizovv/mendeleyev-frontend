/**
 * Dashboard Statistics Types
 */

export interface DashboardStudentsStats {
  total: number;
  active: number;
  with_debt: number;
  total_debt_amount: number;
}

export interface DashboardStaffStats {
  total: number;
  teachers: number;
  admins: number;
  other: number;
}

export interface DashboardLessonsStats {
  today: number;
  this_week: number;
  completed_today: number;
}

export interface DashboardFinanceStats {
  total_balance: number;
  this_month_income: number;
  this_month_expenses: number;
  recent_payments_count: number;
}

export interface DashboardStatistics {
  branch_id: string;
  branch_name: string;
  students: DashboardStudentsStats;
  staff: DashboardStaffStats;
  lessons: DashboardLessonsStats;
  finance: DashboardFinanceStats;
}

// Today's lessons interface
export interface TodaysLesson {
  id: string;
  class_name?: string;
  class_subject?: string;
  subject_name?: string;
  teacher_name?: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
  room?: string;
  status: 'planned' | 'completed' | 'cancelled' | 'in_progress';
  topic?: string;
}
