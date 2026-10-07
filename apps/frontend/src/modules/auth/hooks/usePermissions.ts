import { useAuthStore } from "./useAuthStore";

export function useIsAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  const isEmailAdmin = user.email?.toLowerCase() === "admin" || user.email?.toLowerCase() === "admin@liinexus.com";
  const isDesignationAdmin = user.designation?.toLowerCase().includes("admin") ?? false;
  const isRoleAdmin = user.roles?.some((r) => r.toLowerCase().includes("admin")) ?? false;
  return isEmailAdmin || isDesignationAdmin || isRoleAdmin;
}

export function useCanDelegate(): boolean {
  return useIsAdmin();
}

export function useHasPermission(permissionKey: string): boolean {
  const permissions = useAuthStore((s) => s.permissions);
  const isAdmin = useIsAdmin();
  const isDeleteAction = permissionKey.toLowerCase().includes("delete") || permissionKey.toLowerCase().includes("deactivate");

  if (isDeleteAction) {
    return isAdmin;
  }

  if (isAdmin) return true;

  return permissions.includes(permissionKey);
}
