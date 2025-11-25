import apiClient from "./client";
import { API_ENDPOINTS } from "@/lib/config";
import type {
  PhoneCheckRequest,
  PhoneCheckResponse,
  OTPRequest,
  OTPConfirmRequest,
  OTPConfirmResponse,
  PasswordSetRequest,
  LoginRequest,
  LoginResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  BranchSwitchRequest,
  BranchSwitchResponse,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  PasswordChangeRequest,
  MeResponse,
  BranchMembership,
  PaginatedResponse,
} from "@/types";

/**
 * Auth API Service
 */
export const authApi = {
  /**
   * Check phone number status
   */
  checkPhone: async (data: PhoneCheckRequest): Promise<PhoneCheckResponse> => {
    const response = await apiClient.post<PhoneCheckResponse>(
      API_ENDPOINTS.AUTH.PHONE_CHECK,
      data
    );
    return response.data;
  },

  /**
   * Request OTP for phone verification
   */
  requestOTP: async (data: OTPRequest): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      API_ENDPOINTS.AUTH.PHONE_VERIFY_REQUEST,
      data
    );
    return response.data;
  },

  /**
   * Confirm OTP for phone verification
   */
  confirmOTP: async (data: OTPConfirmRequest): Promise<OTPConfirmResponse> => {
    const response = await apiClient.post<OTPConfirmResponse>(
      API_ENDPOINTS.AUTH.PHONE_VERIFY_CONFIRM,
      data
    );
    return response.data;
  },

  /**
   * Set password (after phone verification)
   */
  setPassword: async (
    data: PasswordSetRequest
  ): Promise<{ access: string; refresh: string; state: string }> => {
    const response = await apiClient.post<{
      access: string;
      refresh: string;
      state: string;
    }>(API_ENDPOINTS.AUTH.PASSWORD_SET, data);
    return response.data;
  },

  /**
   * Login with phone and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (data: TokenRefreshRequest): Promise<TokenRefreshResponse> => {
    const response = await apiClient.post<TokenRefreshResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      data
    );
    return response.data;
  },

  /**
   * Switch branch
   */
  switchBranch: async (data: BranchSwitchRequest): Promise<BranchSwitchResponse> => {
    const response = await apiClient.post<BranchSwitchResponse>(
      API_ENDPOINTS.AUTH.SWITCH_BRANCH,
      data
    );
    return response.data;
  },

  /**
   * Request password reset OTP
   */
  requestPasswordReset: async (data: PasswordResetRequest): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST,
      data
    );
    return response.data;
  },

  /**
   * Confirm password reset with OTP
   */
  confirmPasswordReset: async (
    data: PasswordResetConfirmRequest
  ): Promise<PasswordResetConfirmResponse> => {
    const response = await apiClient.post<PasswordResetConfirmResponse>(
      API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM,
      data
    );
    return response.data;
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (data: PasswordChangeRequest): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      API_ENDPOINTS.AUTH.PASSWORD_CHANGE,
      data
    );
    return response.data;
  },

  /**
   * Get current user info (/me endpoint)
   */
  getMe: async (): Promise<MeResponse> => {
    const response = await apiClient.get<MeResponse>(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  /**
   * Get user's branches
   */
  getMyBranches: async (): Promise<PaginatedResponse<BranchMembership>> => {
    const response = await apiClient.get<PaginatedResponse<BranchMembership>>(
      API_ENDPOINTS.AUTH.MY_BRANCHES
    );
    return response.data;
  },
};
