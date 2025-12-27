/**
 * Common API Types
 */

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  non_field_errors?: string[];
}

// Detailed membership type for lists and management
export interface MembershipDetail {
  id: string;
  branch_id: string;
  role: string;
  role_display?: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  full_name?: string;
  phone_number?: string;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
}
