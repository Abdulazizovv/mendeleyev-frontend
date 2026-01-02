import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { API_CONFIG, getApiUrl, STORAGE_KEYS } from "@/lib/config";
import type { ApiError } from "@/types";

/**
 * Axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}`,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor - Add auth token and branch ID
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (client-side only)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add X-Branch-Id header from current branch
      const currentBranchStr = localStorage.getItem(STORAGE_KEYS.CURRENT_BRANCH);
      console.log('🔍 CURRENT_BRANCH from localStorage:', currentBranchStr);
      
      if (currentBranchStr) {
        try {
          const currentBranch = JSON.parse(currentBranchStr);
          console.log('📦 Parsed currentBranch:', currentBranch);
          
          // branch_id is a UUID string in currentBranch object
          const branchId = currentBranch?.branch_id;
          console.log('🆔 Extracted branch_id:', branchId);
          
          if (branchId && config.headers) {
            config.headers['X-Branch-Id'] = String(branchId);
            console.log('🏢 Adding X-Branch-Id header:', branchId);
          } else {
            console.warn('⚠️ branch_id not found in currentBranch:', currentBranch);
          }
        } catch (error) {
          console.error('❌ Error parsing current branch:', error);
        }
      } else {
        console.warn('⚠️ CURRENT_BRANCH not found in localStorage');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle token refresh
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 403: Do NOT auto-logout for generic permission denials
    // Only logout if clearly auth/revocation related
    if (error.response?.status === 403) {
      try {
        const url = (error.config?.url || "").toString();
        const data: any = (error.response?.data as any) || {};
        const detailText = (
          typeof data === "string"
            ? data
            : data.detail || data.message || ""
        )
          .toString()
          .toLowerCase();

        const authLikeUrl = url.includes("/auth/");
        const revocationHints = [
          "revoked",
          "inactive",
          "blocked",
          "deleted",
          "suspended",
          "invalid token",
          "token has expired",
          "credentials",
          "account disabled",
        ];
        const hasRevocationHint = revocationHints.some((k) => detailText.includes(k));

        if (authLikeUrl || hasRevocationHint) {
          if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_BRANCH);
            window.location.href = "/login";
          }
        }
      } catch {
        // Swallow parsing errors and just propagate 403
      }
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          // No refresh token, redirect to login
          processQueue(new Error("No refresh token"), null);
          isRefreshing = false;
          window.location.href = "/login";
          return Promise.reject(error);
        }

        try {
          const response = await axios.post(getApiUrl("/auth/refresh/"), {
            refresh: refreshToken,
          });

          const { access, refresh } = response.data;

          // Update tokens
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
          if (refresh) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
          }

          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }

          processQueue(null, access);
          isRefreshing = false;

          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as Error, null);
          isRefreshing = false;

          // Clear tokens and redirect to login
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_BRANCH);

          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Error handler helper
 */
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    // Return the full error for proper parsing
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    
    // Network error
    if (!axiosError.response) {
      return {
        message: "Internet aloqasi yo'q. Iltimos, ulanishni tekshiring.",
      };
    }
    
    return {
      message: axiosError.message || "Xatolik yuz berdi",
    };
  }
  
  return {
    message: "Noma'lum xatolik",
  };
};

export default apiClient;
