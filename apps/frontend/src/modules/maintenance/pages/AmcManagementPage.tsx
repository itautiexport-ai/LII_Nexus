import React, { useEffect, useState } from "react";
import {
  maintenanceApi,
  AmcContractRecord,
  EquipmentRecord,
  MaintenanceDashboardStats
} from "../api/maintenanceApi";

export default function AmcManagementPage() {
  const [stats, setStats] = useState<MaintenanceDashboardStats | null>(null);
  const [amcContracts, setAmcContracts] = useState<AmcContractRecord[]>([]);
  const [machines, setMachines] = useState<EquipmentRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAmcId, setEditingAmcId] = useState<string | null>(null);

  const initialFormState = {
    contract_no: "",
    vendor_name: "",
    vendor_contact: "",
    equipment_id: "",
    equipment_name: "",
    contract_value: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    visit_schedule: "Quarterly",
    documents_url: "",
    renewal_reminder_days: 30,
    status: "Active" as AmcContractRecord['status'],
    notes: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadAmcData();
  }, []);

  const loadAmcData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, amcData, eqData] = await Promise.all([
        maintenanceApi.getStats().catch(() => null),
        maintenanceApi.getAmcContracts().catch(() => []),
        maintenanceApi.getEquipment().catch(() => [])
      ]);
      setStats(statsData);
      setAmcContracts(amcData);
      setMachines(eqData);
    } catch (err: any) {
      setError(err.message || "Failed to load AMC contracts");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (contract?: AmcContractRecord) => {
    if (contract) {
      setEditingAmcId(contract.id);
      setFormData({
        contract_no: contract.contract_no || "",
        vendor_name: contract.vendor_name || "",
        vendor_contact: contract.vendor_contact || "",
        equipment_id: contract.equipment_id || "",
        equipment_name: contract.equipment_name || "",
        contract_value: contract.contract_value || 0,
        start_date: contract.start_date ? contract.start_date.slice(0, 10) : new Date().toISOString().split("T")[0],
        end_date: contract.end_date ? contract.end_date.slice(0, 10) : new Date().toISOString().split("T")[0],
        visit_schedule: contract.visit_schedule || "Quarterly",
        documents_url: contract.documents_url || "",
        renewal_reminder_days: contract.renewal_reminder_days || 30,
        status: contract.status || "Active",
        notes: contract.notes || ""
      });
    } else {
      setEditingAmcId(null);
      const defaultEq = machines.length > 0 ? machines[0] : null;
      setFormData({
        ...initialFormState,
        contract_no: `AMC-${Date.now().toString().slice(-6)}`,
        equipment_id: defaultEq ? defaultEq.id : "",
        equipment_name: defaultEq ? defaultEq.name : ""
      });
    }
    setShowModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          documents_url: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAmcId) {
        await maintenanceApi.updateAmcContract(editingAmcId, formData);
      } else {
        await maintenanceApi.createAmcContract(formData);
      }
      setShowModal(false);
      loadAmcData();
    } catch (err: any) {
      alert(err.message || "AMC contract operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this AMC contract?")) return;
    try {
      await maintenanceApi.deleteAmcContract(id);
      loadAmcData();
    } catch (err: any) {
      alert(err.message || "Failed to delete AMC contract");
    }
  };

  const calculateDaysRemaining = (endDateStr: string): number => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
  };

  const filteredContracts = amcContracts.filter(c => {
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNo = (c.contract_no || "").toLowerCase().includes(q);
      const matchVendor = (c.vendor_name || "").toLowerCase().includes(q);
      const matchEq = (c.equipment_name || "").toLowerCase().includes(q);
      if (!matchNo && !matchVendor && !matchEq) return false;
    }
    return true;
  });

  const totalContractValue = amcContracts.reduce((sum, c) => sum + Number(c.contract_value || 0), 0);
  const expiringSoonCount = amcContracts.filter(c => c.status === 'Expiring Soon').length;
  const expiredCount = amcContracts.filter(c => c.status === 'Expired').length;
  const activeCount = amcContracts.filter(c => c.status === 'Active').length;

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>AMC Management (Annual Maintenance Contracts)</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Track equipment annual maintenance contracts, vendor visit schedules, contract values & automatic renewal reminders
          </p>
        </div>
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
          + Add AMC Contract
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Active Contracts</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#166534", marginTop: "6px" }}>{activeCount}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Contract Value</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginTop: "6px" }}>₹{totalContractValue.toLocaleString()}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Expiring Soon (Renewal Reminder)</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#d97706", marginTop: "6px" }}>{expiringSoonCount}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Expired Contracts</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626", marginTop: "6px" }}>{expiredCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", backgroundColor: "#ffffff", padding: "16px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <input
          type="text"
          placeholder="Search by Contract #, Vendor, Equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "320px" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="All">All Renewal Statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      {/* Main Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
              <th style={{ padding: "12px 16px" }}>Contract #</th>
              <th style={{ padding: "12px 16px" }}>Vendor</th>
              <th style={{ padding: "12px 16px" }}>Equipment</th>
              <th style={{ padding: "12px 16px" }}>Contract Value (₹)</th>
              <th style={{ padding: "12px 16px" }}>Start Date</th>
              <th style={{ padding: "12px 16px" }}>End Date</th>
              <th style={{ padding: "12px 16px" }}>Visit Schedule</th>
              <th style={{ padding: "12px 16px" }}>Renewal Reminder</th>
              <th style={{ padding: "12px 16px" }}>Documents</th>
              <th style={{ padding: "12px 16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading AMC contracts...</td></tr>
            ) : filteredContracts.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No AMC contracts found</td></tr>
            ) : (
              filteredContracts.map((contract) => {
                const daysLeft = calculateDaysRemaining(contract.end_date);
                const isExpiringSoon = contract.status === 'Expiring Soon';
                const isExpired = contract.status === 'Expired';

                return (
                  <tr key={contract.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "#2563eb" }}>{contract.contract_no}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1e293b" }}>
                      {contract.vendor_name}
                      {contract.vendor_contact && (
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>📞 {contract.vendor_contact}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>{contract.equipment_name}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "#1e293b" }}>₹{Number(contract.contract_value || 0).toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px" }}>{contract.start_date ? contract.start_date.slice(0, 10) : "-"}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "600" }}>{contract.end_date ? contract.end_date.slice(0, 10) : "-"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 8px", backgroundColor: "#f1f5f9", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                        🗓️ {contract.visit_schedule}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700",
                        backgroundColor: isExpired ? '#fef2f2' : isExpiringSoon ? '#fffbe6' : '#dcfce7',
                        color: isExpired ? '#dc2626' : isExpiringSoon ? '#d97706' : '#166534'
                      }}>
                        {isExpired ? '🛑 Expired' : isExpiringSoon ? `⚠️ Renewal Due (${daysLeft}d left)` : `🟢 Active (${daysLeft}d left)`}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {contract.documents_url ? (
                        <a
                          href={contract.documents_url}
                          download={`AMC_Contract_${contract.contract_no}`}
                          style={{ padding: "4px 10px", backgroundColor: "#e0e7ff", color: "#3730a3", borderRadius: "6px", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}
                        >
                          📄 View Document
                        </a>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>No attachment</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => handleOpenModal(contract)}
                        style={{ padding: "5px 10px", marginRight: "6px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(contract.id)}
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

      {/* AMC Contract Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "12px", width: "650px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                {editingAmcId ? "Edit AMC Contract Details" : "New AMC Contract Registration"}
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
              <div style={{ display: "grid", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Contract Number *</label>
                    <input
                      type="text"
                      value={formData.contract_no}
                      onChange={(e) => setFormData({ ...formData, contract_no: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Equipment / Machine *</label>
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
                        <option key={m.id} value={m.id}>{m.equipment_code} - {m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Vendor / Contractor Name *</label>
                    <input
                      type="text"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      required
                      placeholder="e.g. Siemens India Ltd / Biesse Support"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Vendor Contact Person / Phone</label>
                    <input
                      type="text"
                      value={formData.vendor_contact}
                      onChange={(e) => setFormData({ ...formData, vendor_contact: e.target.value })}
                      placeholder="+91 9876543210 / support@vendor.com"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Contract Value (₹) *</label>
                    <input
                      type="number"
                      value={formData.contract_value}
                      onChange={(e) => setFormData({ ...formData, contract_value: Number(e.target.value) })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Visit Schedule</label>
                    <select
                      value={formData.visit_schedule}
                      onChange={(e) => setFormData({ ...formData, visit_schedule: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Monthly">Monthly Visit</option>
                      <option value="Bi-Monthly">Bi-Monthly Visit</option>
                      <option value="Quarterly">Quarterly Visit</option>
                      <option value="Semi-Annual">Semi-Annual Visit</option>
                      <option value="Annual">Annual Visit</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Renewal Reminder Lead (Days)</label>
                    <input
                      type="number"
                      value={formData.renewal_reminder_days}
                      onChange={(e) => setFormData({ ...formData, renewal_reminder_days: Number(e.target.value) })}
                      placeholder="e.g. 30 Days before expiry"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Contract Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Contract End Date *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Contract Document Attachment (PDF/Doc)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleFileUpload}
                    style={{ fontSize: "12px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Special Terms / Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="Include inclusions (spare parts covered), emergency SLA response time..."
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
                  style={{ padding: "8px 22px", borderRadius: "6px", backgroundColor: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontWeight: "700" }}
                >
                  Save AMC Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
