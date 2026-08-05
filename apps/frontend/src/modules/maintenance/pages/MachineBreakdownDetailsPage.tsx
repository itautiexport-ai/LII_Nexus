import React, { useEffect, useState } from "react";
import {
  maintenanceApi,
  BreakdownLogRecord,
  EquipmentRecord,
  MaintenanceDashboardStats
} from "../api/maintenanceApi";

export default function MachineBreakdownDetailsPage() {
  const [stats, setStats] = useState<MaintenanceDashboardStats | null>(null);
  const [breakdownLogs, setBreakdownLogs] = useState<BreakdownLogRecord[]>([]);
  const [machines, setMachines] = useState<EquipmentRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBDId, setEditingBDId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'resolve'>('create');

  const initialFormState = {
    equipment_id: "",
    equipment_name: "",
    breakdown_date: new Date().toISOString().split("T")[0],
    resolved_date: new Date().toISOString().split("T")[0],
    downtime_hours: 1,
    root_cause: "",
    corrective_action: "",
    logged_by: "",
    status: "Active" as BreakdownLogRecord['status']
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadBreakdownData();
  }, []);

  const loadBreakdownData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, bdData, eqData] = await Promise.all([
        maintenanceApi.getStats().catch(() => null),
        maintenanceApi.getBreakdownLogs().catch(() => []),
        maintenanceApi.getEquipment().catch(() => [])
      ]);
      setStats(statsData);
      setBreakdownLogs(bdData);
      setMachines(eqData);
    } catch (err: any) {
      setError(err.message || "Failed to load breakdown details");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (bd?: BreakdownLogRecord, mode: 'create' | 'edit' | 'resolve' = 'create') => {
    setFormMode(mode);
    if (bd) {
      setEditingBDId(bd.id);
      setFormData({
        equipment_id: bd.equipment_id || "",
        equipment_name: bd.equipment_name || "",
        breakdown_date: bd.breakdown_date ? bd.breakdown_date.slice(0, 10) : new Date().toISOString().split("T")[0],
        resolved_date: bd.resolved_date ? bd.resolved_date.slice(0, 10) : new Date().toISOString().split("T")[0],
        downtime_hours: bd.downtime_hours || 0,
        root_cause: bd.root_cause || "",
        corrective_action: bd.corrective_action || "",
        logged_by: bd.logged_by || "",
        status: mode === 'resolve' ? 'Resolved' : (bd.status || 'Active')
      });
    } else {
      setEditingBDId(null);
      const defaultEq = machines.length > 0 ? machines[0] : null;
      setFormData({
        ...initialFormState,
        equipment_id: defaultEq ? defaultEq.id : "",
        equipment_name: defaultEq ? defaultEq.name : ""
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBDId) {
        await maintenanceApi.updateBreakdownLog(editingBDId, formData);
      } else {
        await maintenanceApi.createBreakdownLog(formData);
      }
      setShowModal(false);
      loadBreakdownData();
    } catch (err: any) {
      alert(err.message || "Breakdown log operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this breakdown log?")) return;
    try {
      await maintenanceApi.deleteBreakdownLog(id);
      loadBreakdownData();
    } catch (err: any) {
      alert(err.message || "Failed to delete breakdown log");
    }
  };

  const filteredLogs = breakdownLogs.filter(bd => {
    if (statusFilter !== "All" && bd.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCode = (bd.breakdown_no || "").toLowerCase().includes(q);
      const matchEq = (bd.equipment_name || "").toLowerCase().includes(q);
      const matchRca = (bd.root_cause || "").toLowerCase().includes(q);
      const matchUser = (bd.logged_by || "").toLowerCase().includes(q);
      if (!matchCode && !matchEq && !matchRca && !matchUser) return false;
    }
    return true;
  });

  const activeBreakdowns = breakdownLogs.filter(b => b.status === 'Active');
  const resolvedBreakdowns = breakdownLogs.filter(b => b.status === 'Resolved');
  const totalDowntimeHours = breakdownLogs.reduce((sum, b) => sum + Number(b.downtime_hours || 0), 0);

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Machine Breakdown Details</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Monitor emergency machine breakdown outages, downtime hours, root cause analysis (RCA) & corrective actions
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(undefined, 'create')}
          style={{
            padding: "11px 22px",
            backgroundColor: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(220,38,38,0.2)"
          }}
        >
          + Log Machine Breakdown
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Active / Unresolved Breakdowns</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626", marginTop: "6px" }}>{activeBreakdowns.length}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Breakdowns Logged</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginTop: "6px" }}>{breakdownLogs.length}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Downtime Hours</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#d97706", marginTop: "6px" }}>{totalDowntimeHours} hrs</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Resolved Breakdowns</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#10b981", marginTop: "6px" }}>{resolvedBreakdowns.length}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", backgroundColor: "#ffffff", padding: "16px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <input
          type="text"
          placeholder="Search by Breakdown Code, Machine Name, RCA, Logged By..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "340px" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="All">All Breakdown Statuses</option>
          <option value="Active">Active (Unresolved)</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Main Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
              <th style={{ padding: "12px 16px" }}>BD Code</th>
              <th style={{ padding: "12px 16px" }}>Machine Name</th>
              <th style={{ padding: "12px 16px" }}>Breakdown Date</th>
              <th style={{ padding: "12px 16px" }}>Downtime (Hrs)</th>
              <th style={{ padding: "12px 16px" }}>Root Cause Analysis (RCA)</th>
              <th style={{ padding: "12px 16px" }}>Corrective Action</th>
              <th style={{ padding: "12px 16px" }}>Logged By</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading breakdown logs...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No machine breakdown incidents found</td></tr>
            ) : (
              filteredLogs.map((bd) => (
                <tr key={bd.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#dc2626" }}>{bd.breakdown_no}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1e293b" }}>{bd.equipment_name}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>
                    {bd.breakdown_date ? bd.breakdown_date.slice(0, 10) : "-"}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#d97706" }}>
                    {bd.downtime_hours} hrs
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px" }}>{bd.root_cause || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px" }}>{bd.corrective_action || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>{bd.logged_by || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700",
                      backgroundColor: bd.status === 'Resolved' ? '#dcfce7' : '#fef2f2',
                      color: bd.status === 'Resolved' ? '#166534' : '#dc2626'
                    }}>
                      {bd.status === 'Active' ? '🛑 Active (Unresolved)' : '🟢 Resolved'}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {bd.status === 'Active' && (
                      <button
                        onClick={() => handleOpenModal(bd, 'resolve')}
                        style={{ padding: "5px 12px", marginRight: "6px", backgroundColor: "#166534", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenModal(bd, 'edit')}
                      style={{ padding: "5px 10px", marginRight: "6px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bd.id)}
                      style={{ padding: "5px 10px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
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

      {/* Log / Update Breakdown Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "12px", width: "580px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#dc2626", textTransform: "uppercase" }}>
                  {formMode === 'resolve' ? "Resolve Breakdown Incident" : editingBDId ? "Edit Breakdown Details" : "New Breakdown Incident Log"}
                </span>
                <h2 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                  {formMode === 'resolve' ? `Resolve Incident for ${formData.equipment_name}` : editingBDId ? "Edit Breakdown Log" : "Log Machine Breakdown"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ padding: "4px 10px", border: "none", backgroundColor: "#f1f5f9", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Select Machine *</label>
                  <select
                    value={formData.equipment_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const m = machines.find(item => item.id === id);
                      setFormData({ ...formData, equipment_id: id, equipment_name: m ? m.name : formData.equipment_name });
                    }}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="">-- Select Machine --</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.equipment_code} - {m.name} ({m.location || 'Floor'})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Breakdown Occurred Date *</label>
                    <input
                      type="date"
                      value={formData.breakdown_date}
                      onChange={(e) => setFormData({ ...formData, breakdown_date: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Downtime (Hours) *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.downtime_hours}
                      onChange={(e) => setFormData({ ...formData, downtime_hours: Number(e.target.value) })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Logged By / Technician</label>
                    <input
                      type="text"
                      value={formData.logged_by}
                      onChange={(e) => setFormData({ ...formData, logged_by: e.target.value })}
                      placeholder="e.g. Suresh Maintenance Engineer"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Active">Active (Unresolved Breakdown)</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Root Cause Analysis (RCA)</label>
                  <textarea
                    value={formData.root_cause}
                    onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                    rows={2}
                    placeholder="e.g. Hydraulic pump pressure loss due to seal leakage"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Corrective Action Taken</label>
                  <textarea
                    value={formData.corrective_action}
                    onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                    rows={2}
                    placeholder="e.g. Replaced hydraulic seal, refilled oil and pressure tested at 150 bar"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer", fontWeight: "600" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 22px",
                    borderRadius: "6px",
                    backgroundColor: formData.status === 'Resolved' ? "#166534" : "#dc2626",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "700"
                  }}
                >
                  {formData.status === 'Resolved' ? "✓ Mark Breakdown Resolved" : "Save Breakdown Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
