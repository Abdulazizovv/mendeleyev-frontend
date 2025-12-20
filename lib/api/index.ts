export { default as apiClient, handleApiError } from "./client";
export { authApi } from "./auth";
export { schoolApi } from "./school";
export { branchApi } from "./branch";
export { hrApi } from "./hr";
export { staffApi } from "./staff";
export { financeApi } from "./finance";

// Re-export types
export type { Role, MembershipDetail, BalanceUpdateRequest, RoleRequest, BranchStatistics } from "./branch";
export type { 
  Student, 
  StudentProfileSummary,
  StudentPhoneCheckBranchData,
  StudentPhoneCheckResponse,
  StudentRelative,
  PaginatedResponse, 
  Class, 
  AcademicYear,
  Quarter,
  Subject,
  Room,
  Building,
  CreateStudentRequest,
  CreateStudentRelativeRequest,
  RelationshipType
} from "@/types/school";
