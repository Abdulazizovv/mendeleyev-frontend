import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// O'zbek tili oy nomlari
export const uzbekMonths = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];

// Sana formatlash - agar bugun/kecha bo'lsa maxsus ko'rsatish
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Vaqtni 00:00:00 ga o'rnatish taqqoslash uchun
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Bugun";
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Kecha";
  } else {
    const day = date.getDate();
    const month = uzbekMonths[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month} ${year}-yil`;
  }
}

// Sana va vaqt formatlash
export function formatRelativeDateTime(dateString: string): string {
  const date = new Date(dateString);
  const relativeDate = formatRelativeDate(dateString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  
  if (relativeDate === "Bugun" || relativeDate === "Kecha") {
    return `${relativeDate}, ${hours}:${minutes}`;
  }
  return `${relativeDate}, ${hours}:${minutes}`;
}

// Oy nomini olish (1-12)
export function getMonthName(month: number): string {
  return uzbekMonths[month - 1] || "";
}

// Yil va oy uchun oy-yil formati
export function formatMonthYear(year: number, month: number): string {
  return `${getMonthName(month)} ${year}`;
}

// Pul formatlash (spaces bilan)
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "0 so'm";
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}
