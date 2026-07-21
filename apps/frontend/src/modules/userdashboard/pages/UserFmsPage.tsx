import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { fmsApi, FmsStep } from "../../fms/api/fmsApi";
import "./UserDashboardPage.css";

interface FmsStepWithManager extends FmsStep {
  managerName: string;
}

export function UserFmsPage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [fmsSteps, setFmsSteps] = useState<FmsStepWithManager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const empRes = await axiosInstance.get("/employees/me");
        const myEmployeeId = empRes.data?.data?.id;
        
        if (!myEmployeeId) {
          setLoading(false);
          return;
        }
        setEmployeeId(myEmployeeId);

        const managers = await fmsApi.getAll();
        const allMySteps: FmsStepWithManager[] = [];
        
        for (const mgr of managers) {
          const steps = await fmsApi.getSteps(mgr.id);
          const myStepsForMgr = steps
            .filter(s => s.doerEmployeeId === myEmployeeId)
            .map(s => ({ ...s, managerName: mgr.name }));
          allMySteps.push(...myStepsForMgr);
        }
        setFmsSteps(allMySteps);

      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  if (!employeeId) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>My FMS Tasks</h2>
        <p>Your user account is not linked to an Employee record.</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      <h1 className="user-dashboard-title">My FMS Tasks</h1>
      
      <section className="user-dashboard-section">
        {fmsSteps.length === 0 ? (
          <p>No FMS steps assigned to you.</p>
        ) : (
          <table className="user-dashboard-table">
            <thead>
              <tr>
                <th>Manager / SOP</th>
                <th>Step Name</th>
                <th>Timeline</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {fmsSteps.map(s => (
                <tr key={s.id}>
                  <td>{s.managerName}</td>
                  <td>{s.stepName}</td>
                  <td>{s.timelineHours} {s.timelineUnit}</td>
                  <td>{s.isSequential ? "Sequential" : "Parallel"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
