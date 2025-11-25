/**
 * Auth Types - Backend API ga mos ravishda
 */

export type AuthState =
  | "NOT_FOUND"
  | "NOT_VERIFIED"
  | "NEEDS_PASSWORD"
  | "READY"
  | "NO_BRANCH"
  | "MULTI_BRANCH";

export type UserRole =
  | "super_admin"
  | "branch_admin"
  | "teacher"
  | "student"
  | "parent"
  | "other";

export type BranchType = "school" | "center";
export type BranchStatus = "active" | "inactive" | "archived";

export interface User {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  is_staff: boolean;
  date_joined: string;
}

export interface Profile {
  id: string | null;
  avatar?: string;
  date_of_birth?: string;
  gender?: "male" | "female";
  language?: string;
  timezone?: string;
  bio?: string;
  address?: string;
  socials?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  status: BranchStatus;
  slug?: string;
  location?: string;
}

export interface BranchMembership {
  branch_id: string;
  branch_name: string;
  branch_type: BranchType;
  branch_status: BranchStatus;
  role: UserRole;
  title?: string;
  salary?: number;
  balance?: number;
  effective_role?: UserRole;
  role_data?: TeacherProfile | StudentProfile | ParentProfile | AdminProfile | null;
}

export interface CurrentBranch extends BranchMembership {}

export interface TeacherProfile {
  subject?: string;
  experience_years?: number;
  bio?: string;
}

export interface StudentProfile {
  grade?: string;
  parent_name?: string;
}

export interface ParentProfile {
  notes?: string;
  related_students?: Array<{
    id: string;
    grade: string;
  }>;
}

export interface AdminProfile {
  is_super_admin: boolean;
  managed_branches: Array<{
    id: string;
    name: string;
  }>;
  title?: string;
  notes?: string;
}

export interface MeResponse {
  user: User;
  profile: Profile;
  current_branch: CurrentBranch | null;
  memberships: BranchMembership[];
  auth_state: AuthState;
}

// Auth Request/Response types
export interface PhoneCheckRequest {
  phone_number: string;
}

export interface PhoneCheckResponse {
  state: AuthState;
}

export interface OTPRequest {
  phone_number: string;
}

export interface OTPConfirmRequest {
  phone_number: string;
  code: string;
}

export interface OTPConfirmResponse {
  state: AuthState;
  access?: string;
  refresh?: string;
}

export interface PasswordSetRequest {
  phone_number: string;
  password: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
  branch_id?: string;
}

export interface LoginSuccessResponse {
  access: string;
  refresh: string;
  user: User;
  br?: string;
  br_role?: UserRole;
  state?: "READY";
}

export interface LoginMultiBranchResponse {
  state: "MULTI_BRANCH";
  branches: BranchMembership[];
}

export interface LoginNoBranchResponse {
  state: "NO_BRANCH";
}

export type LoginResponse =
  | LoginSuccessResponse
  | LoginMultiBranchResponse
  | LoginNoBranchResponse;

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
  refresh: string;
}

export interface BranchSwitchRequest {
  refresh: string;
  branch_id: string;
}

export interface BranchSwitchResponse {
  access: string;
  refresh: string;
  br: string;
  br_role?: UserRole;
}

export interface PasswordResetRequest {
  phone_number: string;
}

export interface PasswordResetConfirmRequest {
  phone_number: string;
  code: string;
  new_password: string;
}

export interface PasswordResetConfirmResponse {
  access: string;
  refresh: string;
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
}
