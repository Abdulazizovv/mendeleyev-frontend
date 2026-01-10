/**
 * Role to URL Path Mapping Utility
 * 
 * Backend roles use underscore (branch_admin, super_admin)
 * Frontend URLs use hyphen (branch-admin, super-admin)
 * 
 * BranchAdmin path depends on branchType:
 * - school => /school
 * - training_center => /training-center
 */

import type { UserRole, BranchType } from "@/types/auth";

/**
 * Map backend role to frontend URL path
 * For branch_admin, requires branchType for proper routing
 */
export function roleToPath(role: UserRole, branchType?: BranchType): string {
  if (role === "branch_admin" && branchType) {
    return branchType === "training_center" ? "training-center" : "school";
  }

  const mapping: Record<UserRole, string> = {
    branch_admin: "branch-admin", // fallback if branchType not provided
    super_admin: "super-admin",
    teacher: "teacher",
    student: "student",
    parent: "parent",
    other: "other",
  };

  return mapping[role] || role;
}


/**
 * Map frontend URL path to backend role
 * Handles both old and new routing:
 * - /branch-admin => branch_admin
 * - /school => branch_admin
 * - /training-center => branch_admin
 */
export function pathToRole(path: string): UserRole {
  const mapping: Record<string, UserRole> = {
    "branch-admin": "branch_admin",
    "school": "branch_admin",
    "training-center": "branch_admin",
    "super-admin": "super_admin",
    "teacher": "teacher",
    "student": "student",
    "parent": "parent",
    "other": "other",
  };

  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  
  return (mapping[cleanPath] as UserRole) || "other";
}
