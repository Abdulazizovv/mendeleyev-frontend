// AddLessonData: dars qo'shish uchun forma ma'lumotlari
export interface AddLessonData {
  class_subject: string;
  date: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
  room?: string;
  homework?: string;
  teacher_notes?: string;
}
/**
 * Academic System TypeScript Type Definitions
 * Covers: Schedule, Lessons, Attendance, Grades, Homework
 */

// ==================== COMMON ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ==================== SCHEDULE ====================

export interface TimetableTemplate extends BaseEntity {
  name: string;
  academic_year: string;
  academic_year_name?: string; // "2025-2026"
  branch: string; // Branch ID
  branch_name?: string;
  effective_from: string; // "2024-09-01"
  effective_until: string; // "2025-06-01"
  is_active: boolean;
  description?: string;
  slots_count?: number; // Number of slots in this template
  // Legacy fields for compatibility
  start_date?: string;
  end_date?: string;
  branch_id?: string;
}

// Type alias for compatibility
export type Timetable = TimetableTemplate;

export interface Quarter {
  id: string;
  name: string;
  number: number;
  start_date: string;
  end_date: string;
}

export interface CurrentTimetableResponse {
  error?: string;
  quarter?: Quarter;
  // If template exists, it returns TimetableTemplate fields directly
}

export interface TimetableSlot extends BaseEntity {
  timetable: string;
  class_obj?: string | null;
  class_subject?: string | null;
  group?: string | null;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  day_of_week_display?: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
  room?: string | null;
  room_name?: string | null;
  class_name?: string | null;
  subject_name?: string | null;
  teacher_name?: string | null;
  group_name?: string | null;
}

export interface TimetableConflict {
  type: 'teacher' | 'room' | 'class';
  message: string;
  existing_slot_id?: string;
}

// Create/Update DTOs
export interface CreateTimetableTemplate {
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface CreateTimetableSlot {
  timetable: string;
  class_obj?: string | null;
  class_subject?: string | null;
  group?: string | null;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  lesson_number: number;
  start_time: string;
  end_time: string;
  room?: string | null;
}

export interface BulkCreateSlots {
  slots: Omit<CreateTimetableSlot, 'template_id'>[];
}

// ==================== LESSONS ====================

export type LessonStatus = 'planned' | 'completed' | 'cancelled' | 'canceled' | 'in_progress';

export interface LessonInstance extends BaseEntity {
  // Class lesson fields
  class_subject?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  subject_name?: string | null;
  // Group lesson fields
  group?: string | null;
  group_id?: string | null;
  group_name?: string | null;
  // Common fields
  teacher_id?: string | null;
  teacher_name?: string | null;
  room?: string | null;
  room_name?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  lesson_number?: number;
  status: LessonStatus;
  status_display?: string;
  topic?: string | { id: string; title: string; description?: string } | null;
  topic_title?: string | null;
  topic_name?: string | null;
  homework?: string | null;
  teacher_notes?: string | null;
  notes?: string | null;
  attendance_count?: number | null;
  is_auto_generated?: boolean;
  branch_id?: string;
}

export interface LessonTopic extends BaseEntity {
  subject_id: string;
  subject_name?: string;
  name: string;
  description?: string;
  order: number;
  quarter?: number;
}

export interface GenerateLessonsRequest {
  template_id: string;
  start_date: string;
  end_date: string;
}

export interface GenerateLessonsResponse {
  generated_count: number;
  lessons: LessonInstance[];
}

export interface CompleteLessonRequest {
  topic_id?: string;
  notes?: string;
  attendance_count?: number | null;
}

// ==================== SCHEDULE AVAILABILITY ====================

export interface AvailableSubject {
  id: string; // ClassSubject ID
  subject_name: string;
  teacher_name: string;
  teacher_id: string;
}

export interface AvailableRoom {
  id: string;
  name: string;
  capacity: number;
}

export interface ScheduleConflict {
  type: 'teacher' | 'room';
  message: string;
  details: Record<string, any>;
}

export interface ScheduleAvailabilityResponse {
  available_subjects: AvailableSubject[];
  available_rooms: AvailableRoom[];
  conflicts: ScheduleConflict[];
}

// ==================== ATTENDANCE ====================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord extends BaseEntity {
  lesson_id: string;
  student_id: string;
  student_name?: string;
  status: AttendanceStatus;
  notes?: string;
  marked_by?: string;
  marked_at?: string;
  is_locked: boolean;
}

export interface AttendanceSheet {
  lesson_id: string;
  lesson_date: string;
  subject_name: string;
  class_name: string;
  is_locked: boolean;
  records: AttendanceRecord[];
}

