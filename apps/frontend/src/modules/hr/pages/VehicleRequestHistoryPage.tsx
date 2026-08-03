import React, { useEffect, useState } from "react";
import { vehicleRequestApi, VehicleRequestRecord } from "../api/vehicleRequestApi";

// Fleet Vehicles Master List
const FLEET_VEHICLES = [
  "PICK UP - RJ14GR6576",
  "MINI TRUCK - RJ14GF8469",
  "CNG - RJ14GN9996",
];

export default function VehicleRequestHistoryPage() {
  const [records, setRecords] = useState<VehicleRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Inline Editing Draft State per record ID
  const [draftPlans, setDraftPlans] = useState<
    Record<string, { driverName: string; vehicle: string; startTime: string; endTime: string; saving?: boolean }>
  >({});

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await vehicleRequestApi.getRequests();
      const list = data || [];
      setRecords(list);

      // Initialize draft plans for inline editing
      const drafts: Record<string, { driverName: string; vehicle: string; startTime: string; endTime: string }> = {};
      list.forEach((r) => {
        drafts[r.id] = {
          driverName: r.driver_name || "",
          vehicle: r.assigned_vehicle || FLEET_VEHICLES[0],
          startTime: r.start_time || r.travel_time || "09:00",
          endTime: r.end_time || "17:00",
        };
      });
      setDraftPlans(drafts);
    } catch (err: any) {
      console.error("Failed to load Vehicle Request records", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  function handleDraftChange(id: string, field: string, value: string) {
    setDraftPlans((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  }

  // Save Inline HR Allotment & Planning directly for a row
  async function handleSaveRowPlan(id: string) {
    const draft = draftPlans[id];
    if (!draft) return;

    setDraftPlans((prev) => ({ ...prev, [id]: { ...prev[id], saving: true } }));

    try {
      await vehicleRequestApi.updatePlanning(id, {
        driverName: draft.driverName,
        assignedVehicle: draft.vehicle,
        startTime: draft.startTime,
        endTime: draft.endTime,
        status: "Approved",
      });
      loadRecords();
    } catch (err: any) {
      console.error("Failed to save inline HR planning", err);
    } finally {
      setDraftPlans((prev) => ({ ...prev, [id]: { ...prev[id], saving: false } }));
    }
  }

  async function handleStatusChange(id: string, newStatus: 'Pending' | 'Approved' | 'Rejected' | 'Completed') {
    try {
      await vehicleRequestApi.updateStatus(id, newStatus);
      loadRecords();
    } catch (err: any) {
      console.error("Failed to update status", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this vehicle request?")) return;
    try {
      await vehicleRequestApi.deleteRequest(id);
      loadRecords();
    } catch (err: any) {
      console.error("Failed to delete request", err);
    }
  }

  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.department && r.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.driver_name && r.driver_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.assigned_vehicle && r.assigned_vehicle.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Vehicle Request History & HR Planning
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            HR Team Planning Center: Direct inline driver and vehicle allotment for each fed request.
          </p>
        </div>
        <button
          onClick={loadRecords}
          style={{
            padding: "8px 16px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🔄 Refresh Requests
        </button>
      </div>

      {/* Main Requests Table Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "24px",
        }}
      >
        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search requester, driver, vehicle, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: "240px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: "#334155" }}
          >
            <option value="all">All Request Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Table with Direct Inline Planning Controls for HR */}
        {loading ? (
          <p style={{ color: "#64748b", fontSize: "14px", padding: "16px 0" }}>Loading vehicle requests...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600", minWidth: "130px" }}>Requester Name</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600", minWidth: "110px" }}>Department</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600", minWidth: "130px" }}>Travel Date & Time</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600", minWidth: "140px" }}>Drop Location</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#0284c7", fontWeight: "700", minWidth: "160px" }}>Driver Allotted</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#0284c7", fontWeight: "700", minWidth: "210px" }}>Vehicle Allotted</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#0284c7", fontWeight: "700", minWidth: "210px" }}>Time Duration</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600", minWidth: "110px" }}>Status</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600", minWidth: "180px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "28px", fontStyle: "italic", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                      No vehicle requirement requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const draft = draftPlans[r.id] || {
                      driverName: r.driver_name || "",
                      vehicle: r.assigned_vehicle || FLEET_VEHICLES[0],
                      startTime: r.start_time || r.travel_time || "09:00",
                      endTime: r.end_time || "17:00",
                    };

                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {/* Requester */}
                        <td style={{ padding: "10px 12px", fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>{r.requester_name}</td>
                        <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>{r.department || "-"}</td>
                        <td style={{ padding: "10px 12px", fontSize: "13px", color: "#334155" }}>
                          <div>📅 {r.travel_date}</div>
                          {r.travel_time && <div style={{ fontSize: "12px", color: "#64748b" }}>🕒 {r.travel_time}</div>}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>📍 {r.destination}</td>

                        {/* INLINE DRIVER ALLOTTED INPUT */}
                        <td style={{ padding: "8px 10px" }}>
                          <input
                            type="text"
                            value={draft.driverName}
                            onChange={(e) => handleDraftChange(r.id, "driverName", e.target.value)}
                            placeholder="Enter Driver Name"
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          />
                        </td>

                        {/* INLINE VEHICLE ALLOTTED DROPDOWN */}
                        <td style={{ padding: "8px 10px" }}>
                          <select
                            value={draft.vehicle}
                            onChange={(e) => handleDraftChange(r.id, "vehicle", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              background: "#ffffff",
                              fontWeight: "500",
                            }}
                          >
                            {FLEET_VEHICLES.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* INLINE TIME DURATION INPUTS */}
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                              type="time"
                              value={draft.startTime}
                              onChange={(e) => handleDraftChange(r.id, "startTime", e.target.value)}
                              style={{ padding: "4px 6px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", width: "90px" }}
                            />
                            <span style={{ fontSize: "12px", color: "#64748b" }}>-</span>
                            <input
                              type="time"
                              value={draft.endTime}
                              onChange={(e) => handleDraftChange(r.id, "endTime", e.target.value)}
                              style={{ padding: "4px 6px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", width: "90px" }}
                            />
                          </div>
                        </td>

                        {/* STATUS */}
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background:
                                r.status === "Approved"
                                  ? "#dcfce7"
                                  : r.status === "Rejected"
                                  ? "#fee2e2"
                                  : r.status === "Completed"
                                  ? "#f1f5f9"
                                  : "#fef3c7",
                              color:
                                r.status === "Approved"
                                  ? "#166534"
                                  : r.status === "Rejected"
                                  ? "#991b1b"
                                  : r.status === "Completed"
                                  ? "#475569"
                                  : "#92400e",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                              onClick={() => handleSaveRowPlan(r.id)}
                              disabled={draft.saving}
                              style={{
                                background: draft.saving ? "#94a3b8" : "#0284c7",
                                color: "#ffffff",
                                border: "none",
                                padding: "5px 10px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: draft.saving ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              💾 Save Plan
                            </button>
                            <select
                              value={r.status}
                              onChange={(e) => handleStatusChange(r.id, e.target.value as any)}
                              style={{ padding: "4px 6px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Completed">Completed</option>
                            </select>
                            <button
                              onClick={() => handleDelete(r.id)}
                              style={{
                                background: "transparent",
                                border: "1px solid #ef4444",
                                color: "#ef4444",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
