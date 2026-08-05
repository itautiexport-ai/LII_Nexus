import React, { useEffect, useState } from "react";
import { maintenanceApi, EquipmentRecord } from "../api/maintenanceApi";

export default function MachineDetailsPage() {
  const [machines, setMachines] = useState<EquipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [viewingMachine, setViewingMachine] = useState<EquipmentRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState = {
    equipment_code: "", // Machine ID
    name: "", // Machine Name
    asset_number: "", // Asset Number
    category: "Machine Shop",
    machine_type: "", // Machine Type
    department_name: "MACHINE SHOP", // Department
    location: "Factory Floor", // Location
    manufacturer: "", // Manufacturer
    model: "", // Model
    status: "Operational" as EquipmentRecord['status'],
    serial_number: "", // Serial Number
    installation_date: "", // Installation Date
    purchase_date: "", // Purchase Date
    warranty_expiry: "", // Warranty Expiry
    power_rating: "", // Power Rating
    capacity: "", // Capacity
    plc_details: "", // PLC Details
    operating_manual: "", // Operating Manual
    sop_attachment: "", // SOP Attachment
    machine_images: "", // Machine Images
    qr_code: "" // QR Code
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await maintenanceApi.getEquipment();
      setMachines(data);
    } catch (err: any) {
      setError(err.message || "Failed to load machine details");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (machine?: EquipmentRecord) => {
    setViewingMachine(null);
    if (machine) {
      setEditingId(machine.id);
      setFormData({
        equipment_code: machine.equipment_code || "",
        name: machine.name || "",
        asset_number: machine.asset_number || "",
        category: machine.category || "Machine Shop",
        machine_type: machine.machine_type || "",
        department_name: machine.department_name || "",
        location: machine.location || "",
        manufacturer: machine.manufacturer || "",
        model: machine.model || "",
        status: machine.status || "Operational",
        serial_number: machine.serial_number || "",
        installation_date: machine.installation_date ? machine.installation_date.slice(0, 10) : "",
        purchase_date: machine.purchase_date ? machine.purchase_date.slice(0, 10) : "",
        warranty_expiry: machine.warranty_expiry ? machine.warranty_expiry.slice(0, 10) : "",
        power_rating: machine.power_rating || "",
        capacity: machine.capacity || "",
        plc_details: machine.plc_details || "",
        operating_manual: machine.operating_manual || "",
        sop_attachment: machine.sop_attachment || "",
        machine_images: machine.machine_images || "",
        qr_code: machine.qr_code || `QR-${machine.equipment_code || Date.now()}`
      });
    } else {
      setEditingId(null);
      const autoId = `MC-${Date.now().toString().slice(-5)}`;
      setFormData({
        ...initialFormState,
        equipment_code: autoId,
        asset_number: `AST-${Date.now().toString().slice(-4)}`,
        qr_code: `QR-${autoId}`
      });
    }
    setShowModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'operating_manual' | 'sop_attachment' | 'machine_images') => {
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
        await maintenanceApi.updateEquipment(editingId, formData);
      } else {
        await maintenanceApi.createEquipment(formData);
      }
      setShowModal(false);
      loadMachines();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this machine record?")) return;
    try {
      await maintenanceApi.deleteEquipment(id);
      loadMachines();
    } catch (err: any) {
      alert(err.message || "Failed to delete machine record");
    }
  };

  const filteredMachines = machines.filter(m => {
    if (statusFilter !== "All" && m.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCode = (m.equipment_code || "").toLowerCase().includes(q);
      const matchName = (m.name || "").toLowerCase().includes(q);
      const matchAsset = (m.asset_number || "").toLowerCase().includes(q);
      const matchDept = (m.department_name || "").toLowerCase().includes(q);
      const matchLoc = (m.location || "").toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchAsset && !matchDept && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Machine Details & Directory</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Comprehensive technical profile, power rating, capacity, PLC specifications, SOPs, operating manuals & QR tracking
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
          }}
        >
          + Add Machine Details
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
          placeholder="Search by Machine ID, Name, Asset #, Dept..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "300px" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="All">All Operational Statuses</option>
          <option value="Operational">Operational</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Breakdown">Breakdown</option>
          <option value="Decommissioned">Decommissioned</option>
        </select>
      </div>

      {/* Main Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
              <th style={{ padding: "12px 16px" }}>Machine ID</th>
              <th style={{ padding: "12px 16px" }}>Machine Name</th>
              <th style={{ padding: "12px 16px" }}>Asset #</th>
              <th style={{ padding: "12px 16px" }}>Type</th>
              <th style={{ padding: "12px 16px" }}>Department</th>
              <th style={{ padding: "12px 16px" }}>Location</th>
              <th style={{ padding: "12px 16px" }}>Manufacturer / Model</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>QR Code</th>
              <th style={{ padding: "12px 16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading machine records...</td></tr>
            ) : filteredMachines.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No machine records found</td></tr>
            ) : (
              filteredMachines.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#2563eb" }}>{m.equipment_code}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1e293b" }}>{m.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#475569" }}>{m.asset_number || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>{m.machine_type || m.category}</td>
                  <td style={{ padding: "12px 16px" }}>{m.department_name || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>{m.location || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                    {m.manufacturer || "-"} {m.model ? `(${m.model})` : ""}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
                      backgroundColor: m.status === 'Operational' ? '#dcfce7' : m.status === 'Breakdown' ? '#fef2f2' : '#fef3c7',
                      color: m.status === 'Operational' ? '#166534' : m.status === 'Breakdown' ? '#991b1b' : '#92400e'
                    }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "11px", backgroundColor: "#f1f5f9", padding: "3px 6px", borderRadius: "4px" }}>
                      {m.qr_code || `QR-${m.equipment_code}`}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => setViewingMachine(m)}
                      style={{ padding: "5px 10px", marginRight: "6px", backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenModal(m)}
                      style={{ padding: "5px 10px", marginRight: "6px", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      style={{ padding: "5px 10px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
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

      {/* View Machine Modal */}
      {viewingMachine && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "12px", width: "650px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>Machine Details Specification</span>
                <h2 style={{ margin: "4px 0 0 0", fontSize: "22px", fontWeight: "700", color: "#1e293b" }}>{viewingMachine.name}</h2>
              </div>
              <button
                onClick={() => setViewingMachine(null)}
                style={{ padding: "6px 12px", border: "none", backgroundColor: "#f1f5f9", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px", fontSize: "13px" }}>
              <div><strong>Machine ID:</strong> {viewingMachine.equipment_code}</div>
              <div><strong>Asset Number:</strong> {viewingMachine.asset_number || "-"}</div>
              <div><strong>Machine Type:</strong> {viewingMachine.machine_type || viewingMachine.category}</div>
              <div><strong>Department:</strong> {viewingMachine.department_name || "-"}</div>
              <div><strong>Location:</strong> {viewingMachine.location || "-"}</div>
              <div><strong>Manufacturer:</strong> {viewingMachine.manufacturer || "-"}</div>
              <div><strong>Model:</strong> {viewingMachine.model || "-"}</div>
              <div><strong>Serial Number:</strong> {viewingMachine.serial_number || "-"}</div>
              <div><strong>Installation Date:</strong> {viewingMachine.installation_date ? viewingMachine.installation_date.slice(0, 10) : "-"}</div>
              <div><strong>Purchase Date:</strong> {viewingMachine.purchase_date ? viewingMachine.purchase_date.slice(0, 10) : "-"}</div>
              <div><strong>Warranty Expiry:</strong> {viewingMachine.warranty_expiry ? viewingMachine.warranty_expiry.slice(0, 10) : "-"}</div>
              <div><strong>Power Rating:</strong> {viewingMachine.power_rating || "-"}</div>
              <div><strong>Capacity:</strong> {viewingMachine.capacity || "-"}</div>
              <div><strong>QR Code:</strong> <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{viewingMachine.qr_code || `QR-${viewingMachine.equipment_code}`}</span></div>
            </div>

            {viewingMachine.plc_details && (
              <div style={{ marginTop: "16px" }}>
                <strong style={{ fontSize: "13px", color: "#334155" }}>PLC Details & Programming:</strong>
                <p style={{ margin: "4px 0 0 0", padding: "10px", backgroundColor: "#f1f5f9", borderRadius: "6px", fontSize: "13px" }}>{viewingMachine.plc_details}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
              {viewingMachine.operating_manual && (
                <a href={viewingMachine.operating_manual} download="Operating_Manual" style={{ padding: "8px 14px", backgroundColor: "#e0e7ff", color: "#3730a3", borderRadius: "6px", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}>
                  📄 Download Operating Manual
                </a>
              )}
              {viewingMachine.sop_attachment && (
                <a href={viewingMachine.sop_attachment} download="SOP_Attachment" style={{ padding: "8px 14px", backgroundColor: "#fef3c7", color: "#92400e", borderRadius: "6px", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}>
                  📋 Download SOP Attachment
                </a>
              )}
            </div>

            {viewingMachine.machine_images && (
              <div style={{ marginTop: "20px" }}>
                <strong style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>Machine Image Preview:</strong>
                <img src={viewingMachine.machine_images} alt="Machine" style={{ maxWidth: "100%", maxHeight: "250px", borderRadius: "8px", objectFit: "contain", border: "1px solid #e2e8f0" }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "28px", borderRadius: "12px", width: "700px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                {editingId ? "Edit Machine Details Form" : "New Machine Details Registration Form"}
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
                
                {/* Section 1: Identification */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#2563eb", textTransform: "uppercase" }}>1. Identification & Basic Info</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Machine ID *</label>
                      <input
                        type="text"
                        value={formData.equipment_code}
                        onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })}
                        required
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Asset Number *</label>
                      <input
                        type="text"
                        value={formData.asset_number}
                        onChange={(e) => setFormData({ ...formData, asset_number: e.target.value })}
                        required
                        placeholder="e.g. AST-9942"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Machine Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g. CNC Router 5-Axis"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Classification & Location */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#2563eb", textTransform: "uppercase" }}>2. Type, Department & Location</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Machine Type</label>
                      <input
                        type="text"
                        value={formData.machine_type}
                        onChange={(e) => setFormData({ ...formData, machine_type: e.target.value, category: e.target.value || "Machine Shop" })}
                        placeholder="e.g. Cutting / Milling"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Department</label>
                      <input
                        type="text"
                        value={formData.department_name}
                        onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                        placeholder="e.g. MACHINE SHOP"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Bay 3, Floor 1"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Status</label>
                      <select
                        value={formData.status}
                        onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      >
                        <option value="Operational">Operational</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                        <option value="Breakdown">Breakdown</option>
                        <option value="Decommissioned">Decommissioned</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Manufacturer & Specs */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#2563eb", textTransform: "uppercase" }}>3. Manufacturer & Technical Specifications</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Manufacturer</label>
                      <input
                        type="text"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        placeholder="e.g. Biesse / Homag"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Model</label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g. Rover K 1532"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Serial Number</label>
                      <input
                        type="text"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        placeholder="e.g. SN-8829103"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Power Rating</label>
                      <input
                        type="text"
                        value={formData.power_rating}
                        onChange={(e) => setFormData({ ...formData, power_rating: e.target.value })}
                        placeholder="e.g. 15 kW / 415V"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Capacity</label>
                      <input
                        type="text"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="e.g. 2500 RPM / 50 Pcs/Hr"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>QR Code Text</label>
                      <input
                        type="text"
                        value={formData.qr_code}
                        onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                        placeholder="e.g. QR-MC-001"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Dates & Warranty */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#2563eb", textTransform: "uppercase" }}>4. Dates & Warranty Expiry</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Purchase Date</label>
                      <input
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Installation Date</label>
                      <input
                        type="date"
                        value={formData.installation_date}
                        onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Warranty Expiry</label>
                      <input
                        type="date"
                        value={formData.warranty_expiry}
                        onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: PLC & Attachments */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#2563eb", textTransform: "uppercase" }}>5. PLC Details & Documentation</h4>
                  
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>PLC Details</label>
                    <textarea
                      value={formData.plc_details}
                      onChange={(e) => setFormData({ ...formData, plc_details: e.target.value })}
                      placeholder="Siemens S7-1200 / Allen Bradley ControlLogix, IP Address: 192.168.1.10..."
                      rows={2}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Operating Manual (PDF/Doc)</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, 'operating_manual')}
                        style={{ fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>SOP Attachment</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, 'sop_attachment')}
                        style={{ fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Machine Images</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'machine_images')}
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
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer", fontWeight: "600" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 24px", borderRadius: "6px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: "700" }}
                >
                  Save Machine Details Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
