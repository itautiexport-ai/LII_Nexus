import React, { useEffect, useState } from "react";
import { maintenanceApi, PreventiveScheduleRecord, EquipmentRecord } from "../api/maintenanceApi";

export default function PreventiveMaintenancePage() {
  const [schedules, setSchedules] = useState<PreventiveScheduleRecord[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    equipment_id: "",
    equipment_name: "",
    task_title: "",
    frequency: "Monthly" as PreventiveScheduleRecord['frequency'],
    next_due_date: new Date().toISOString().split("T")[0],
    assigned_team: "",
    status: "Active" as PreventiveScheduleRecord['status'],
    checklist_summary: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pmData, eqData] = await Promise.all([
        maintenanceApi.getPreventiveSchedules(),
        maintenanceApi.getEquipment()
      ]);
      setSchedules(pmData);
      setEquipmentList(eqData);
    } catch (err: any) {
      setError(err.message || "Failed to load preventive schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sched?: PreventiveScheduleRecord) => {
    if (sched) {
      setEditingId(sched.id);
      setFormData({
        equipment_id: sched.equipment_id || "",
        equipment_name: sched.equipment_name || "",
        task_title: sched.task_title || "",
        frequency: sched.frequency || "Monthly",
        next_due_date: sched.next_due_date ? sched.next_due_date.slice(0, 10) : "",
        assigned_team: sched.assigned_team || "",
        status: sched.status || "Active",
        checklist_summary: sched.checklist_summary || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        equipment_id: equipmentList.length > 0 ? equipmentList[0].id : "",
        equipment_name: equipmentList.length > 0 ? equipmentList[0].name : "",
        task_title: "",
        frequency: "Monthly",
        next_due_date: new Date().toISOString().split("T")[0],
        assigned_team: "",
        status: "Active",
        checklist_summary: ""
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
        await maintenanceApi.updatePreventiveSchedule(editingId, formData);
      } else {
        await maintenanceApi.createPreventiveSchedule(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await maintenanceApi.deletePreventiveSchedule(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete schedule");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Preventive Maintenance Planner</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>Schedule recurring servicing tasks to prevent unexpected equipment downtime</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{
            padding: "10px 18px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          + Add PM Schedule
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Grid of PM Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {loading ? (
          <div style={{ color: "#64748b" }}>Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div style={{ color: "#94a3b8" }}>No preventive maintenance schedules set up</div>
        ) : (
          schedules.map((sched) => {
            const isOverdue = new Date(sched.next_due_date) < new Date() && sched.status !== 'Inactive';
            return (
              <div
                key={sched.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  borderTop: `4px solid ${isOverdue ? '#ef4444' : '#3b82f6'}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb" }}>{sched.schedule_no}</span>
                    <span style={{
                      padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                      backgroundColor: isOverdue ? '#fef2f2' : sched.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                      color: isOverdue ? '#dc2626' : sched.status === 'Active' ? '#166534' : '#64748b'
                    }}>
                      {isOverdue ? 'Overdue' : sched.status}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>{sched.task_title}</h3>
                  <div style={{ fontSize: "13px", color: "#475569", fontWeight: "500" }}>Machine: {sched.equipment_name}</div>
                  
                  <div style={{ margin: "12px 0", padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "12px" }}>
                    <div><strong>Frequency:</strong> {sched.frequency}</div>
                    <div><strong>Next Due:</strong> <span style={{ color: isOverdue ? '#dc2626' : '#1e293b', fontWeight: isOverdue ? '700' : '500' }}>{sched.next_due_date ? sched.next_due_date.slice(0, 10) : '-'}</span></div>
                    <div><strong>Assigned Team:</strong> {sched.assigned_team || 'Unassigned'}</div>
                  </div>

                  {sched.checklist_summary && (
                    <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginBottom: "12px" }}>
                      Checklist: {sched.checklist_summary}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={() => handleOpenModal(sched)}
                    style={{ padding: "6px 12px", backgroundColor: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sched.id)}
                    style={{ padding: "6px 12px", backgroundColor: "#fef2f2", color: "#991b1b", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", width: "500px", maxWidth: "90%" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "700" }}>
              {editingId ? "Edit PM Schedule" : "New PM Schedule"}
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

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Task Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly Motor Oil & Belt Inspection"
                    value={formData.task_title}
                    onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e: any) => setFormData({ ...formData, frequency: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Next Due Date</label>
                    <input
                      type="date"
                      value={formData.next_due_date}
                      onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Assigned Team</label>
                    <input
                      type="text"
                      placeholder="e.g. Electrical Team A"
                      value={formData.assigned_team}
                      onChange={(e) => setFormData({ ...formData, assigned_team: e.target.value })}
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
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Checklist Summary</label>
                  <textarea
                    placeholder="Check oil level, grease bearings, check electrical wiring..."
                    value={formData.checklist_summary}
                    onChange={(e) => setFormData({ ...formData, checklist_summary: e.target.value })}
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
                  style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: "600" }}
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
