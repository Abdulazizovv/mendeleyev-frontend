/**
 * Schedule Module - O'zbek tili tarjimalari va konstantlar
 */

export const DAYS_UZ = [
  { value: 0, short: 'Dush', full: 'Dushanba', en: 'Monday' },
  { value: 1, short: 'Sesh', full: 'Seshanba', en: 'Tuesday' },
  { value: 2, short: 'Chor', full: 'Chorshanba', en: 'Wednesday' },
  { value: 3, short: 'Pay', full: 'Payshanba', en: 'Thursday' },
  { value: 4, short: 'Jum', full: 'Juma', en: 'Friday' },
  { value: 5, short: 'Shan', full: 'Shanba', en: 'Saturday' },
] as const;

export const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
] as const;

export const LESSON_STATUSES_UZ = {
  planned: { label: 'Rejalashtirilgan', color: 'blue', icon: 'Calendar' },
  in_progress: { label: 'Davom etmoqda', color: 'yellow', icon: 'Clock' },
  completed: { label: 'Tugallangan', color: 'green', icon: 'CheckCircle2' },
  cancelled: { label: 'Bekor qilingan', color: 'red', icon: 'XCircle' },
} as const;

export const TIME_SLOTS = [
  { number: 1, start: '08:00', end: '08:45', label: '1-dars (08:00-08:45)' },
  { number: 2, start: '08:55', end: '09:40', label: '2-dars (08:55-09:40)' },
  { number: 3, start: '09:50', end: '10:35', label: '3-dars (09:50-10:35)' },
  { number: 4, start: '10:45', end: '11:30', label: '4-dars (10:45-11:30)' },
  { number: 5, start: '11:40', end: '12:25', label: '5-dars (11:40-12:25)' },
  // TUSHLIK VAQTI: 12:25 - 13:00
  { number: 6, start: '13:00', end: '13:45', label: '6-dars (13:00-13:45)' },
  { number: 7, start: '13:55', end: '14:40', label: '7-dars (13:55-14:40)' },
  { number: 8, start: '14:50', end: '15:35', label: '8-dars (14:50-15:35)' },
] as const;

export const SCHEDULE_TRANSLATIONS = {
  // Header
  pageTitle: 'Haftalik Dars Jadvali',
  pageDescription: 'Filialning to\'liq haftalik dars jadvalini ko\'ring va boshqaring',
  title: 'Haftalik Dars Jadvali',
  description: 'Filialning to\'liq haftalik dars jadvalini ko\'ring va boshqaring',
  
  // Actions
  editSchedule: 'Jadvalni tahrirlash',
  generateLessons: 'Darslar generatsiya qilish',
  addLesson: 'Dars qo\'shish',
  deleteLesson: 'Darsni o\'chirish',
  viewDetails: 'Batafsil ko\'rish',
  refresh: 'Yangilash',
  today: 'Bugun',
  previousWeek: 'Oldingi hafta',
  nextWeek: 'Keyingi hafta',
  
  // Stats
  totalLessons: 'Jami darslar',
  lessonsCount: 'ta dars',
  classesCount: 'ta sinf',
  planned: 'Rejalashtirilgan',
  completed: 'Tugallangan',
  cancelled: 'Bekor qilingan',
  classes: 'Sinflar',
  teachers: 'O\'qituvchilar',
  
  // Status labels
  statuses: {
    planned: 'Rejalashtirilgan',
    in_progress: 'Davom etmoqda',
    completed: 'Tugallangan',
    cancelled: 'Bekor qilingan',
  },
  
  // Time
  currentTime: 'Hozirgi vaqt',
  currentLesson: 'Joriy dars',
  
  // Messages
  lessonsScheduledThisWeek: 'darslar shu hafta rejalashtirilgan',
  noLessonsScheduled: 'Bu hafta darslar rejalashtirilmagan',
  scheduleRefreshed: 'Jadval yangilandi',
  lessonDeleted: 'Dars muvaffaqiyatli o\'chirildi',
  lessonCreated: 'Dars muvaffaqiyatli yaratildi',
  lessonsGenerated: 'Darslar muvaffaqiyatli yaratildi',
  noData: 'Ma\'lumot topilmadi',
  
  // Errors
  errorLoadingSchedule: 'Jadvalni yuklashda xatolik',
  errorDeletingLesson: 'Darsni o\'chirishda xatolik',
  errorCreatingLesson: 'Dars yaratishda xatolik',
  errorGeneratingLessons: 'Darslar generatsiyasida xatolik',
  
  // Toasts
  toasts: {
    refreshed: 'Jadval yangilandi',
    lessonAdded: 'Dars muvaffaqiyatli qo\'shildi',
    lessonDeleted: 'Dars muvaffaqiyatli o\'chirildi',
    lessonCompleted: 'Dars tugallandi',
    lessonsGenerated: 'Darslar muvaffaqiyatli yaratildi',
    error: 'Xatolik yuz berdi',
  },
  
  // Confirmation
  confirmDelete: 'Bu darsni o\'chirishni xohlaysizmi?',
  deleteWarning: 'Bu amalni qaytarib bo\'lmaydi.',
  
  // Empty states
  emptyCell: 'Bo\'sh',
  clickToAddLesson: 'Dars qo\'shish uchun bosing',
  
  // Dialog titles
  addLessonTitle: 'Yangi dars qo\'shish',
  generateLessonsTitle: 'Darslar generatsiya qilish',
  lessonDetailsTitle: 'Dars ma\'lumotlari',
  deleteLessonTitle: 'Darsni o\'chirish',
  
  // Form labels
  selectClass: 'Sinfni tanlang',
  selectSubject: 'Fanni tanlang',
  selectDate: 'Sanani tanlang',
  selectTime: 'Vaqtni tanlang',
  selectRoom: 'Xonani tanlang',
  selectTopic: 'Mavzuni tanlang',
  notes: 'Izohlar',
  homework: 'Uy vazifasi',
  
  // Buttons
  cancel: 'Bekor qilish',
  save: 'Saqlash',
  delete: 'O\'chirish',
  close: 'Yopish',
  generate: 'Generatsiya qilish',
  create: 'Yaratish',
  
  // Generate options
  generateThisWeek: 'Joriy hafta uchun',
  generateNextWeek: 'Keyingi hafta uchun',
  generateThisMonth: 'Joriy oy uchun',
  generateCustomRange: 'Maxsus oraliq',
  skipExisting: 'Mavjud darslarni o\'tkazib yuborish',
  
  // Lesson info
  teacher: 'O\'qituvchi',
  room: 'Xona',
  class: 'Sinf',
  subject: 'Fan',
  topic: 'Mavzu',
  time: 'Vaqt',
  date: 'Sana',
  status: 'Holat',
  lessonNumber: 'Dars raqami',
} as const;

