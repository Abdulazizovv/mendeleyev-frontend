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

/**
 * Format currency with Uzbek format
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '0 so\'m';
  return `${amount.toLocaleString('uz-UZ')} so'm`;
}

/**
 * Format date in Uzbek style
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Format: DD.MM.YYYY
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}.${month}.${year}`;
}

/**
 * Format datetime in Uzbek style
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Format: DD.MM.YYYY HH:MM
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
