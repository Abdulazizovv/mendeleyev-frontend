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

// Roles that have full access to branch dashboard (school / training-center)
const BRANCH_STAFF_ROLES: UserRole[] = [
  "branch_admin",
  "admin",
  "accountant",
  "manager",
  "director",
];

/**
 * Map backend role to frontend URL path.
 * Staff roles (admin, accountant, manager, director) are routed to the
 * branch-specific dashboard, same as branch_admin.
 */
export function roleToPath(role: UserRole, branchType?: BranchType): string {
  if (BRANCH_STAFF_ROLES.includes(role) && branchType) {
    return branchType === "center" ? "training-center" : "school";
  }

  const mapping: Partial<Record<UserRole, string>> = {
    branch_admin: "school", // fallback when branchType is unknown
    super_admin: "super-admin",
    teacher: "teacher",
    student: "student",
    parent: "parent",
    other: "other",
  };

  return mapping[role] ?? "school";
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
