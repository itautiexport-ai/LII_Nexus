import { useAuthStore } from "./useAuthStore";

/**
 * Returns true ONLY if the current user is a System Admin / Super Admin.
 * Deletion rights across ALL modules are strictly reserved for System Admin.
 */
export function useIsSystemAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  const isEmailAdmin = user.email?.toLowerCase() === "admin" || user.email?.toLowerCase() === "admin@liinexus.com";
  const isSystemAdminRole = user.roles?.some((r) => {
    const lower = r.toLowerCase();
    return lower === "system admin" || lower === "system administrator" || lower === "system_admin" || lower === "super admin" || lower === "super_admin";
  }) ?? false;
  return isEmailAdmin || isSystemAdminRole;
}

/**
 * Returns true if the user has any Admin / Management designation or role (or is System Admin).
 * Allows viewing all records, adding, and editing, BUT CANNOT DELETE (unless they are System Admin).
 */
export function useIsAdminOrManagement(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  const isSysAdmin = useIsSystemAdmin();
  const desig = (user.designation || "").toLowerCase();
  const isDesignationMatch = desig.includes("admin") || desig.includes("management") || desig.includes("management executive");
  const isRoleMatch = user.roles?.some((r) => {
    const lower = r.toLowerCase();
    return lower.includes("admin") || lower.includes("management");
  }) ?? false;
  return isSysAdmin || isDesignationMatch || isRoleMatch;
}

export function useIsAdmin(): boolean {
  return useIsAdminOrManagement();
}

/**
 * Hook to check if current user can perform deletion.
 * STRICTLY RESTRICTED: Returns true ONLY for System Admin!
 */
export function useCanDelete(): boolean {
  return useIsSystemAdmin();
}

export function useCanDelegate(): boolean {
  return useIsAdminOrManagement();
}

/**
 * Permission check hook.
 * - Any permission containing "delete" or "deactivate" returns true ONLY for System Admin.
 * - Admin users (role or designation) get addition/editing/viewing permissions.
 * - Non-admin designations get explicit permissions assigned to them.
 */
export function useHasPermission(permissionKey: string): boolean {
  const permissions = useAuthStore((s) => s.permissions);
  const isSysAdmin = useIsSystemAdmin();
  const isAdmin = useIsAdmin();
  const isDeleteAction = permissionKey.toLowerCase().includes("delete") || permissionKey.toLowerCase().includes("deactivate");

  if (isDeleteAction) {
    return isSysAdmin;
  }

  if (isAdmin) return true;

  return permissions.includes(permissionKey);
}

