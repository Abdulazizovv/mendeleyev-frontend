/**
 * API Configuration Constants
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  VERSION: process.env.NEXT_PUBLIC_API_VERSION || "v1",
  TIMEOUT: 30000, // 30 seconds
} as const;

// Debug log to verify environment variables
if (typeof window !== 'undefined') {
  console.log('🔧 API_CONFIG:', {
    BASE_URL: API_CONFIG.BASE_URL,
    VERSION: API_CONFIG.VERSION,
    ENV_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  });
}

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    PHONE_CHECK: "/auth/phone/check/",
    PHONE_VERIFY_REQUEST: "/auth/phone/verification/request/",
    PHONE_VERIFY_CONFIRM: "/auth/phone/verification/confirm/",
    PASSWORD_SET: "/auth/password/set/",
    PASSWORD_CHANGE: "/auth/password/change/",
    PASSWORD_RESET_REQUEST: "/auth/password/reset/request-otp/",
    PASSWORD_RESET_CONFIRM: "/auth/password/reset/confirm/",
    LOGIN: "/auth/login/",
    REFRESH: "/auth/refresh/",
    ME: "/auth/me/",
    MY_BRANCHES: "/auth/branches/mine/",
    SWITCH_BRANCH: "/auth/branch/switch/",
  },
  // Profile endpoints
  PROFILE: {
    MY_PROFILE: "/profile/me/",
    BRANCH_PROFILE: (branchId: string) => `/profile/branch/${branchId}/`,
  },
  // Branch endpoints
  BRANCH: {
    MANAGED: "/branches/managed/",
    ROLES: (branchId: string) => `/branches/${branchId}/roles/`,
    ROLE_DETAIL: (branchId: string, roleId: string) =>
      `/branches/${branchId}/roles/${roleId}/`,
    MEMBERSHIPS: (branchId: string) => `/branches/${branchId}/memberships/`,
    BALANCE_UPDATE: (branchId: string, membershipId: string) =>
      `/branches/${branchId}/memberships/${membershipId}/balance/`,
  },
} as const;

/**
 * Get full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");
  const version = API_CONFIG.VERSION;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api/${version}${path}`;
};

/**
 * App Constants
 */
export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || "Mendeleyev",
  DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "uz",
  OTP_LENGTH: parseInt(process.env.NEXT_PUBLIC_OTP_LENGTH || "6"),
  OTP_COOLDOWN: parseInt(process.env.NEXT_PUBLIC_OTP_COOLDOWN || "60"),
} as const;

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "mendeleyev_access_token",
  REFRESH_TOKEN: "mendeleyev_refresh_token",
  USER: "mendeleyev_user",
  CURRENT_BRANCH: "mendeleyev_current_branch",
  LANGUAGE: "mendeleyev_language",
  THEME: "mendeleyev_theme",
} as const;
