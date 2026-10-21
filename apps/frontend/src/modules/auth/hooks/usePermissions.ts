import { useAuthStore, CurrentUser } from "./useAuthStore";

/**
 * Returns true ONLY if the current user is a System Admin / Super Admin.
 * Deletion rights across ALL modules are strictly reserved for System Admin.
 */
export function useIsSystemAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  const email = (user.email || "").trim().toLowerCase();
  if (email === "admin" || email === "admin@liinexus.com") {
    return true;
  }
  const isSystemAdminRole = (user.roles || []).some((r) => {
    const lower = r.toLowerCase().trim();
    return (
      lower === "system admin" ||
      lower === "system administrator" ||
      lower === "system_admin" ||
      lower === "super admin" ||
      lower === "super_admin"
    );
  });
  return isSystemAdminRole;
}

/**
 * Returns true if the user's DESIGNATION is strictly Admin or Management.
 * (Or if the user is the System Administrator account).
 *
 * ALLOWED:
 * 1. System admin by email ("admin", "admin@liinexus.com") or exact system role ("System Admin", "Super Admin")
 * 2. Exact Admin designations ("Admin", "System Admin", "Administrator")
 * 3. Exact Management designations ("Management", "Top Management", "Director", "Managing Director", "MD", "Chief Executive Officer", "CEO")
 *
 * STRICTLY DISALLOWED for all other designations, including:
 * - Executive (e.g. Executive, Merchant Executive, Sales Executive, etc.)
 * - Merchant
 * - Supervisor
 * - Employee / Worker
 * - HOD / Head of Department
 * - Manager (departmental managers like HR Manager, PPIC Manager, etc.)
 * - Any user without designation (unless System Admin)
 * - Any menu role matching (e.g. "Menu: Order Management" or "Menu: Task Center -> List FMS Manager" NEVER grant admin/management rights!)
 */
export function isUserAdminOrManagement(user: CurrentUser | null | undefined): boolean {
  if (!user) return false;

  // 1. System admin by email
  const email = (user.email || "").trim().toLowerCase();
  if (email === "admin" || email === "admin@liinexus.com") {
    return true;
  }

  // 2. Exact System Admin role (NOT menu permission roles)
  const exactSystemRoles = ["system admin", "super admin", "system administrator"];
  const userRoles = (user.roles || []).map((r) => r.trim().toLowerCase());
  if (userRoles.some((r) => exactSystemRoles.includes(r))) {
    return true;
  }

  // 3. Designation check - must be present
  const desig = (user.designation || "").trim().toLowerCase();
  if (!desig) {
    return false;
  }

  // Executive Management: CEO, Director, MD
  if (
    desig === "chief executive officer" ||
    desig === "ceo" ||
    desig === "director" ||
    desig === "managing director" ||
    desig === "md"
  ) {
    return true;
  }

  // Strictly block any non-management/non-admin designation:
  if (
    desig.includes("executive") ||
    desig.includes("merchant") ||
    desig.includes("supervisor") ||
    desig.includes("employee") ||
    desig === "hod" ||
    desig === "head of department"
  ) {
    return false;
  }

  // Admin designations
  if (
    desig === "admin" ||
    desig === "system admin" ||
    desig === "administrator" ||
    desig.endsWith(" admin")
  ) {
    return true;
  }

  // Management designations
  if (
    desig === "management" ||
    desig === "top management" ||
    desig.split(/\s+/).includes("management")
  ) {
    return true;
  }

  return false;
}

/**
 * Returns true if the user has Admin or Management designation.
 */
export function useIsAdminOrManagement(): boolean {
  const user = useAuthStore((s) => s.user);
  return isUserAdminOrManagement(user);
}

export function useIsAdmin(): boolean {
  return useIsAdminOrManagement();
}

/**
 * Hook to check if current user can transfer / reassign leads.
 * Allowed ONLY for users whose designation is Admin or Management.
 */
export function useCanTransferLead(): boolean {
  const user = useAuthStore((s) => s.user);
  return isUserAdminOrManagement(user);
}

/**
 * Hook to check if current user can edit a lead.
 * Allowed ONLY for users whose designation is Admin or Management.
 */
export function useCanEditLead(): boolean {
  const user = useAuthStore((s) => s.user);
  return isUserAdminOrManagement(user);
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

/**
 * Helper to check whether a user is Admin, Management, or HOD.
 * Allowed to view all leads across the whole organization.
 */
export function isUserAdminManagementOrHod(user: CurrentUser | null | undefined): boolean {
  if (!user) return false;
  if (isUserAdminOrManagement(user)) return true;

  const desig = (user.designation || "").trim().toLowerCase();
  if (desig.includes("executive") || desig.includes("merchant")) {
    return false;
  }
  if (desig.includes("hod") || desig.includes("head of department")) {
    return true;
  }

  return false;
}

/**
 * Hook to check if current user can view all leads across all merchants.
 * True for Admin, Management, and HOD designations/roles.
 */
export function useCanViewAllLeads(): boolean {
  const user = useAuthStore((s) => s.user);
  return isUserAdminManagementOrHod(user);
}


