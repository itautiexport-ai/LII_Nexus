import React, { useEffect, useState } from "react";
import { maintenanceApi, WorkOrderRecord, EquipmentRecord } from "../api/maintenanceApi";

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrderRecord[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  // Modal Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    equipment_id: "",
    equipment_name: "",
    title: "",
    description: "",
    type: "Breakdown" as WorkOrderRecord['type'],
    priority: "Medium" as WorkOrderRecord['priority'],
    status: "Open" as WorkOrderRecord['status'],
    assigned_to: "",
    scheduled_date: "",
    downtime_minutes: 0,
    cost: 0,
    resolution_notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [woData, eqData] = await Promise.all([
        maintenanceApi.getWorkOrders(),
        maintenanceApi.getEquipment()
      ]);
      setWorkOrders(woData);
      setEquipmentList(eqData);
    } catch (err: any) {
      setError(err.message || "Failed to load work orders");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (wo?: WorkOrderRecord) => {
    if (wo) {
      setEditingId(wo.id);
      setFormData({
        equipment_id: wo.equipment_id || "",
        equipment_name: wo.equipment_name || "",
        title: wo.title || "",
        description: wo.description || "",
        type: wo.type || "Breakdown",
        priority: wo.priority || "Medium",
        status: wo.status || "Open",
        assigned_to: wo.assigned_to || "",
        scheduled_date: wo.scheduled_date ? wo.scheduled_date.slice(0, 10) : "",
        downtime_minutes: wo.downtime_minutes || 0,
        cost: wo.cost || 0,
        resolution_notes: wo.resolution_notes || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        equipment_id: equipmentList.length > 0 ? equipmentList[0].id : "",
        equipment_name: equipmentList.length > 0 ? equipmentList[0].name : "",
        title: "",
        description: "",
        type: "Breakdown",
        priority: "Medium",
        status: "Open",
        assigned_to: "",
        scheduled_date: "",
        downtime_minutes: 0,
        cost: 0,
        resolution_notes: ""
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
        await maintenanceApi.updateWorkOrder(editingId, formData);
      } else {
        await maintenanceApi.createWorkOrder(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this work order?")) return;
    try {
      await maintenanceApi.deleteWorkOrder(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete work order");
    }
  };

  const filteredWorkOrders = workOrders.filter(wo => {
    if (statusFilter !== "All" && wo.status !== statusFilter) return false;
    if (priorityFilter !== "All" && wo.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNo = wo.work_order_no.toLowerCase().includes(q);
      const matchTitle = wo.title.toLowerCase().includes(q);
      const matchEq = wo.equipment_name.toLowerCase().includes(q);
      if (!matchNo && !matchTitle && !matchEq) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Maintenance Work Orders</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>Create, assign, track repair tasks, downtime and completion notes</p>
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
          + Create Work Order
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", backgroundColor: "#ffffff", padding: "16px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <input
          type="text"
          placeholder="Search by WO #, Title, Equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "260px" }}
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
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
              <th style={{ padding: "12px 16px" }}>WO #</th>
              <th style={{ padding: "12px 16px" }}>Equipment</th>
              <th style={{ padding: "12px 16px" }}>Title</th>
              <th style={{ padding: "12px 16px" }}>Type</th>
              <th style={{ padding: "12px 16px" }}>Priority</th>
              <th style={{ padding: "12px 16px" }}>Assigned To</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading work orders...</td></tr>
            ) : filteredWorkOrders.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No work orders found matching filters</td></tr>
            ) : (
              filteredWorkOrders.map((wo) => (
                <tr key={wo.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#2563eb" }}>{wo.work_order_no}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "500" }}>{wo.equipment_name}</td>
                  <td style={{ padding: "12px 16px" }}>{wo.title}</td>
                  <td style={{ padding: "12px 16px" }}>{wo.type}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
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
                      backgroundColor: wo.status === 'Completed' ? '#dcfce7' : wo.status === 'In Progress' ? '#dbeafe' : '#fef3c7',
                      color: wo.status === 'Completed' ? '#166534' : wo.status === 'In Progress' ? '#1e40af' : '#92400e'
                    }}>
                      {wo.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleOpenModal(wo)}
                      style={{ padding: "6px 12px", marginRight: "8px", backgroundColor: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(wo.id)}
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
          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", width: "550px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "700" }}>
              {editingId ? "Edit Work Order" : "New Work Order"}
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
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Type</label>
                    <select
                      value={formData.type}
                      onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Breakdown">Breakdown</option>
                      <option value="Preventive">Preventive</option>
                      <option value="Corrective">Corrective</option>
                      <option value="Predictive">Predictive</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Priority</label>
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
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Assigned Technician</label>
                    <input
                      type="text"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      placeholder="Technician Name"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Downtime (Mins)</label>
                    <input
                      type="number"
                      value={formData.downtime_minutes}
                      onChange={(e) => setFormData({ ...formData, downtime_minutes: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Cost (₹)</label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Description / Issue Notes</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                {formData.status === 'Completed' && (
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px", color: "#166534" }}>Resolution Notes</label>
                    <textarea
                      value={formData.resolution_notes}
                      onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
                      rows={2}
                      placeholder="Describe steps taken to resolve the issue..."
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}
                    />
                  </div>
                )}
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
                  Save Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
