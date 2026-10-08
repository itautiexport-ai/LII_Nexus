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
 * Returns true if the user has any Admin designation or Admin role (or is System Admin).
 * Admins can add, edit, view forms/grids, and manage modules, BUT CANNOT DELETE (unless they are System Admin).
 */
export function useIsAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  const isSysAdmin = useIsSystemAdmin();
  const isDesignationAdmin = user.designation?.toLowerCase().includes("admin") ?? false;
  const isRoleAdmin = user.roles?.some((r) => r.toLowerCase().includes("admin")) ?? false;
  return isSysAdmin || isDesignationAdmin || isRoleAdmin;
}

/**
 * Hook to check if current user can perform deletion.
 * STRICTLY RESTRICTED: Returns true ONLY for System Admin!
 */
export function useCanDelete(): boolean {
  return useIsSystemAdmin();
}

export function useCanDelegate(): boolean {
  return useIsAdmin();
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
