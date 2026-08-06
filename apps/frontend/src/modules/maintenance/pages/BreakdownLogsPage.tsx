import React, { useEffect, useState } from "react";
import { maintenanceApi, BreakdownLogRecord, EquipmentRecord } from "../api/maintenanceApi";

export default function BreakdownLogsPage() {
  const [breakdownLogs, setBreakdownLogs] = useState<BreakdownLogRecord[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    equipment_id: "",
    equipment_name: "",
    downtime_hours: 0,
    root_cause: "",
    corrective_action: "",
    logged_by: "",
    status: "Active" as BreakdownLogRecord['status']
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bdData, eqData] = await Promise.all([
        maintenanceApi.getBreakdownLogs(),
        maintenanceApi.getEquipment()
      ]);
      setBreakdownLogs(bdData);
      setEquipmentList(eqData);
    } catch (err: any) {
      setError(err.message || "Failed to load breakdown logs");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (log?: BreakdownLogRecord) => {
    if (log) {
      setEditingId(log.id);
      setFormData({
        equipment_id: log.equipment_id || "",
        equipment_name: log.equipment_name || "",
        downtime_hours: log.downtime_hours || 0,
        root_cause: log.root_cause || "",
        corrective_action: log.corrective_action || "",
        logged_by: log.logged_by || "",
        status: log.status || "Active"
      });
    } else {
      setEditingId(null);
      setFormData({
        equipment_id: equipmentList.length > 0 ? equipmentList[0].id : "",
        equipment_name: equipmentList.length > 0 ? equipmentList[0].name : "",
        downtime_hours: 0,
        root_cause: "",
        corrective_action: "",
        logged_by: "",
        status: "Active"
      });
    }
    setShowModal(true);
  };

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eqId = e.target.value;
    const found = equipmentList.find(eq => eq.id === eqId);
    setFormData(prev => ({
      ...prev,
      equipment_id: eqId,
      equipment_name: found ? found.name : prev.equipment_name
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await maintenanceApi.updateBreakdownLog(editingId, formData);
      } else {
        await maintenanceApi.createBreakdownLog(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this breakdown log?")) return;
    try {
      await maintenanceApi.deleteBreakdownLog(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete breakdown log");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Breakdown & Downtime Logs</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>Record emergency machinery outages, downtime duration, RCA & corrective actions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{
            padding: "10px 18px",
            backgroundColor: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          + Log New Breakdown
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
              <th style={{ padding: "12px 16px" }}>BD Code</th>
              <th style={{ padding: "12px 16px" }}>Equipment</th>
              <th style={{ padding: "12px 16px" }}>Downtime (Hrs)</th>
              <th style={{ padding: "12px 16px" }}>Root Cause</th>
              <th style={{ padding: "12px 16px" }}>Logged By</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading breakdown logs...</td></tr>
            ) : breakdownLogs.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No breakdown events logged</td></tr>
            ) : (
              breakdownLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#dc2626" }}>{log.breakdown_no}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "500" }}>{log.equipment_name}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "700" }}>{log.downtime_hours} hrs</td>
                  <td style={{ padding: "12px 16px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.root_cause || "-"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{log.logged_by || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
                      backgroundColor: log.status === 'Resolved' ? '#dcfce7' : '#fef2f2',
                      color: log.status === 'Resolved' ? '#166534' : '#dc2626'
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleOpenModal(log)}
                      style={{ padding: "6px 12px", marginRight: "8px", backgroundColor: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
                    >
                      Edit / Resolve
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      style={{ padding: "6px 12px", backgroundColor: "#fef2f2", color: "#991b1b", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "700", color: "#dc2626" }}>
              {editingId ? "Edit Breakdown Log" : "Log Machine Breakdown"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Equipment</label>
                  {equipmentList.length > 0 ? (
                    <select
                      value={formData.equipment_id}
                      onChange={handleEquipmentChange}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      {equipmentList.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.equipment_code} - {eq.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Equipment Name"
                      value={formData.equipment_name}
                      onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Downtime (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.downtime_hours}
                      onChange={(e) => setFormData({ ...formData, downtime_hours: Number(e.target.value) })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Active">Active (Unresolved)</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Root Cause Analysis (RCA)</label>
                  <textarea
                    placeholder="e.g. Bearing seizure due to lack of lubrication in high-temp environment..."
                    value={formData.root_cause}
                    onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                    rows={3}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Corrective Action Taken</label>
                  <textarea
                    placeholder="e.g. Replaced SKF 6205 bearing, refilled synthetic grease, tested motor speed..."
                    value={formData.corrective_action}
                    onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                    rows={3}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: "600" }}
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
