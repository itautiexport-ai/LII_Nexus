import React, { useEffect, useState } from "react";
import { materialInwardApi, MaterialInwardRecord } from "../api/materialInwardApi";
import { useHasPermission } from "../../auth/hooks/usePermissions";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";

export default function MaterialInwardListPage() {
  const [records, setRecords] = useState<MaterialInwardRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selection for detailed view modal
  const [selectedRecord, setSelectedRecord] = useState<MaterialInwardRecord | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Permissions
  const canUpdate = useHasPermission("material_inward.update");
  const canDelete = useHasPermission("material_inward.delete");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [list, empList] = await Promise.all([
        materialInwardApi.list(),
        employeesApi.list().catch(() => [])
      ]);
      setRecords(list);
      setEmployees(empList);
    } catch (err: any) {
      console.error("Failed to load list", err);
      setError("Failed to fetch material inward records. Ensure you have permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "Pending" | "Inspected" | "Approved" | "Rejected") => {
    setIsUpdatingStatus(true);
    try {
      const updated = await materialInwardApi.update(id, { status: newStatus });
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord(updated);
      }
    } catch (err) {
      console.error("Update status error:", err);
      alert("Failed to update status. Ensure you are authorized.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async (id: string, inwardNo: string) => {
    if (!confirm(`Are you sure you want to delete material inward ${inwardNo}?`)) return;
    try {
      await materialInwardApi.remove(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete record.");
    }
  };


  // Filtered records
  const filteredRecords = records.filter((r) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      r.inwardNo.toLowerCase().includes(searchLower) ||
      r.materialName.toLowerCase().includes(searchLower) ||
      r.supplierName.toLowerCase().includes(searchLower) ||
      (r.invoiceChallanNo && r.invoiceChallanNo.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === "All" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getEmployeeName = (empId: string | null) => {
    if (!empId) return "Unknown";
    const emp = employees.find((e) => e.id === empId);
    return emp ? `${emp.fullName} (${emp.employeeCode})` : "System User";
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>List of Materials Inward</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Manage, inspect, and approve incoming inventory records.</p>
        </div>
        <button
          onClick={loadData}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f1f5f9",
            color: "#475569",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: 8, border: "1px solid #fee2e2", marginBottom: 20 }}>
          {error}
        </div>
      )}


      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: "#ffffff", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginBottom: 20 }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Inward No, Material, Supplier or Challan..."
            style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, backgroundColor: "#fff" }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Inspected">Inspected</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
            Loading material inward records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
            No material inward records found matching the filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "#475569" }}>Inward No</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "#475569" }}>Material Name</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "#475569" }}>Quantity</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "#475569" }}>Supplier Name</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "#475569" }}>Inward Date</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "#475569" }}>Status</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} style={{ borderBottom: "1px solid #e2e8f0", verticalAlign: "middle" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>{record.inwardNo}</td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>{record.materialName}</td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      {parseFloat(record.quantityReceived.toString()).toLocaleString()} {record.uom}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>{record.supplierName}</td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      {new Date(record.inwardDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor:
                            record.status === "Approved" ? "#dcfce7" :
                            record.status === "Pending" ? "#fef9c3" :
                            record.status === "Inspected" ? "#dbeafe" : "#fee2e2",
                          color:
                            record.status === "Approved" ? "#166534" :
                            record.status === "Pending" ? "#854d0e" :
                            record.status === "Inspected" ? "#1e40af" : "#991b1b",
                        }}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button
                          onClick={() => setSelectedRecord(record)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#f8fafc",
                            color: "#334155",
                            border: "1px solid #cbd5e1",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 500
                          }}
                        >
                          View Details
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(record.id, record.inwardNo)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "transparent",
                              color: "#ef4444",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 500
                            }}
                          >
                            Delete
                          </button>
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

      {/* Details View Modal */}
      {selectedRecord && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              maxWidth: 700,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              padding: 24,
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 16, marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Material Inward Details: {selectedRecord.inwardNo}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ backgroundColor: "transparent", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              {/* Left Column: Details */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>Information</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#64748b", display: "block" }}>Material Name</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{selectedRecord.materialName}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: "#64748b", display: "block" }}>Qty Received</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>
                      {parseFloat(selectedRecord.quantityReceived.toString()).toLocaleString()} {selectedRecord.uom}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: "#64748b", display: "block" }}>Supplier Name</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{selectedRecord.supplierName}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: "#64748b", display: "block" }}>Challan Number</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>
                      {selectedRecord.invoiceChallanNo}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: "#64748b", display: "block" }}>Received By</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{getEmployeeName(selectedRecord.receivedBy)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Driver & Photo */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>Logistics & Media</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#64748b", display: "block" }}>Vehicle & Driver</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>
                      {selectedRecord.vehicleNumber || "No Vehicle"} 
                      {selectedRecord.driverName && ` (Driver: ${selectedRecord.driverName})`}
                    </span>
                  </div>
                  {selectedRecord.driverContact && (
                    <div>
                      <span style={{ fontSize: 13, color: "#64748b", display: "block" }}>Driver Contact</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{selectedRecord.driverContact}</span>
                    </div>
                  )}
                </div>

                {selectedRecord.photoUrl ? (
                  <div>
                    <span style={{ fontSize: 13, color: "#64748b", display: "block", marginBottom: 6 }}>Product Photo</span>
                    <a href={selectedRecord.photoUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedRecord.photoUrl}
                        alt="Product Inward"
                        style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8, border: "1px solid #cbd5e1" }}
                      />
                    </a>
                  </div>
                ) : (
                  <div style={{ padding: 20, backgroundColor: "#f8fafc", color: "#94a3b8", borderRadius: 8, textAlign: "center", border: "1px dashed #cbd5e1" }}>
                    No Photo Attached
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: "#64748b", display: "block", marginBottom: 4 }}>Remarks</span>
              <p style={{ margin: 0, fontSize: 14, color: "#334155", backgroundColor: "#f8fafc", padding: 12, borderRadius: 6 }}>
                {selectedRecord.remarks || "No remarks entered."}
              </p>
            </div>

            {/* Approval Gate Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Current Status:</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{selectedRecord.status}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {canUpdate && (
                  <>
                    {selectedRecord.status === "Pending" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedRecord.id, "Inspected")}
                        disabled={isUpdatingStatus}
                        style={{ padding: "8px 14px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontWeight: 500, cursor: "pointer" }}
                      >
                        Mark Inspected
                      </button>
                    )}
                    {selectedRecord.status === "Inspected" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedRecord.id, "Approved")}
                          disabled={isUpdatingStatus}
                          style={{ padding: "8px 14px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontWeight: 500, cursor: "pointer" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedRecord.id, "Rejected")}
                          disabled={isUpdatingStatus}
                          style={{ padding: "8px 14px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontWeight: 500, cursor: "pointer" }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </>
                )}
                <button
                  onClick={() => setSelectedRecord(null)}
                  style={{ padding: "8px 14px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6, fontWeight: 500, cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
