import { useAuthStore } from "./useAuthStore";

export function useHasPermission(permissionKey: string): boolean {
  const permissions = useAuthStore((s) => s.permissions);
  return permissions.includes(permissionKey);
}
