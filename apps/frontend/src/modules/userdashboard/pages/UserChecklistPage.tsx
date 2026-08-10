import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { standaloneChecklistApi, StandaloneChecklist } from "../../checklist/api/checklistApi";
import "./UserDashboardPage.css";

export function UserChecklistPage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [checklists, setChecklists] = useState<StandaloneChecklist[]>([]);
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

        const chkRes = await standaloneChecklistApi.getAll();
        const myFullName = empRes.data?.data?.fullName;
        const myChecklists = chkRes.filter(c => 
          (c.isVisible !== false) && (
            (c as any).assignTo == myEmployeeId || 
            ((c as any).assignee_name && myFullName && (c as any).assignee_name.toLowerCase() === myFullName.toLowerCase())
          )
        );
        setChecklists(myChecklists);

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
        <h2>My Checklists</h2>
        <p>Your user account is not linked to an Employee record.</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      <h1 className="user-dashboard-title">My Checklists</h1>
      
      <section className="user-dashboard-section">
        {checklists.length === 0 ? (
          <p>No checklists assigned to you.</p>
        ) : (
          <table className="user-dashboard-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Mode</th>
                <th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              {checklists.map(c => (
                <tr key={c.id}>
                  <td>{c.taskName}</td>
                  <td>{c.mode}</td>
                  <td>{c.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
