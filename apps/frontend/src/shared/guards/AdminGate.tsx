import { ReactNode } from "react";
import { useAuthStore } from "../../modules/auth/hooks/useAuthStore";

export default function AdminGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  
  if (!user) return null;
  
  const isAdmin = user.roles.includes("System Admin");
  if (!isAdmin) return null;
  
  return <>{children}</>;
}
