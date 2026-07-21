import { useEffect, useState } from "react";
import { performanceApi, MyEmployeeRecord } from "../api/performanceApi";

export function useMyEmployee() {
  const [employee, setEmployee] = useState<MyEmployeeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    performanceApi.getMyEmployeeRecord()
      .then(setEmployee)
      .finally(() => setLoading(false));
  }, []);

  return { employee, loading };
}