/**
 * Format date to Uzbek format: "7-yanvar, Seshanba"
 */
export function formatDateUz(date: Date): string {
  const day = date.getDate();
  const month = MONTHS_UZ[date.getMonth()];
  
  // Map JavaScript's getDay() (0=Sunday, 1=Monday, ..., 6=Saturday)
  // to our DAYS_UZ array (0=Monday, 1=Tuesday, ..., 5=Saturday)
  const jsDay = date.getDay();
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // Sunday becomes 6, Monday becomes 0, etc.
  const dayOfWeek = DAYS_UZ[dayIndex]?.full || 'Yakshanba'; // Fallback to Sunday
  
  return `${day}-${month.toLowerCase()}, ${dayOfWeek}`;
}

/**
 * Format time to HH:mm format
 */
export function formatTimeUz(time: string): string {
  if (!time) return '';
  return time.substring(0, 5); // "08:00:00" -> "08:00"
}

/**
 * Get current lesson based on time
 * Returns null during lunch break (12:25-13:00)
 * Adjusts lesson number to account for lunch break position
 */
export function getCurrentLessonNumber(currentTime: Date): number | null {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Check if it's lunch break (12:25-13:00)
  if (timeString >= '12:25' && timeString < '13:00') {
    return null; // Tushlik vaqti - no lesson
  }
  
  // Find which time slot matches current time
  for (const slot of TIME_SLOTS) {
    if (timeString >= slot.start && timeString <= slot.end) {
      // If current time is after lunch, the lesson number should be adjusted
      // because the lesson numbers in TIME_SLOTS don't account for lunch break
      // But since TIME_SLOTS.number already represents the logical lesson number,
      // we return it as-is
      return slot.number;
    }
  }
  
  return null;
}

/**
 * Check if time is in the past
 */
export function isTimeInPast(date: Date, endTime: string): boolean {
  const now = new Date();
  const lessonDate = new Date(date);
  const [hours, minutes] = endTime.split(':').map(Number);
  lessonDate.setHours(hours, minutes, 0, 0);
  return lessonDate < now;
}

/**
 * Check if lesson is happening now
 */
export function isLessonNow(date: Date, startTime: string, endTime: string): boolean {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lessonDateStr = new Date(date).toISOString().split('T')[0];
  
  if (today !== lessonDateStr) return false;
  
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const start = startTime.substring(0, 5);
  const end = endTime.substring(0, 5);
  
  return currentTimeStr >= start && currentTimeStr <= end;
}
