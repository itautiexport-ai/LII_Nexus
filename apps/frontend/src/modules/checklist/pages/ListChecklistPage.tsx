import React, { useEffect, useState } from "react";
import { standaloneChecklistApi, StandaloneChecklist } from "../api/checklistApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { useCanDelete, useIsAdminOrManagement } from "../../auth/hooks/usePermissions";
import { useTableFreeze } from "../../../shared/hooks/useTableFreeze";
import { TableFreezeButton } from "../../../shared/components/TableFreezeButton";
import { TableFreezeModal } from "../../../shared/components/TableFreezeModal";
import "./Checklist.css";

const CHECKLIST_COLUMNS = [
  { key: "taskName", label: "Task Name", width: 220 },
  { key: "assignee", label: "Assigned To", width: 140 },
  { key: "plannedDate", label: "Planned Date", width: 160 },
  { key: "priority", label: "Priority", width: 100 },
  { key: "mode", label: "Mode", width: 100 },
  { key: "frequency", label: "Frequency", width: 120 },
  { key: "actions", label: "Actions", width: 160 },
];

export function ListChecklistPage() {
  const [checklists, setChecklists] = useState<StandaloneChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const canDelete = useCanDelete();
  const canEditOrViewAll = useIsAdminOrManagement();

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<StandaloneChecklist | null>(null);
  const [editForm, setEditForm] = useState({
    taskName: "",
    priority: "Medium" as "Low" | "Medium" | "High",
    mode: "Online",
    frequency: "Daily",
    plannedDate: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const {
    settings: freezeSettings,
    isModalOpen: isFreezeModalOpen,
    effectiveFreezeCount,
    openModal: openFreezeModal,
    closeModal: closeFreezeModal,
    saveSettings: saveFreezeSettings,
    resetSettings: resetFreezeSettings,
    isSaving: isFreezeSaving,
    getContainerStyle,
    getStickyHeaderStyle,
    getStickyCellStyle,
  } = useTableFreeze({
    tableKey: "list_checklists",
    availableColumns: CHECKLIST_COLUMNS,
    defaultSettings: {
      freezeColumns: 0,
      freezeHeader: true,
      tableMaxHeight: "72vh",
    },
  });

  useEffect(() => {
    fetchChecklists();
  }, [canEditOrViewAll]);

  const fetchChecklists = () => {
    standaloneChecklistApi.getAll().then(data => {
      if (user && !canEditOrViewAll) {
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
        fetchChecklists();
      } catch (err) {
        console.error("Failed to delete", err);
        alert("Failed to delete checklist");
      }
    }
  };

  const handleOpenEdit = (item: StandaloneChecklist) => {
    setEditingItem(item);
    const rawDate = (item as any).planned_date || item.plannedDate;
    const formattedDate = rawDate ? new Date(rawDate).toISOString().slice(0, 16) : "";
    setEditForm({
      taskName: (item as any).task_name || item.taskName,
      priority: item.priority || "Medium",
      mode: item.mode || "Online",
      frequency: item.frequency || "Daily",
      plannedDate: formattedDate,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setIsSavingEdit(true);
      await standaloneChecklistApi.update(editingItem.id, editForm);
      setEditingItem(null);
      fetchChecklists();
    } catch (err) {
      console.error("Failed to update checklist", err);
      alert("Failed to update checklist");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="chk-container">
      <div className="chk-card">
        <div className="chk-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="chk-title" style={{ margin: 0 }}>LIST CHECKLISTS</h2>
          <TableFreezeButton
            onClick={openFreezeModal}
            effectiveFreezeCount={effectiveFreezeCount}
            isHeaderFrozen={freezeSettings.freezeHeader}
          />
        </div>
        <div className="chk-card-content" style={{ padding: 0 }}>
          {loading ? (
            <div className="chk-empty">Loading...</div>
          ) : checklists.length === 0 ? (
            <div className="chk-empty">No checklists found.</div>
          ) : (
            <div style={getContainerStyle({ border: "1px solid #e2e8f0" })}>
              <table className="chk-table" style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%" }}>
                <thead>
                  <tr>
                    <th style={getStickyHeaderStyle(0, { customStyle: { background: "#f8fafc" } })} className="chk-th">Task Name</th>
                    <th style={getStickyHeaderStyle(1, { customStyle: { background: "#f8fafc" } })} className="chk-th">Assigned To</th>
                    <th style={getStickyHeaderStyle(2, { customStyle: { background: "#f8fafc" } })} className="chk-th">Planned Date</th>
                    <th style={getStickyHeaderStyle(3, { customStyle: { background: "#f8fafc" } })} className="chk-th">Priority</th>
                    <th style={getStickyHeaderStyle(4, { customStyle: { background: "#f8fafc" } })} className="chk-th">Mode</th>
                    <th style={getStickyHeaderStyle(5, { customStyle: { background: "#f8fafc" } })} className="chk-th">Frequency</th>
                    <th style={getStickyHeaderStyle(6, { customStyle: { background: "#f8fafc" } })} className="chk-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {checklists.map(c => (
                    <tr key={c.id} className="chk-tr">
                      <td style={getStickyCellStyle(0, { customStyle: { backgroundColor: "#ffffff" } })} className="chk-td chk-td-strong">{(c as any).task_name || c.taskName}</td>
                      <td style={getStickyCellStyle(1, { customStyle: { backgroundColor: "#ffffff" } })} className="chk-td">
                        {(c as any).assignee_name || "Unknown"}
                      </td>
                      <td style={getStickyCellStyle(2, { customStyle: { backgroundColor: "#ffffff" } })} className="chk-td">{new Date((c as any).planned_date || c.plannedDate).toLocaleString()}</td>
                      <td style={getStickyCellStyle(3, { customStyle: { backgroundColor: "#ffffff" } })} className="chk-td">
                        <span className={`chk-pill ${
                          c.priority === 'High' ? 'chk-pill-high' :
                          c.priority === 'Medium' ? 'chk-pill-medium' :
                          'chk-pill-low'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td style={getStickyCellStyle(4, { customStyle: { backgroundColor: "#ffffff" } })} className="chk-td">{c.mode}</td>
                      <td style={getStickyCellStyle(5, { customStyle: { backgroundColor: "#ffffff" } })} className="chk-td">{c.frequency}</td>
                      <td style={getStickyCellStyle(6, { customStyle: { backgroundColor: "#ffffff" } })} className="chk-td">
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {canEditOrViewAll && (
                            <button
                              onClick={() => handleOpenEdit(c)}
                              style={{ background: "#2563eb", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              onClick={() => handleDelete(c.id)}
                              style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                            >
                              Delete
                            </button>
                          )}
                          {!canEditOrViewAll && !canDelete && (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Checklist Modal */}
      {editingItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", width: "450px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Edit Checklist Task</h3>
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold", fontSize: 13 }}>Task Name</label>
                <input
                  required
                  type="text"
                  value={editForm.taskName}
                  onChange={e => setEditForm({ ...editForm, taskName: e.target.value })}
                  style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold", fontSize: 13 }}>Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={e => setEditForm({ ...editForm, priority: e.target.value as any })}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4 }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold", fontSize: 13 }}>Frequency</label>
                  <select
                    value={editForm.frequency}
                    onChange={e => setEditForm({ ...editForm, frequency: e.target.value })}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4 }}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: "bold", fontSize: 13 }}>Planned Date & Time</label>
                <input
                  type="datetime-local"
                  value={editForm.plannedDate}
                  onChange={e => setEditForm({ ...editForm, plannedDate: e.target.value })}
                  style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{ padding: "6px 12px", background: "#f1f5f9", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{ padding: "6px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TableFreezeModal
        isOpen={isFreezeModalOpen}
        onClose={closeFreezeModal}
        settings={freezeSettings}
        availableColumns={CHECKLIST_COLUMNS}
        onSave={saveFreezeSettings}
        onReset={resetFreezeSettings}
        isSaving={isFreezeSaving}
      />
    </div>
  );
}
