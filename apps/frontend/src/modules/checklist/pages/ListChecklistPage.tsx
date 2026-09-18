import React, { useEffect, useState } from "react";
import { standaloneChecklistApi, StandaloneChecklist } from "../api/checklistApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { useTableFreeze } from "../../../shared/hooks/useTableFreeze";
import { TableFreezeButton } from "../../../shared/components/TableFreezeButton";
import { TableFreezeModal } from "../../../shared/components/TableFreezeModal";
import "./Checklist.css";

const CHECKLIST_COLUMNS = [
  { key: "taskName", label: "Task Name", width: 280 },
  { key: "assignee", label: "Assigned To", width: 160 },
  { key: "plannedDate", label: "Planned Date", width: 160 },
  { key: "priority", label: "Priority", width: 100 },
  { key: "mode", label: "Mode", width: 100 },
  { key: "frequency", label: "Frequency", width: 120 },
  { key: "actions", label: "Actions", width: 100 },
];

export function ListChecklistPage() {
  const [checklists, setChecklists] = useState<StandaloneChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

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
                      <td
                        style={getStickyCellStyle(0, {
                          customStyle: {
                            backgroundColor: "#ffffff",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            lineHeight: "1.45",
                          },
                        })}
                        className="chk-td chk-td-strong"
                      >
                        {(c as any).task_name || c.taskName}
                      </td>
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
                        {user && (
                          user.roles?.includes("System Admin") ||
                          user.roles?.includes("Super Admin") ||
                          user.roles?.includes("Admin") ||
                          ((user as any).designationTitle && (
                            (user as any).designationTitle.toLowerCase() === "admin" ||
                            (user as any).designationTitle.toLowerCase() === "admin executive" ||
                            (user as any).designationTitle.toLowerCase() === "director" ||
                            (user as any).designationTitle.toLowerCase() === "executive director"
                          ))
                        ) ? (
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                          >
                            Delete
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
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
