import React, { useEffect, useState } from "react";
import { standaloneChecklistApi, StandaloneChecklist } from "../api/checklistApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import "./Checklist.css";

export function ListChecklistPage() {
  const [checklists, setChecklists] = useState<StandaloneChecklist[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = () => {
    standaloneChecklistApi.getAll().then(data => {
      if (user && !user.roles.includes("System Admin")) {
        const filtered = data.filter(c => 
          (c as any).assignTo === user.id || 
          c.assignee_name === user.fullName ||
          c.assigner_name === user.fullName ||
          (c as any).assignBy === user.id ||
          c.assignedBy === user.id
        );
        setChecklists(filtered);
      } else {
        setChecklists(data);
      }
      setSelectedIds([]);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleAction = async (id: string) => {
    const isAdmin = user && user.roles.includes("System Admin");
    const actionName = isAdmin ? "delete" : "complete";
    if (confirm(`Are you sure you want to ${actionName} this checklist?`)) {
      try {
        await standaloneChecklistApi.delete(id);
        fetchChecklists(); // Refresh
      } catch (err) {
        console.error(`Failed to ${actionName}`, err);
        alert(`Failed to ${actionName} checklist`);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} checklists?`)) {
      try {
        await standaloneChecklistApi.bulkDelete(selectedIds);
        fetchChecklists();
      } catch (err) {
        console.error("Failed to bulk delete", err);
        alert("Failed to delete selected checklists");
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === checklists.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(checklists.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="chk-container">
      <div className="chk-card">
        <div className="chk-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="chk-title" style={{ margin: 0 }}>LIST CHECKLISTS</h2>
          {user && user.roles.includes("System Admin") && selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}
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
                    {user && user.roles.includes("System Admin") && (
                      <th className="chk-th" style={{ width: '40px' }}>
                        <input 
                          type="checkbox" 
                          checked={checklists.length > 0 && selectedIds.length === checklists.length} 
                          onChange={toggleSelectAll} 
                          style={{ cursor: "pointer" }}
                        />
                      </th>
                    )}
                    <th className="chk-th">Task Name</th>
                    <th className="chk-th">Assigned To</th>
                    <th className="chk-th">Mode</th>
                    <th className="chk-th">Frequency</th>
                    <th className="chk-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {checklists.map(c => (
                    <tr key={c.id} className="chk-tr">
                      {user && user.roles.includes("System Admin") && (
                        <td className="chk-td">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(c.id)} 
                            onChange={() => toggleSelect(c.id)}
                            style={{ cursor: "pointer" }}
                          />
                        </td>
                      )}
                      <td className="chk-td chk-td-strong">{(c as any).task_name || c.taskName}</td>
                      <td className="chk-td">
                        {(c as any).assignee_name || "Unknown"}
                      </td>
                      <td className="chk-td">{c.mode}</td>
                      <td className="chk-td">{c.frequency}</td>
                      <td className="chk-td">
                        {user && user.roles.includes("System Admin") ? (
                          <button 
                            onClick={() => handleAction(c.id)}
                            style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                          >
                            Delete
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAction(c.id)}
                            style={{ background: "#10b981", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                          >
                            Complete
                          </button>
                        )}
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
