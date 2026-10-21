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

  const desig = (user.designation || "").trim().toLowerCase();

  // Executives are NEVER Admin or Management!
  if (desig.includes("executive")) {
    return false;
  }

  if (useIsSystemAdmin()) return true;

  const email = (user.email || "").toLowerCase().trim();
  if (email === "admin" || email === "admin@liinexus.com") return true;

  const exactAdminDesigs = ["admin", "system admin", "administrator", "management", "director", "ceo", "chief executive officer"];
  if (exactAdminDesigs.includes(desig)) return true;

  const exactAdminRoles = ["system admin", "super admin", "admin", "administrator", "management", "director", "ceo"];
  const isRoleMatch = user.roles?.some((r) => exactAdminRoles.includes(r.toLowerCase().trim())) ?? false;

  return isRoleMatch;
}

export function useIsAdmin(): boolean {
  return useIsAdminOrManagement();
}

/**
 * Hook to check if current user can transfer / reassign leads.
 * STRICTLY RESTRICTED:
 * Allowed ONLY for:
 * 1. Admin (System Admin, Super Admin, email "admin" / "admin@liinexus.com", or designation/role containing "Admin")
 * 2. Management (designation/role containing "Management", "Manager", "Director", "CEO", "MD")
 *
 * STRICTLY DISALLOWED for:
 * - Any user whose designation contains "executive" (e.g. Executive, Merchant Executive, Sales Executive, etc.)
 * - Merchant HOD, regular merchants, supervisors, regular employees, or HODs of other departments.
 */
export function useCanTransferLead(): boolean {
  return useCanEditLead();
}

/**
 * Hook to check if current user can edit a lead.
 * STRICTLY RESTRICTED:
 * Allowed ONLY for:
 * 1. Admin (System Admin, Super Admin, email "admin" / "admin@liinexus.com", or designation/role containing "Admin")
 * 2. Management (designation/role containing "Management", "Manager", "Director", "CEO", "MD")
 *
 * STRICTLY DISALLOWED for:
 * - Any user whose designation contains "executive" (e.g. Executive, Merchant Executive, Sales Executive, etc.)
 * - Regular merchants, supervisors, regular employees, or HODs.
 */
export function useCanEditLead(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;

  const desig = (user.designation || "").trim().toLowerCase();

  // 1. If designation contains "executive", strictly NO edit option!
  if (desig.includes("executive")) {
    return false;
  }

  // 2. Admin email
  const email = (user.email || "").trim().toLowerCase();
  if (email === "admin" || email === "admin@liinexus.com") {
    return true;
  }

  // 3. Roles check
  const roleNames = (user.roles || []).map((r) => r.trim().toLowerCase());
  const adminOrMgmtRoles = [
    "system admin",
    "super admin",
    "system administrator",
    "admin",
    "administrator",
    "management",
    "manager",
    "director",
    "ceo",
  ];
  if (roleNames.some((r) => adminOrMgmtRoles.some((role) => r.includes(role)))) {
    return true;
  }

  // 4. Designation check (Admin, Administrator, Management, Manager, Director, CEO, MD)
  if (
    desig.includes("admin") ||
    desig.includes("manage") ||
    desig.includes("director") ||
    desig.includes("ceo") ||
    desig === "md"
  ) {
    return true;
  }

  return false;
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

