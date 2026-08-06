import React, { useEffect, useState } from "react";
import {
  maintenanceApi,
  WorkOrderRecord,
  EquipmentRecord,
  MaintenanceDashboardStats
} from "../api/maintenanceApi";

export default function MachineMaintenanceDetailsPage() {
  const [stats, setStats] = useState<MaintenanceDashboardStats | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrderRecord[]>([]);
  const [machines, setMachines] = useState<EquipmentRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingWOId, setEditingWOId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'complete'>('create');

  const initialFormState = {
    equipment_id: "",
    equipment_name: "",
    title: "",
    description: "",
    type: "Preventive" as WorkOrderRecord['type'],
    priority: "Medium" as WorkOrderRecord['priority'],
    status: "Open" as WorkOrderRecord['status'],
    assigned_to: "",
    scheduled_date: new Date().toISOString().split("T")[0],
    completed_date: new Date().toISOString().split("T")[0],
    downtime_minutes: 0,
    cost: 0,
    resolution_notes: "",
    maintenance_frequency: "Monthly",
    maintenance_interval_days: 30
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, woData, eqData] = await Promise.all([
        maintenanceApi.getStats().catch(() => null),
        maintenanceApi.getWorkOrders().catch(() => []),
        maintenanceApi.getEquipment().catch(() => [])
      ]);
      setStats(statsData);
      setWorkOrders(woData);
      setMachines(eqData);
    } catch (err: any) {
      setError(err.message || "Failed to load machine maintenance details");
    } finally {
      setLoading(false);
    }
  };

  const calculateNextDueDate = (compDateStr: string, freq: string, customDays: number): string => {
    if (!compDateStr) return "-";
    let days = customDays || 30;
    switch (freq) {
      case 'Daily': days = 1; break;
      case 'Weekly': days = 7; break;
      case 'Monthly': days = 30; break;
      case 'Quarterly': days = 90; break;
      case 'Semi-Annual': days = 180; break;
      case 'Annual': days = 365; break;
    }
    const comp = new Date(compDateStr);
    comp.setDate(comp.getDate() + days);
    return comp.toISOString().split("T")[0];
  };

  const getIntervalDaysForFreq = (freq: string): number => {
    switch (freq) {
      case 'Daily': return 1;
      case 'Weekly': return 7;
      case 'Monthly': return 30;
      case 'Quarterly': return 90;
      case 'Semi-Annual': return 180;
      case 'Annual': return 365;
      default: return 30;
    }
  };

  const handleOpenModal = (wo?: WorkOrderRecord, mode: 'create' | 'edit' | 'complete' = 'create') => {
    setFormMode(mode);
    if (wo) {
      setEditingWOId(wo.id);
      const freq = wo.maintenance_frequency || "Monthly";
      setFormData({
        equipment_id: wo.equipment_id || "",
        equipment_name: wo.equipment_name || "",
        title: wo.title || "",
        description: wo.description || "",
        type: wo.type || "Preventive",
        priority: wo.priority || "Medium",
        status: mode === 'complete' ? "Completed" : (wo.status || "Open"),
        assigned_to: wo.assigned_to || "",
        scheduled_date: wo.scheduled_date ? wo.scheduled_date.slice(0, 10) : new Date().toISOString().split("T")[0],
        completed_date: wo.completed_date ? wo.completed_date.slice(0, 10) : new Date().toISOString().split("T")[0],
        downtime_minutes: wo.downtime_minutes || 0,
        cost: wo.cost || 0,
        resolution_notes: wo.resolution_notes || "",
        maintenance_frequency: freq,
        maintenance_interval_days: wo.maintenance_interval_days || getIntervalDaysForFreq(freq)
      });
    } else {
      setEditingWOId(null);
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
      if (editingWOId) {
        await maintenanceApi.updateWorkOrder(editingWOId, formData);
      } else {
        await maintenanceApi.createWorkOrder(formData);
      }
      setShowModal(false);
      loadMaintenanceData();
    } catch (err: any) {
      alert(err.message || "Work order operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this maintenance work order?")) return;
    try {
      await maintenanceApi.deleteWorkOrder(id);
      loadMaintenanceData();
    } catch (err: any) {
      alert(err.message || "Failed to delete work order");
    }
  };

  // Filter Work Orders
  const filteredWorkOrders = workOrders.filter(wo => {
    if (statusFilter !== "All" && wo.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNo = (wo.work_order_no || "").toLowerCase().includes(q);
      const matchTitle = (wo.title || "").toLowerCase().includes(q);
      const matchEq = (wo.equipment_name || "").toLowerCase().includes(q);
      const matchTech = (wo.assigned_to || "").toLowerCase().includes(q);
      if (!matchNo && !matchTitle && !matchEq && !matchTech) return false;
    }
    return true;
  });

  const activeWorkOrders = filteredWorkOrders.filter(wo => wo.status !== 'Completed' && wo.status !== 'Cancelled');
  const completedWorkOrders = filteredWorkOrders.filter(wo => wo.status === 'Completed');

  const getDueStatus = (nextDueStr?: string | null) => {
    if (!nextDueStr) return { label: "Scheduled", color: "#64748b", bg: "#f1f5f9" };
    const due = new Date(nextDueStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { label: `Overdue by ${Math.abs(diffDays)} days`, color: "#dc2626", bg: "#fef2f2" };
    } else if (diffDays <= 7) {
      return { label: `Due in ${diffDays} days`, color: "#d97706", bg: "#fffbe6" };
    } else {
      return { label: `Due in ${diffDays} days`, color: "#166534", bg: "#dcfce7" };
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Machine Maintenance Work Orders</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Track active maintenance work orders, submit completed maintenance logs & monitor auto-calculated next due schedules
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(undefined, 'create')}
          style={{
            padding: "11px 22px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
          }}
        >
          + Create Work Order
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Work Orders</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginTop: "6px" }}>{workOrders.length}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Active Work Orders</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#d97706", marginTop: "6px" }}>
            {workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled').length}
          </div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Completed Maintenances</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#10b981", marginTop: "6px" }}>
            {workOrders.filter(w => w.status === 'Completed').length}
          </div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Maintenance Cost</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#7c3aed", marginTop: "6px" }}>
            ₹{workOrders.reduce((sum, w) => sum + Number(w.cost || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", backgroundColor: "#ffffff", padding: "16px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <input
          type="text"
          placeholder="Search by WO #, Machine Name, Title, Technician..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "320px" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* SECTION 1: Active Maintenance Work Orders */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            🛠️ Active Maintenance Work Orders ({activeWorkOrders.length})
          </h2>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Pending servicing tasks requiring action</span>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                <th style={{ padding: "12px 16px" }}>WO #</th>
                <th style={{ padding: "12px 16px" }}>Machine Name</th>
                <th style={{ padding: "12px 16px" }}>Maintenance Title</th>
                <th style={{ padding: "12px 16px" }}>Type</th>
                <th style={{ padding: "12px 16px" }}>Cycle</th>
                <th style={{ padding: "12px 16px" }}>Priority</th>
                <th style={{ padding: "12px 16px" }}>Technician</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading work orders...</td></tr>
              ) : activeWorkOrders.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No active maintenance work orders pending</td></tr>
              ) : (
                activeWorkOrders.map((wo) => (
                  <tr key={wo.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "#2563eb" }}>{wo.work_order_no}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1e293b" }}>{wo.equipment_name}</td>
                    <td style={{ padding: "12px 16px" }}>{wo.title}</td>
                    <td style={{ padding: "12px 16px" }}>{wo.type}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>{wo.maintenance_frequency || "Monthly"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                        backgroundColor: wo.priority === 'Critical' ? '#fef2f2' : wo.priority === 'High' ? '#fff7ed' : '#f0fdf4',
                        color: wo.priority === 'Critical' ? '#dc2626' : wo.priority === 'High' ? '#c2410c' : '#15803d'
                      }}>
                        {wo.priority}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{wo.assigned_to || "Unassigned"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
                        backgroundColor: wo.status === 'In Progress' ? '#dbeafe' : '#fef3c7',
                        color: wo.status === 'In Progress' ? '#1e40af' : '#92400e'
                      }}>
                        {wo.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => handleOpenModal(wo, 'complete')}
                        style={{ padding: "5px 12px", marginRight: "6px", backgroundColor: "#166534", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                      >
                        ✓ Submit Maintenance Done
                      </button>
                      <button
                        onClick={() => handleOpenModal(wo, 'edit')}
                        style={{ padding: "5px 10px", marginRight: "6px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(wo.id)}
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
      </div>

      {/* SECTION 2: Completed Machine Maintenance History & Auto Next Maintenance Due List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#166534", margin: 0 }}>
              ✅ Completed Machine Maintenance History & Next Due Tracker ({completedWorkOrders.length})
            </h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
              Auto-calculated next maintenance due schedules updated directly upon submitting completed maintenance
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0fdf4", borderBottom: "2px solid #bbf7d0", textAlign: "left", color: "#166534" }}>
                <th style={{ padding: "12px 16px" }}>Machine Name</th>
                <th style={{ padding: "12px 16px" }}>WO #</th>
                <th style={{ padding: "12px 16px" }}>Maintenance Title</th>
                <th style={{ padding: "12px 16px" }}>Servicing Done Date</th>
                <th style={{ padding: "12px 16px" }}>Cycle Frequency</th>
                <th style={{ padding: "12px 16px" }}>Next Maintenance Due Date</th>
                <th style={{ padding: "12px 16px" }}>Next Due Status</th>
                <th style={{ padding: "12px 16px" }}>Technician</th>
                <th style={{ padding: "12px 16px" }}>Cost (₹)</th>
                <th style={{ padding: "12px 16px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading completed records...</td></tr>
              ) : completedWorkOrders.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No completed machine maintenance history records found</td></tr>
              ) : (
                completedWorkOrders.map((wo) => {
                  const compDate = wo.completed_date ? wo.completed_date.slice(0, 10) : "-";
                  const nextDueStr = wo.next_maintenance_due ? wo.next_maintenance_due.slice(0, 10) : calculateNextDueDate(compDate, wo.maintenance_frequency || 'Monthly', wo.maintenance_interval_days || 30);
                  const dueInfo = getDueStatus(nextDueStr);
                  
                  return (
                    <tr key={wo.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "#1e293b" }}>{wo.equipment_name}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "#2563eb" }}>{wo.work_order_no}</td>
                      <td style={{ padding: "12px 16px" }}>{wo.title}</td>
                      <td style={{ padding: "12px 16px", color: "#475569", fontWeight: "600" }}>{compDate}</td>
                      <td style={{ padding: "12px 16px" }}>{wo.maintenance_frequency || "Monthly"}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "#1e293b" }}>
                        {nextDueStr}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700",
                          backgroundColor: dueInfo.bg, color: dueInfo.color
                        }}>
                          {dueInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>{wo.assigned_to || "-"}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600" }}>₹{Number(wo.cost || 0).toLocaleString()}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => handleOpenModal(wo, 'edit')}
                          style={{ padding: "5px 10px", marginRight: "6px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Work Order / Maintenance Completion Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "12px", width: "620px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: formMode === 'complete' ? '#166534' : '#2563eb', textTransform: "uppercase" }}>
                  {formMode === 'complete' ? "Submit Maintenance Done & Calculate Next Due" : editingWOId ? "Edit Work Order" : "Create New Work Order"}
                </span>
                <h2 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                  {formMode === 'complete' ? `Mark Completed: ${formData.title}` : editingWOId ? "Edit Work Order Form" : "Machine Maintenance Registration"}
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
                      <option key={m.id} value={m.id}>{m.equipment_code} - {m.name} ({m.department_name || 'Machine Shop'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Maintenance Task / Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g. Monthly CNC Oil Replacement & Calibration"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Maintenance Type</label>
                    <select
                      value={formData.type}
                      onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Preventive">Preventive</option>
                      <option value="Corrective">Corrective</option>
                      <option value="Breakdown">Breakdown</option>
                      <option value="Predictive">Predictive</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Maintenance Cycle / Frequency</label>
                    <select
                      value={formData.maintenance_frequency}
                      onChange={(e) => {
                        const freq = e.target.value;
                        setFormData({
                          ...formData,
                          maintenance_frequency: freq,
                          maintenance_interval_days: getIntervalDaysForFreq(freq)
                        });
                      }}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Daily">Daily (1 Day)</option>
                      <option value="Weekly">Weekly (7 Days)</option>
                      <option value="Monthly">Monthly (30 Days)</option>
                      <option value="Quarterly">Quarterly (90 Days)</option>
                      <option value="Semi-Annual">Semi-Annual (180 Days)</option>
                      <option value="Annual">Annual (365 Days)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e: any) => setFormData({ ...formData, priority: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Technician / Done By</label>
                    <input
                      type="text"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      placeholder="e.g. Rajesh Kumar (Sr Technician)"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Work Order Status</label>
                    <select
                      value={formData.status}
                      onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed (Maintenance Done)</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {formData.status === 'Completed' && (
                  <div style={{ backgroundColor: "#f0fdf4", padding: "14px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#166534" }}>🎯 Servicing Completion & Auto Next Due Calculation</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Maintenance Performed Date *</label>
                        <input
                          type="date"
                          value={formData.completed_date}
                          onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                          required
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Auto Calculated Next Due Date</label>
                        <div style={{ padding: "8px 12px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700", color: "#166534" }}>
                          📅 {calculateNextDueDate(formData.completed_date, formData.maintenance_frequency, formData.maintenance_interval_days)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Servicing Cost (₹)</label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Downtime (Minutes)</label>
                    <input
                      type="number"
                      value={formData.downtime_minutes}
                      onChange={(e) => setFormData({ ...formData, downtime_minutes: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Resolution / Servicing Notes</label>
                  <textarea
                    value={formData.resolution_notes}
                    onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
                    rows={2}
                    placeholder="Details of servicing performed, components replaced..."
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
                    backgroundColor: formData.status === 'Completed' ? "#166534" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "700"
                  }}
                >
                  {formData.status === 'Completed' ? "✓ Submit Maintenance & Auto Schedule Next Due" : "Save Work Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
