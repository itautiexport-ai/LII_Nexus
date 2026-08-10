import React, { useEffect, useState } from "react";
import { standaloneChecklistApi, StandaloneChecklist } from "../../../checklist/api/checklistApi";
import { useAuthStore } from "../../../auth/hooks/useAuthStore";
import "../../../checklist/pages/Checklist.css";

export default function MyChecklistPage() {
  const [checklists, setChecklists] = useState<StandaloneChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchChecklists();
  }, [user]);

  const fetchChecklists = () => {
    if (!user) return;
    standaloneChecklistApi.getAll().then(data => {
        const filtered = data.filter(c => 
          (c.isVisible !== false) && (
            (c as any).assignTo == user.id || 
            (c.assignee_name && c.assignee_name.toLowerCase() === user.fullName.toLowerCase()) ||
            (c.assigner_name && c.assigner_name.toLowerCase() === user.fullName.toLowerCase()) ||
            (c as any).assignBy == user.id ||
            c.assignedBy == user.id
          )
        );
      setChecklists(filtered);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleAction = async (id: string) => {
    if (confirm(`Are you sure you want to complete this checklist?`)) {
      try {
        await standaloneChecklistApi.delete(id);
        fetchChecklists(); // Refresh
      } catch (err) {
        console.error(`Failed to complete`, err);
        alert(`Failed to complete checklist`);
      }
    }
  };

  return (
    <div className="chk-container">
      <div className="chk-card">
        <div className="chk-card-header">
          <h2 className="chk-title">MY CHECKLISTS</h2>
        </div>
        <div className="chk-card-content" style={{ padding: 0 }}>
          {loading ? (
            <div className="chk-empty">Loading...</div>
          ) : checklists.length === 0 ? (
            <div className="chk-empty">No checklists assigned to you yet.</div>
          ) : (
            <div className="chk-table-container">
              <table className="chk-table">
                <thead>
                  <tr>
                    <th className="chk-th">Task Name</th>
                    <th className="chk-th">Assigned By</th>
                    <th className="chk-th">Mode</th>
                    <th className="chk-th">Frequency</th>
                    <th className="chk-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {checklists.map(c => (
                    <tr key={c.id} className="chk-tr">
                      <td className="chk-td chk-td-strong">{(c as any).task_name || c.taskName}</td>
                      <td className="chk-td">
                        {c.assigner_name || "Unknown"}
                      </td>
                      <td className="chk-td">{c.mode}</td>
                      <td className="chk-td">{c.frequency}</td>
                      <td className="chk-td">
                        <button 
                          onClick={() => handleAction(c.id)}
                          style={{ background: "#10b981", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
