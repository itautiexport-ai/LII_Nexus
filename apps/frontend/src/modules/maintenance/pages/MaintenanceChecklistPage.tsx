import React, { useEffect, useState } from "react";
import {
  maintenanceApi,
  MaintenanceChecklistRecord,
  ChecklistSparePartItem,
  ChecklistDashboardStats,
  EquipmentRecord
} from "../api/maintenanceApi";

export default function MaintenanceChecklistPage() {
  const [stats, setStats] = useState<ChecklistDashboardStats | null>(null);
  const [checklists, setChecklists] = useState<MaintenanceChecklistRecord[]>([]);
  const [machines, setMachines] = useState<EquipmentRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>("");
  const [machineFilter, setMachineFilter] = useState<string>("All");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [technicianFilter, setTechnicianFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [viewingChecklist, setViewingChecklist] = useState<MaintenanceChecklistRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Initial Form State
  const initialFormState = {
    filled_by_name: "", // Option to fill who is filling checklist
    technician_name: "",
    equipment_id: "",
    equipment_name: "",
    department_name: "Machine Shop",
    due_date: new Date().toISOString().split("T")[0],
    
    // Mechanical Checks
    mechanical_checks: {
      clean_machine: false,
      check_belts: false,
      tighten_bolts: false,
      lubricate_moving_parts: false
    },

    // Electrical Checks
    electrical_checks: {
      check_wiring: false,
      check_emergency_stop: false,
      check_sensors: false
    },

    // Safety Checks
    safety_checks: {
      safety_guards_in_place: false,
      emergency_stop_working: false,
      work_area_cleaned: false
    },

    // General Checks
    general_checks: {
      machine_test_run_completed: false,
      no_abnormal_noise: false,
      machine_handed_over_to_production: false
    },

    // Spare Parts Used
    spare_parts_used: [] as ChecklistSparePartItem[],

    // Maintenance Completion
    start_time: "09:00 AM",
    end_time: "10:30 AM",
    work_completed: "",
    issues_found: "",
    technician_remarks: "",
    photo_before_url: "",
    photo_after_url: "",

    // Supervisor Approval
    supervisor_name: "",
    approval_status: "Pending" as MaintenanceChecklistRecord['approval_status'],
    approval_remarks: "",
    approval_date: "",

    // Status Flow
    status: "Scheduled" as MaintenanceChecklistRecord['status']
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadChecklistData();
  }, []);

  const loadChecklistData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, listData, eqData] = await Promise.all([
        maintenanceApi.getChecklistStats().catch(() => null),
        maintenanceApi.getChecklists().catch(() => []),
        maintenanceApi.getEquipment().catch(() => [])
      ]);
      setStats(statsData);
      setChecklists(listData);
      setMachines(eqData);
    } catch (err: any) {
      setError(err.message || "Failed to load maintenance checklists");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: MaintenanceChecklistRecord) => {
    setViewingChecklist(null);
    if (item) {
      setEditingId(item.id);
      setFormData({
        filled_by_name: item.filled_by_name || "",
        technician_name: item.technician_name || "",
        equipment_id: item.equipment_id || "",
        equipment_name: item.equipment_name || "",
        department_name: item.department_name || "Machine Shop",
        due_date: item.due_date ? item.due_date.slice(0, 10) : new Date().toISOString().split("T")[0],
        mechanical_checks: {
          clean_machine: !!item.mechanical_checks?.clean_machine,
          check_belts: !!item.mechanical_checks?.check_belts,
          tighten_bolts: !!item.mechanical_checks?.tighten_bolts,
          lubricate_moving_parts: !!item.mechanical_checks?.lubricate_moving_parts
        },
        electrical_checks: {
          check_wiring: !!item.electrical_checks?.check_wiring,
          check_emergency_stop: !!item.electrical_checks?.check_emergency_stop,
          check_sensors: !!item.electrical_checks?.check_sensors
        },
        safety_checks: {
          safety_guards_in_place: !!item.safety_checks?.safety_guards_in_place,
          emergency_stop_working: !!item.safety_checks?.emergency_stop_working,
          work_area_cleaned: !!item.safety_checks?.work_area_cleaned
        },
        general_checks: {
          machine_test_run_completed: !!item.general_checks?.machine_test_run_completed,
          no_abnormal_noise: !!item.general_checks?.no_abnormal_noise,
          machine_handed_over_to_production: !!item.general_checks?.machine_handed_over_to_production
        },
        spare_parts_used: Array.isArray(item.spare_parts_used) ? item.spare_parts_used : [],
        start_time: item.start_time || "09:00 AM",
        end_time: item.end_time || "10:30 AM",
        work_completed: item.work_completed || "",
        issues_found: item.issues_found || "",
        technician_remarks: item.technician_remarks || "",
        photo_before_url: item.photo_before_url || "",
        photo_after_url: item.photo_after_url || "",
        supervisor_name: item.supervisor_name || "",
        approval_status: item.approval_status || "Pending",
        approval_remarks: item.approval_remarks || "",
        approval_date: item.approval_date ? item.approval_date.slice(0, 10) : "",
        status: item.status || "Scheduled"
      });
    } else {
      setEditingId(null);
      const defaultEq = machines.length > 0 ? machines[0] : null;
      setFormData({
        ...initialFormState,
        equipment_id: defaultEq ? defaultEq.id : "",
        equipment_name: defaultEq ? defaultEq.name : "",
        department_name: defaultEq?.department_name || "Machine Shop"
      });
    }
    setShowModal(true);
  };

  // Dynamic Spare Parts Handlers
  const handleAddSparePart = () => {
    setFormData(prev => ({
      ...prev,
      spare_parts_used: [...prev.spare_parts_used, { part_name: "", quantity: "1 No.", remarks: "" }]
    }));
  };

  const handleUpdateSparePart = (index: number, field: keyof ChecklistSparePartItem, val: string) => {
    const updated = [...formData.spare_parts_used];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, spare_parts_used: updated });
  };

  const handleRemoveSparePart = (index: number) => {
    const updated = formData.spare_parts_used.filter((_, i) => i !== index);
    setFormData({ ...formData, spare_parts_used: updated });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'photo_before_url' | 'photo_after_url') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [fieldName]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await maintenanceApi.updateChecklist(editingId, formData);
      } else {
        await maintenanceApi.createChecklist(formData);
      }
      setShowModal(false);
      loadChecklistData();
    } catch (err: any) {
      alert(err.message || "Failed to save maintenance checklist");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this maintenance checklist?")) return;
    try {
      await maintenanceApi.deleteChecklist(id);
      loadChecklistData();
    } catch (err: any) {
      alert(err.message || "Failed to delete checklist");
    }
  };

  // Export Handlers
  const handleExportCSV = () => {
    if (checklists.length === 0) return alert("No data available to export.");
    const headers = ["Checklist No", "Filled By", "Technician", "Equipment", "Department", "Due Date", "Status"];
    const rows = filteredChecklists.map(c => [
      c.checklist_no,
      `"${c.filled_by_name || ''}"`,
      `"${c.technician_name || ''}"`,
      `"${c.equipment_name || ''}"`,
      `"${c.department_name || ''}"`,
      c.due_date ? c.due_date.slice(0, 10) : '',
      c.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Maintenance_Checklist_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Filter Checklists
  const filteredChecklists = checklists.filter(c => {
    if (machineFilter !== "All" && c.equipment_name !== machineFilter) return false;
    if (departmentFilter !== "All" && c.department_name !== departmentFilter) return false;
    if (technicianFilter !== "All" && (c.technician_name !== technicianFilter && c.filled_by_name !== technicianFilter)) return false;
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    if (fromDate && c.due_date < fromDate) return false;
    if (toDate && c.due_date > toDate) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNo = (c.checklist_no || "").toLowerCase().includes(q);
      const matchFilled = (c.filled_by_name || "").toLowerCase().includes(q);
      const matchTech = (c.technician_name || "").toLowerCase().includes(q);
      const matchEq = (c.equipment_name || "").toLowerCase().includes(q);
      if (!matchNo && !matchFilled && !matchTech && !matchEq) return false;
    }
    return true;
  });

  // Calculate Notification Reminders
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingReminders = checklists.filter(c => {
    if (c.status === 'Completed' || c.status === 'Cancelled') return false;
    const due = new Date(c.due_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 3;
  });

  // Unique Lists for Dropdown Filters
  const uniqueMachines = Array.from(new Set(checklists.map(c => c.equipment_name).filter((x): x is string => Boolean(x))));
  const uniqueDepartments = Array.from(new Set(checklists.map(c => c.department_name).filter((x): x is string => Boolean(x))));
  const uniqueTechnicians = Array.from(new Set(checklists.map(c => c.technician_name || c.filled_by_name).filter((x): x is string => Boolean(x))));

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>PMC (Preventive Maintenance Checklist)</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Preventive Maintenance Sub-Module: Comprehensive PM technician inspection checklist covering mechanical, electrical, safety, spare parts & supervisor approvals
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleExportCSV}
            style={{ padding: "9px 16px", backgroundColor: "#0284c7", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
          >
            📥 Export to Excel
          </button>
          <button
            onClick={handlePrintPDF}
            style={{ padding: "9px 16px", backgroundColor: "#475569", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
          >
            📄 Export to PDF
          </button>
          <button
            onClick={() => handleOpenModal()}
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
            + Fill PMC Checklist
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* KPI Key Cards Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Today's PM Tasks</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginTop: "6px" }}>{stats?.todays_pm_tasks || 0}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Overdue PMs</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626", marginTop: "6px" }}>{stats?.overdue_pms || 0}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Completed This Month</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#166534", marginTop: "6px" }}>{stats?.completed_this_month || 0}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Upcoming PMs (Next 7 Days)</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#d97706", marginTop: "6px" }}>{stats?.upcoming_pms_next_7_days || 0}</div>
        </div>
      </div>

      {/* Notifications & Reminders Alert Banner */}
      {upcomingReminders.length > 0 && (
        <div style={{ backgroundColor: "#fffbe6", border: "1px solid #ffe58f", padding: "14px 18px", borderRadius: "10px", marginBottom: "24px" }}>
          <div style={{ fontWeight: "700", color: "#d97706", fontSize: "14px", marginBottom: "4px" }}>
            🔔 Automated Maintenance Reminders ({upcomingReminders.length} Alerts)
          </div>
          <div style={{ fontSize: "13px", color: "#78350f" }}>
            3 days before due date, on due date & overdue alerts are active. Notifying Maintenance Head for pending tasks.
          </div>
        </div>
      )}

      {/* Reports & Filtering Bar */}
      <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "10px", textTransform: "uppercase" }}>📊 Reports & Multi-Criteria Filtering</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Search Keyword</label>
            <input
              type="text"
              placeholder="Search #, Filled By, Tech, Machine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Filter Machine</label>
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            >
              <option value="All">All Machines</option>
              {uniqueMachines.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Filter Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            >
              <option value="All">All Departments</option>
              {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Filter Technician</label>
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            >
              <option value="All">All Technicians</option>
              {uniqueTechnicians.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>From Due Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>To Due Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            />
          </div>
        </div>
      </div>

      {/* Main Checklist Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
              <th style={{ padding: "12px 16px" }}>Checklist #</th>
              <th style={{ padding: "12px 16px" }}>Who Filled Checklist</th>
              <th style={{ padding: "12px 16px" }}>Machine & Dept</th>
              <th style={{ padding: "12px 16px" }}>Due Date</th>
              <th style={{ padding: "12px 16px" }}>Mechanical</th>
              <th style={{ padding: "12px 16px" }}>Electrical</th>
              <th style={{ padding: "12px 16px" }}>Safety</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading maintenance checklists...</td></tr>
            ) : filteredChecklists.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No maintenance checklists found matching criteria</td></tr>
            ) : (
              filteredChecklists.map((item) => {
                const mechDone = Object.values(item.mechanical_checks || {}).filter(Boolean).length;
                const elecDone = Object.values(item.electrical_checks || {}).filter(Boolean).length;
                const safeDone = Object.values(item.safety_checks || {}).filter(Boolean).length;

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "#2563eb" }}>{item.checklist_no}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1e293b" }}>
                      {item.filled_by_name}
                      {item.technician_name && item.technician_name !== item.filled_by_name && (
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>Tech: {item.technician_name}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "600" }}>{item.equipment_name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{item.department_name || "Machine Shop"}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: item.due_date < todayStr && item.status !== 'Completed' ? '#dc2626' : '#1e293b' }}>
                      {item.due_date ? item.due_date.slice(0, 10) : "-"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: mechDone === 4 ? "#dcfce7" : "#f1f5f9", color: mechDone === 4 ? "#166534" : "#475569" }}>
                        {mechDone}/4 Checks
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: elecDone === 3 ? "#dcfce7" : "#f1f5f9", color: elecDone === 3 ? "#166534" : "#475569" }}>
                        {elecDone}/3 Checks
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: safeDone === 3 ? "#dcfce7" : "#f1f5f9", color: safeDone === 3 ? "#166534" : "#475569" }}>
                        {safeDone}/3 Checks
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700",
                        backgroundColor: item.status === 'Completed' ? '#dcfce7' : item.status === 'Overdue' ? '#fef2f2' : item.status === 'In Progress' ? '#dbeafe' : '#fef3c7',
                        color: item.status === 'Completed' ? '#166534' : item.status === 'Overdue' ? '#dc2626' : item.status === 'In Progress' ? '#1e40af' : '#92400e'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => setViewingChecklist(item)}
                        style={{ padding: "5px 10px", marginRight: "6px", backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenModal(item)}
                        style={{ padding: "5px 10px", marginRight: "6px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ padding: "5px 10px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View Checklist Summary Modal */}
      {viewingChecklist && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "12px", width: "700px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>Maintenance Checklist Inspection</span>
                <h2 style={{ margin: "4px 0 0 0", fontSize: "22px", fontWeight: "700" }}>{viewingChecklist.checklist_no} - {viewingChecklist.equipment_name}</h2>
              </div>
              <button onClick={() => setViewingChecklist(null)} style={{ padding: "4px 10px", border: "none", backgroundColor: "#f1f5f9", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
              <div><strong>Who Filled:</strong> {viewingChecklist.filled_by_name}</div>
              <div><strong>Technician:</strong> {viewingChecklist.technician_name || "-"}</div>
              <div><strong>Due Date:</strong> {viewingChecklist.due_date ? viewingChecklist.due_date.slice(0, 10) : "-"}</div>
              <div><strong>Department:</strong> {viewingChecklist.department_name || "-"}</div>
              <div><strong>Status:</strong> {viewingChecklist.status}</div>
              <div><strong>Approval:</strong> {viewingChecklist.approval_status}</div>
            </div>

            {/* Inspections Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#2563eb" }}>Mechanical Checks</h4>
                <div>{viewingChecklist.mechanical_checks?.clean_machine ? "✅" : "☐"} Clean machine</div>
                <div>{viewingChecklist.mechanical_checks?.check_belts ? "✅" : "☐"} Check belts</div>
                <div>{viewingChecklist.mechanical_checks?.tighten_bolts ? "✅" : "☐"} Tighten bolts</div>
                <div>{viewingChecklist.mechanical_checks?.lubricate_moving_parts ? "✅" : "☐"} Lubricate moving parts</div>
              </div>

              <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#2563eb" }}>Electrical Checks</h4>
                <div>{viewingChecklist.electrical_checks?.check_wiring ? "✅" : "☐"} Check wiring</div>
                <div>{viewingChecklist.electrical_checks?.check_emergency_stop ? "✅" : "☐"} Check emergency stop</div>
                <div>{viewingChecklist.electrical_checks?.check_sensors ? "✅" : "☐"} Check sensors</div>
              </div>

              <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#2563eb" }}>Safety Checks</h4>
                <div>{viewingChecklist.safety_checks?.safety_guards_in_place ? "✅" : "☐"} Safety guards in place</div>
                <div>{viewingChecklist.safety_checks?.emergency_stop_working ? "✅" : "☐"} Emergency stop working</div>
                <div>{viewingChecklist.safety_checks?.work_area_cleaned ? "✅" : "☐"} Work area cleaned</div>
              </div>

              <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#2563eb" }}>General Checks</h4>
                <div>{viewingChecklist.general_checks?.machine_test_run_completed ? "✅" : "☐"} Machine test run completed</div>
                <div>{viewingChecklist.general_checks?.no_abnormal_noise ? "✅" : "☐"} No abnormal noise</div>
                <div>{viewingChecklist.general_checks?.machine_handed_over_to_production ? "✅" : "☐"} Handed over to production</div>
              </div>
            </div>

            {/* Spare Parts Used */}
            {Array.isArray(viewingChecklist.spare_parts_used) && viewingChecklist.spare_parts_used.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#334155" }}>4. Spare Parts Used</h4>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                  {viewingChecklist.spare_parts_used.map((part, idx) => (
                    <div key={idx}>• <strong>{part.part_name}</strong> – {part.quantity} {part.remarks ? `(${part.remarks})` : ''}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance Completion & Remarks */}
            <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#334155" }}>5. Maintenance Completion & Remarks</h4>
              <div><strong>Timings:</strong> {viewingChecklist.start_time || '-'} to {viewingChecklist.end_time || '-'}</div>
              <div><strong>Work Completed:</strong> {viewingChecklist.work_completed || 'N/A'}</div>
              <div><strong>Issues Found:</strong> {viewingChecklist.issues_found || 'None'}</div>
              <div><strong>Technician Remarks:</strong> {viewingChecklist.technician_remarks || 'None'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "12px", width: "750px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                {editingId ? "Edit PMC (Preventive Maintenance Checklist)" : "Fill PMC (Preventive Maintenance Checklist)"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ padding: "4px 10px", border: "none", backgroundColor: "#f1f5f9", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: "16px" }}>

                {/* Section 0: Who is filling & Machine Info */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#2563eb", textTransform: "uppercase" }}>Basic Info & Person Details</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Who is Filling Checklist? *</label>
                      <input
                        type="text"
                        value={formData.filled_by_name}
                        onChange={(e) => setFormData({ ...formData, filled_by_name: e.target.value })}
                        required
                        placeholder="e.g. Rahul Sharma"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Technician Name</label>
                      <input
                        type="text"
                        value={formData.technician_name}
                        onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
                        placeholder="e.g. Suresh Kumar"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Machine *</label>
                      <select
                        value={formData.equipment_id}
                        onChange={(e) => {
                          const id = e.target.value;
                          const m = machines.find(item => item.id === id);
                          setFormData({
                            ...formData,
                            equipment_id: id,
                            equipment_name: m ? m.name : formData.equipment_name,
                            department_name: m?.department_name || formData.department_name
                          });
                        }}
                        required
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      >
                        <option value="">-- Select Machine --</option>
                        {machines.map(m => (
                          <option key={m.id} value={m.id}>{m.equipment_code} - {m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Department</label>
                      <input
                        type="text"
                        value={formData.department_name}
                        onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>PM Due Date *</label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        required
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>7. Checklist Status</label>
                      <select
                        value={formData.status}
                        onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 1: Mechanical Checks */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#2563eb", textTransform: "uppercase" }}>1. Mechanical Checks</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.mechanical_checks.clean_machine}
                        onChange={(e) => setFormData({ ...formData, mechanical_checks: { ...formData.mechanical_checks, clean_machine: e.target.checked } })}
                      />
                      Clean machine
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.mechanical_checks.check_belts}
                        onChange={(e) => setFormData({ ...formData, mechanical_checks: { ...formData.mechanical_checks, check_belts: e.target.checked } })}
                      />
                      Check belts
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.mechanical_checks.tighten_bolts}
                        onChange={(e) => setFormData({ ...formData, mechanical_checks: { ...formData.mechanical_checks, tighten_bolts: e.target.checked } })}
                      />
                      Tighten bolts
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.mechanical_checks.lubricate_moving_parts}
                        onChange={(e) => setFormData({ ...formData, mechanical_checks: { ...formData.mechanical_checks, lubricate_moving_parts: e.target.checked } })}
                      />
                      Lubricate moving parts
                    </label>
                  </div>
                </div>

                {/* Section 2: Electrical Checks */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#2563eb", textTransform: "uppercase" }}>2. Electrical Checks</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.electrical_checks.check_wiring}
                        onChange={(e) => setFormData({ ...formData, electrical_checks: { ...formData.electrical_checks, check_wiring: e.target.checked } })}
                      />
                      Check wiring
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.electrical_checks.check_emergency_stop}
                        onChange={(e) => setFormData({ ...formData, electrical_checks: { ...formData.electrical_checks, check_emergency_stop: e.target.checked } })}
                      />
                      Check emergency stop
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.electrical_checks.check_sensors}
                        onChange={(e) => setFormData({ ...formData, electrical_checks: { ...formData.electrical_checks, check_sensors: e.target.checked } })}
                      />
                      Check sensors
                    </label>
                  </div>
                </div>

                {/* Section 3: Safety Checks */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#2563eb", textTransform: "uppercase" }}>3. Safety Checks</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.safety_checks.safety_guards_in_place}
                        onChange={(e) => setFormData({ ...formData, safety_checks: { ...formData.safety_checks, safety_guards_in_place: e.target.checked } })}
                      />
                      Safety guards in place
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.safety_checks.emergency_stop_working}
                        onChange={(e) => setFormData({ ...formData, safety_checks: { ...formData.safety_checks, emergency_stop_working: e.target.checked } })}
                      />
                      Emergency stop working
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.safety_checks.work_area_cleaned}
                        onChange={(e) => setFormData({ ...formData, safety_checks: { ...formData.safety_checks, work_area_cleaned: e.target.checked } })}
                      />
                      Work area cleaned
                    </label>
                  </div>
                </div>

                {/* Section 4: General Checks */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#2563eb", textTransform: "uppercase" }}>General Inspection</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.general_checks.machine_test_run_completed}
                        onChange={(e) => setFormData({ ...formData, general_checks: { ...formData.general_checks, machine_test_run_completed: e.target.checked } })}
                      />
                      Machine test run completed
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.general_checks.no_abnormal_noise}
                        onChange={(e) => setFormData({ ...formData, general_checks: { ...formData.general_checks, no_abnormal_noise: e.target.checked } })}
                      />
                      No abnormal noise
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.general_checks.machine_handed_over_to_production}
                        onChange={(e) => setFormData({ ...formData, general_checks: { ...formData.general_checks, machine_handed_over_to_production: e.target.checked } })}
                      />
                      Machine handed over to production
                    </label>
                  </div>
                </div>

                {/* Section 4. Spare Parts Used (Optional) */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h4 style={{ margin: 0, fontSize: "13px", color: "#2563eb", textTransform: "uppercase" }}>4. Spare Parts Used (Optional)</h4>
                    <button
                      type="button"
                      onClick={handleAddSparePart}
                      style={{ padding: "4px 10px", backgroundColor: "#e0e7ff", color: "#3730a3", border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                    >
                      + Add Spare Part
                    </button>
                  </div>
                  {formData.spare_parts_used.length === 0 ? (
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>No spare parts added. (Example: Bearing – 2 Nos., V-Belt – 1 No., Grease – 200 gm)</div>
                  ) : (
                    formData.spare_parts_used.map((part, idx) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr auto", gap: "8px", marginBottom: "8px" }}>
                        <input
                          type="text"
                          placeholder="Spare Part Name (e.g. Bearing)"
                          value={part.part_name}
                          onChange={(e) => handleUpdateSparePart(idx, 'part_name', e.target.value)}
                          style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                        />
                        <input
                          type="text"
                          placeholder="Quantity (e.g. 2 Nos / 200 gm)"
                          value={part.quantity}
                          onChange={(e) => handleUpdateSparePart(idx, 'quantity', e.target.value)}
                          style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                        />
                        <input
                          type="text"
                          placeholder="Remarks"
                          value={part.remarks || ""}
                          onChange={(e) => handleUpdateSparePart(idx, 'remarks', e.target.value)}
                          style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSparePart(idx)}
                          style={{ padding: "4px 8px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Section 5: Maintenance Completion */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#2563eb", textTransform: "uppercase" }}>5. Maintenance Completion Details</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Start Time</label>
                      <input
                        type="text"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        placeholder="e.g. 09:00 AM"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>End Time</label>
                      <input
                        type="text"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        placeholder="e.g. 10:30 AM"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Work Completed Summary</label>
                    <textarea
                      value={formData.work_completed}
                      onChange={(e) => setFormData({ ...formData, work_completed: e.target.value })}
                      rows={2}
                      placeholder="Cleaned dust, replaced V-belt, tightened all mounting bolts..."
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Issues Found (if any)</label>
                      <textarea
                        value={formData.issues_found}
                        onChange={(e) => setFormData({ ...formData, issues_found: e.target.value })}
                        rows={2}
                        placeholder="e.g. Slight wear on main gear, scheduled for next month replacement"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Technician Remarks</label>
                      <textarea
                        value={formData.technician_remarks}
                        onChange={(e) => setFormData({ ...formData, technician_remarks: e.target.value })}
                        rows={2}
                        placeholder="Machine operating smoothly after lubrication"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Photos Before (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'photo_before_url')}
                        style={{ fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Photos After (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'photo_after_url')}
                        style={{ fontSize: "12px" }}
                      />
                    </div>
                  </div>
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
                  style={{ padding: "8px 24px", borderRadius: "6px", backgroundColor: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontWeight: "700" }}
                >
                  Save Maintenance Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
