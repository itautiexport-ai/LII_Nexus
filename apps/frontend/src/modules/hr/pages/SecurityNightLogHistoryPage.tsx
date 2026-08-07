import React, { useEffect, useState } from "react";
import { securityCustomApi, SecurityNightFormRecord } from "../api/securityCustomApi";

export default function SecurityNightLogHistoryPage() {
  const [records, setRecords] = useState<SecurityNightFormRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeImageModal, setActiveImageModal] = useState<{ url: string; time: string; location: string } | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await securityCustomApi.getNightForms();
      setRecords(data || []);
    } catch (err: any) {
      console.error("Failed to load Security Night Log records", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this Night Log entry?")) return;
    try {
      await securityCustomApi.deleteNightForm(id);
      loadRecords();
    } catch (err: any) {
      console.error("Failed to delete record", err);
    }
  }

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.guard_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.gate_location && r.gate_location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.observations && r.observations.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === "all" || r.patrol_status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Security Night Log History
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Dedicated history log repository for all submitted security night patrol logs and verified photo captures.
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
          🔄 Refresh Logs
        </button>
      </div>

      {/* Main Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search guard name, location or observations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: "220px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: "#334155" }}
          >
            <option value="all">All Patrol Statuses</option>
            <option value="normal">Normal</option>
            <option value="minor issue">Minor Issue</option>
            <option value="major alert">Major Alert</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: "#64748b", fontSize: "14px", padding: "16px 0" }}>Loading history logs...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Verified Photo</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Real-Time Capture</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Guard Name</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Shift Date</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Location</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Patrol Status</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Observations</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Remarks</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "28px", fontStyle: "italic", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                      No Security Night Log entries found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* Photo Thumbnail */}
                      <td style={{ padding: "10px 12px" }}>
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt="Captured"
                            onClick={() =>
                              setActiveImageModal({
                                url: r.image_url!,
                                time: r.photo_captured_at ? new Date(r.photo_captured_at).toLocaleString() : new Date(r.created_at).toLocaleString(),
                                location: r.gate_location || "N/A",
                              })
                            }
                            style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "6px", cursor: "pointer", border: "1px solid #cbd5e1" }}
                          />
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>No Photo</span>
                        )}
                      </td>

                      {/* Real-Time Stamp */}
                      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#0369a1", fontWeight: "600" }}>
                        {r.photo_captured_at ? (
                          <span>🕒 {new Date(r.photo_captured_at).toLocaleString()}</span>
                        ) : (
                          <span style={{ color: "#64748b" }}>{new Date(r.created_at).toLocaleString()}</span>
                        )}
                      </td>

                      <td style={{ padding: "10px 12px", fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>{r.guard_name}</td>
                      <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>{r.shift_date}</td>
                      <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>{r.gate_location || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "14px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: r.patrol_status === "Normal" ? "#dcfce7" : "#fee2e2",
                            color: r.patrol_status === "Normal" ? "#166534" : "#991b1b",
                          }}
                        >
                          {r.patrol_status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>{r.observations || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>{r.remarks || "-"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <button
                          onClick={() => handleDelete(r.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #ef4444",
                            color: "#ef4444",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
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
        )}
      </div>

      {/* Full Screen Image Modal */}
      {activeImageModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setActiveImageModal(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "520px",
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#0f172a" }}>
              🔒 Verified Security Guard Photo
            </h3>
            <img
              src={activeImageModal.url}
              alt="Full Size"
              style={{ width: "100%", maxHeight: "380px", objectFit: "contain", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
            <div style={{ marginTop: "12px", fontSize: "13px", color: "#334155", textAlign: "left" }}>
              <div><strong>Location:</strong> {activeImageModal.location}</div>
              <div><strong>Verified Captured Time:</strong> 🕒 {activeImageModal.time}</div>
            </div>
            <button
              onClick={() => setActiveImageModal(null)}
              style={{
                marginTop: "16px",
                padding: "6px 18px",
                background: "#475569",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
