import React, { useEffect, useState, useRef } from "react";
import { standaloneChecklistApi, StandaloneChecklist } from "../api/checklistApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import "./Checklist.css";

export function ListChecklistPage() {
  const [checklists, setChecklists] = useState<StandaloneChecklist[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const user = useAuthStore(state => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (isAdmin) {
          await standaloneChecklistApi.delete(id);
        } else {
          await standaloneChecklistApi.complete(id);
        }
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

  const handleDownloadTemplate = async () => {
    try {
      await standaloneChecklistApi.downloadBulkTemplate();
    } catch (err) {
      console.error("Failed to download template", err);
      alert("Failed to download template");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await standaloneChecklistApi.bulkUpload(file);
      alert(`Successfully uploaded ${res.data.successCount} checklists. Errors: ${res.data.errorCount}`);
      fetchChecklists();
    } catch (err: any) {
      console.error("Failed to upload bulk checklists", err);
      alert(err?.response?.data?.error || "Failed to upload bulk checklists");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="chk-container">
      <div className="chk-card">
        <div className="chk-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="chk-title" style={{ margin: 0 }}>LIST CHECKLISTS</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {user && user.roles.includes("System Admin") && (
              <>
                <button 
                  onClick={handleDownloadTemplate}
                  style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                >
                  Download Template
                </button>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  style={{ display: "none" }} 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ background: "#10b981", color: "white", border: "none", padding: "8px 16px", borderRadius: 4, cursor: uploading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14, opacity: uploading ? 0.7 : 1 }}
                >
                  {uploading ? "Uploading..." : "Bulk Upload"}
                </button>
              </>
            )}
            {user && user.roles.includes("System Admin") && selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
              >
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
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
                    <th className="chk-th">Planned Date</th>
                    <th className="chk-th">Priority</th>
                    <th className="chk-th">Mode</th>
                    <th className="chk-th">Frequency</th>
                    <th className="chk-th">Schedule Rule</th>
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
                      <td className="chk-td">{(c as any).whenRule || (c as any).when_rule || "-"}</td>
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
