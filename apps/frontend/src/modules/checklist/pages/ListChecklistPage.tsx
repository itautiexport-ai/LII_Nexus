import React, { useEffect, useState } from "react";
import { standaloneChecklistApi, StandaloneChecklist } from "../api/checklistApi";
import "./Checklist.css";

export function ListChecklistPage() {
  const [checklists, setChecklists] = useState<StandaloneChecklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = () => {
    standaloneChecklistApi.getAll().then(data => {
      setChecklists(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this checklist?")) {
      try {
        await standaloneChecklistApi.delete(id);
        fetchChecklists(); // Refresh
      } catch (err) {
        console.error("Failed to delete", err);
        alert("Failed to delete checklist");
      }
    }
  };

  return (
    <div className="chk-container">
      <div className="chk-card">
        <div className="chk-card-header">
          <h2 className="chk-title">LIST CHECKLISTS</h2>
        </div>
        <div className="chk-card-content" style={{ padding: 0 }}>
          {loading ? (
            <div className="chk-empty">Loading...</div>
          ) : checklists.length === 0 ? (
            <div className="chk-empty">No checklists found.</div>
          ) : (
            <div className="chk-table-container">
              <table className="chk-table">
                <thead>
                  <tr>
                    <th className="chk-th">Task Name</th>
                    <th className="chk-th">Assigned To</th>
                    <th className="chk-th">Planned Date</th>
                    <th className="chk-th">Priority</th>
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
                        {(c as any).assignee_name || "Unknown"}
                      </td>
                      <td className="chk-td">{new Date((c as any).planned_date || c.plannedDate).toLocaleString()}</td>
                      <td className="chk-td">
                        <span className={`chk-pill ${
                          c.priority === 'High' ? 'chk-pill-high' :
                          c.priority === 'Medium' ? 'chk-pill-medium' :
                          'chk-pill-low'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="chk-td">{c.mode}</td>
                      <td className="chk-td">{c.frequency}</td>
                      <td className="chk-td">
                        <button 
                          onClick={() => handleDelete(c.id)}
                          style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                        >
                          Delete
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