export interface MarkAttendanceRequest {
  lesson_id: string;
  student_id: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BulkMarkAttendanceRequest {
  lesson_id: string;
  records: Array<{
    student_id: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
}

export interface AttendanceStatistics {
  student_id?: string;
  class_id?: string;
  total_lessons: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number; // percentage
}

// ==================== GRADES ====================

export type AssessmentType = 'quiz' | 'test' | 'exam' | 'project' | 'homework' | 'participation';

export interface AssessmentTypeConfig extends BaseEntity {
  name: string;
  code: string; // 'QUIZ', 'TEST', etc.
  weight: number;
  description?: string;
  branch_id: string;
}

export interface Assessment extends BaseEntity {
  subject_id: string;
  subject_name?: string;
  class_id: string;
  class_name?: string;
  type_id: string;
  type_name?: string;
  name: string;
  max_score: number;
  weight: number;
  date: string;
  quarter: number;
  is_locked: boolean;
  branch_id: string;
}

export interface GradeEntry extends BaseEntity {
  assessment_id: string;
  student_id: string;
  student_name?: string;
  score: number;
  percentage: number; // auto-calculated: (score / max_score) * 100
  notes?: string;
  entered_by?: string;
  entered_at?: string;
}

export interface GradeSummary {
  student_id: string;
  student_name?: string;
  subject_id: string;
  subject_name?: string;
  quarter: number;
  average_score: number; // weighted average
  letter_grade?: string; // 'A', 'B', 'C', etc. (if configured)
  assessments_count: number;
}

export interface GradeOverride extends BaseEntity {
  student_id: string;
  subject_id: string;
  quarter: number;
  original_grade: number;
  override_grade: number;
  reason: string;
  overridden_by: string;
  overridden_at: string;
}

export interface BulkGradeEntry {
  assessment_id: string;
  grades: Array<{
    student_id: string;
    score: number;
    notes?: string;
  }>;
}

// ==================== HOMEWORK ====================

export type HomeworkStatus = 'assigned' | 'submitted' | 'late' | 'graded';

export interface HomeworkAssignment extends BaseEntity {
  subject_id: string;
  subject_name?: string;
  class_id: string;
  class_name?: string;
  topic_id?: string;
  topic_name?: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  max_score?: number;
  created_by: string;
  teacher_name?: string;
  branch_id: string;
}

export interface HomeworkSubmission extends BaseEntity {
  assignment_id: string;
  student_id: string;
  student_name?: string;
  submission_text?: string;
  submitted_at?: string;
  status: HomeworkStatus;
  score?: number;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
}

export interface HomeworkStatistics {
  assignment_id: string;
  total_students: number;
  submitted_count: number;
  late_count: number;
  graded_count: number;
  average_score?: number;
}

// ==================== QUERY PARAMS ====================

export interface ScheduleFilters {
  class_id?: string;
  teacher_id?: string;
  subject_id?: string;
  academic_year?: string;
  quarter?: number;
  is_active?: boolean;
  day_of_week?: number;
}

export interface LessonFilters {
  class_id?: string;
  group_id?: string;
  teacher_id?: string;
  subject_id?: string;
  status?: LessonStatus;
  date_from?: string;
  date_to?: string;
  topic_id?: string;
}

export interface AttendanceFilters {
  lesson_id?: string;
  student_id?: string;
  class_id?: string;
  status?: AttendanceStatus;
  date_from?: string;
  date_to?: string;
  is_locked?: boolean;
}

export interface GradeFilters {
  student_id?: string;
  class_id?: string;
  subject_id?: string;
  quarter?: number;
  assessment_type?: string;
  is_locked?: boolean;
}

export interface HomeworkFilters {
  student_id?: string;
  class_id?: string;
  subject_id?: string;
  status?: HomeworkStatus;
  date_from?: string;
  date_to?: string;
}

// ==================== SCHEDULE AVAILABILITY ====================

export interface AvailableSubject {
  id: string;
  subject_name: string;
  teacher_name: string;
  teacher_id: string;
}

export interface AvailableRoom {
  id: string;
  name: string;
  capacity: number;
}

export interface AvailabilityConflict {
  type: 'teacher' | 'room';
  message: string;
  details: Record<string, any>;
}

export interface ScheduleAvailabilityResponse {
  available_subjects: AvailableSubject[];
  available_rooms: AvailableRoom[];
  conflicts: AvailabilityConflict[];
}

// ==================== UI STATE ====================

export interface TimetableViewState {
  templateId: string | null;
  selectedDay: number | null;
  selectedSlot: TimetableSlot | null;
  isEditing: boolean;
}

export interface AttendanceViewState {
  lessonId: string;
  isLocked: boolean;
  isMarking: boolean;
  selectedStudents: string[];
}

export interface GradingViewState {
  assessmentId: string;
  isLocked: boolean;
  isGrading: boolean;
  changedGrades: Map<string, number>;
}
