import { ReactNode } from "react";
import { useHasPermission } from "../../modules/auth/hooks/usePermissions";

export default function PermissionGate({ permission, children }: { permission: string; children: ReactNode }) {
  const hasPermission = useHasPermission(permission);
  if (!hasPermission) return null;
  return <>{children}</>;
}
