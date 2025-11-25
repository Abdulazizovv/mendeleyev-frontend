/**
 * Error messages in Uzbek language
 */

export const ERROR_MESSAGES: Record<string, string> = {
  // Common errors
  network_error: "Internet aloqasi yo'q. Iltimos, internet ulanishini tekshiring.",
  unknown_error: "Noma'lum xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
  server_error: "Server xatoligi. Iltimos, keyinroq urinib ko'ring.",
  timeout_error: "So'rov vaqti tugadi. Iltimos, qaytadan urinib ko'ring.",

  // Auth errors - 400
  invalid_credentials: "Telefon raqami yoki parol noto'g'ri. Iltimos, qaytadan kiriting.",
  invalid_phone: "Telefon raqami noto'g'ri formatda. +998XXXXXXXXX formatida kiriting.",
  invalid_password: "Parol noto'g'ri. Iltimos, qaytadan kiriting.",
  password_too_short: "Parol kamida 8 ta belgidan iborat bo'lishi kerak.",
  password_too_common: "Parol juda oddiy. Murakkab parol o'ylab toping.",
  password_numeric: "Parol faqat raqamlardan iborat bo'lishi mumkin emas.",
  
  // OTP errors
  invalid_otp: "Tasdiqlash kodi noto'g'ri. Iltimos, qaytadan kiriting.",
  otp_expired: "Tasdiqlash kodi muddati tugagan. Yangi kod so'rang.",
  otp_not_found: "Tasdiqlash kodi topilmadi. Iltimos, avval kod so'rang.",
  
  // User state errors
  user_not_found: "Foydalanuvchi topilmadi. Administrator bilan bog'laning.",
  phone_not_verified: "Telefon raqam tasdiqlanmagan. Avval tasdiqlash kodini kiriting.",
  no_active_branch: "Sizda faol filial yo'q. Administrator bilan bog'laning.",
  
  // Rate limiting
  too_many_requests: "Juda ko'p so'rov yuborildi. Iltimos, bir oz kuting.",
  otp_cooldown: "OTP kodini qayta yuborish uchun biroz kuting.",
  
  // Token errors - 401
  token_invalid: "Sessiya yaroqsiz. Iltimos, qayta kirish.",
  token_expired: "Sessiya muddati tugadi. Iltimos, qayta kirish.",
  
  // Permission errors - 403
  permission_denied: "Sizda bu amalni bajarish uchun ruxsat yo'q.",
  branch_inactive: "Filial faol emas. Administrator bilan bog'laning.",
  
  // Validation errors
  field_required: "Bu maydon to'ldirilishi shart.",
  invalid_format: "Noto'g'ri format.",
  
  // Branch errors
  branch_not_found: "Filial topilmadi.",
  no_branch_access: "Sizda bu filialga kirish huquqi yo'q.",
};

/**
 * Parse backend error and return user-friendly Uzbek message
 */
export const parseBackendError = (error: any): string => {
  // Network error
  if (!error.response) {
    return ERROR_MESSAGES.network_error;
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Handle different status codes
  switch (status) {
    case 400: {
      // Validation errors
      if (data?.detail) {
        const detail = data.detail.toLowerCase();
        
        // Invalid credentials
        if (detail.includes("invalid") && detail.includes("credential")) {
          return ERROR_MESSAGES.invalid_credentials;
        }
        
        // Invalid phone
        if (detail.includes("phone") && detail.includes("invalid")) {
          return ERROR_MESSAGES.invalid_phone;
        }
        
        // Invalid OTP
        if (detail.includes("invalid") && (detail.includes("otp") || detail.includes("code"))) {
          return ERROR_MESSAGES.invalid_otp;
        }
        
        // OTP expired
        if (detail.includes("expired") && (detail.includes("otp") || detail.includes("code"))) {
          return ERROR_MESSAGES.otp_expired;
        }
        
        // Password errors
        if (detail.includes("password")) {
          if (detail.includes("short")) return ERROR_MESSAGES.password_too_short;
          if (detail.includes("common")) return ERROR_MESSAGES.password_too_common;
          if (detail.includes("numeric")) return ERROR_MESSAGES.password_numeric;
        }
        
        return data.detail;
      }
      
      // Field errors
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          return firstError[0] as string;
        }
      }
      
      // Non-field errors
      if (data?.non_field_errors && Array.isArray(data.non_field_errors)) {
        return data.non_field_errors[0];
      }
      
      return ERROR_MESSAGES.invalid_credentials;
    }

    case 401: {
      if (data?.detail) {
        const detail = data.detail.toLowerCase();
        if (detail.includes("token") && detail.includes("invalid")) {
          return ERROR_MESSAGES.token_invalid;
        }
        if (detail.includes("token") && detail.includes("expired")) {
          return ERROR_MESSAGES.token_expired;
        }
      }
      return ERROR_MESSAGES.token_invalid;
    }

    case 403: {
      if (data?.detail) {
        return data.detail;
      }
      return ERROR_MESSAGES.permission_denied;
    }

    case 404: {
      if (data?.detail) {
        const detail = data.detail.toLowerCase();
        if (detail.includes("user") || detail.includes("phone")) {
          return ERROR_MESSAGES.user_not_found;
        }
        if (detail.includes("branch")) {
          return ERROR_MESSAGES.branch_not_found;
        }
      }
      return ERROR_MESSAGES.user_not_found;
    }

    case 429: {
      return ERROR_MESSAGES.too_many_requests;
    }

    case 500:
    case 502:
    case 503:
    case 504: {
      return ERROR_MESSAGES.server_error;
    }

    default: {
      return data?.detail || data?.message || ERROR_MESSAGES.unknown_error;
    }
  }
};

/**
 * Get success message in Uzbek
 */
export const SUCCESS_MESSAGES = {
  login_success: "Tizimga muvaffaqiyatli kirdingiz!",
  otp_sent: "Tasdiqlash kodi telefon raqamingizga yuborildi.",
  otp_verified: "Telefon raqam tasdiqlandi.",
  password_set: "Parol muvaffaqiyatli o'rnatildi.",
  password_changed: "Parol muvaffaqiyatli o'zgartirildi.",
  logout_success: "Tizimdan chiqdingiz.",
  branch_switched: "Filial muvaffaqiyatli almashtirildi.",
};
