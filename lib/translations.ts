/**
 * Mendeleyev Frontend - O'zbek Tarjimalari
 * 
 * Backend dan keladigan inglizcha terminlarni o'zbek tiliga tarjima qilish uchun
 */

// Branch type translations
export const BRANCH_TYPE_TRANSLATIONS: Record<string, string> = {
  // Backend types
  'branch': 'Filial',
  'center': 'Markaz',
  'school': 'Maktab',
  
  // Plural forms
  'branches': 'Filiallar',
  'centers': 'Markazlar',
  'schools': 'Maktablar',
};

// Role translations
export const ROLE_TRANSLATIONS: Record<string, string> = {
  'student': 'O\'quvchi',
  'teacher': 'O\'qituvchi',
  'parent': 'Ota-ona',
  'admin': 'Administrator',
  'super_admin': 'Super Administrator',
  'accountant': 'Buxgalter',
  'manager': 'Menejer',
  'director': 'Direktor',
  'branch_admin': 'Filial admini',
  'branch admin': 'Filial admini',
};

// Status translations
export const STATUS_TRANSLATIONS: Record<string, string> = {
  'active': 'Faol',
  'inactive': 'Faol emas',
  'pending': 'Kutilmoqda',
  'approved': 'Tasdiqlangan',
  'rejected': 'Rad etilgan',
  'suspended': 'To\'xtatilgan',
};

// Gender translations
export const GENDER_TRANSLATIONS: Record<string, string> = {
  'male': 'Erkak',
  'female': 'Ayol',
  'other': 'Boshqa',
};

// Day of week translations
export const DAY_TRANSLATIONS: Record<string, string> = {
  'monday': 'Dushanba',
  'tuesday': 'Seshanba',
  'wednesday': 'Chorshanba',
  'thursday': 'Payshanba',
  'friday': 'Juma',
  'saturday': 'Shanba',
  'sunday': 'Yakshanba',
};

/**
 * Translate branch type to Uzbek
 */
export function translateBranchType(type: string | undefined | null): string {
  if (!type) return 'Filial';
  return BRANCH_TYPE_TRANSLATIONS[type.toLowerCase()] || type;
}

/**
 * Translate role to Uzbek
 */
export function translateRole(role: string | undefined | null): string {
  if (!role) return '';
  return ROLE_TRANSLATIONS[role.toLowerCase()] || role;
}

/**
 * Translate status to Uzbek
 */
export function translateStatus(status: string | undefined | null): string {
  if (!status) return '';
  return STATUS_TRANSLATIONS[status.toLowerCase()] || status;
}

/**
 * Translate gender to Uzbek
 */
export function translateGender(gender: string | undefined | null): string {
  if (!gender) return '';
  return GENDER_TRANSLATIONS[gender.toLowerCase()] || gender;
}

/**
 * Translate day of week to Uzbek
 */
export function translateDay(day: string | undefined | null): string {
  if (!day) return '';
  return DAY_TRANSLATIONS[day.toLowerCase()] || day;
}

const UZ_MONTHS_SHORT = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyun',
  'iyul', 'avg', 'sen', 'okt', 'noy', 'dek',
];

const UZ_MONTHS_LONG = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

/**
 * Format currency with Uzbek format — spaces as thousands separator.
 * Example: 1 200 000 so'm  |  -500 000 so'm
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "0 so'm";
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded);
  // Use space as thousands separator (Uzbek standard)
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (rounded < 0 ? '−' : '') + formatted + " so'm";
}

/**
 * Format date → DD.MM.YYYY
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

/**
 * Format date → "12 may 2026"  (Uzbek short month)
 */
export function formatDateUz(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${UZ_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format date → "12 Yanvar 2026"  (Uzbek long month)
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${UZ_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format datetime → DD.MM.YYYY HH:MM
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day  = String(d.getDate()).padStart(2, '0');
  const mon  = String(d.getMonth() + 1).padStart(2, '0');
  const h    = String(d.getHours()).padStart(2, '0');
  const m    = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${mon}.${d.getFullYear()} ${h}:${m}`;
}

/**
 * Format datetime → "12 may, 14:30"
 */
export function formatDateTimeShort(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${UZ_MONTHS_SHORT[d.getMonth()]}, ${h}:${m}`;
}

/**
 * Relative time label — "bugun", "kecha", "3 kun oldin", etc.
 */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  const diffMs = today.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'Bugun';
  if (diffDays === 1) return 'Kecha';
  if (diffDays < 7)  return `${diffDays} kun oldin`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta oldin`;
  return formatDateUz(d);
}
