/**
 * Role to URL Path Mapping Utility
 * 
 * Backend roles use underscore (branch_admin, super_admin)
 * Frontend URLs use hyphen (branch-admin, super-admin)
 */

import type { UserRole } from "@/types/auth";

/**
 * Map backend role to frontend URL path
 */
export function roleToPath(role: UserRole): string {
  const mapping: Record<UserRole, string> = {
    branch_admin: "branch-admin",
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
 */
export function pathToRole(path: string): UserRole {
  const mapping: Record<string, UserRole> = {
    "branch-admin": "branch_admin",
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
