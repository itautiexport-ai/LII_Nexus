import { ReactNode } from "react";
import { useIsAdmin } from "../../modules/auth/hooks/usePermissions";

export default function AdminGate({ children }: { children: ReactNode }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  
  return <>{children}</>;
}
