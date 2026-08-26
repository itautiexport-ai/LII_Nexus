import React, { useEffect, useState } from "react";
import { securityCustomApi, SecurityVisitorEntryRecord } from "../api/securityCustomApi";

export default function VisitorEntryHistoryPage() {
  const [records, setRecords] = useState<SecurityVisitorEntryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await securityCustomApi.getVisitorEntries();
      setRecords(data || []);
    } catch (err: any) {
      console.error("Failed to load Visitor Entry records", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut(id: string) {
    try {
      await securityCustomApi.checkOutVisitorEntry(id);
      loadRecords();
    } catch (err: any) {
      console.error("Failed to checkout visitor", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this visitor entry?")) return;
    try {
      await securityCustomApi.deleteVisitorEntry(id);
      loadRecords();
    } catch (err: any) {
      console.error("Failed to delete visitor entry", err);
    }
  }

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.company_name && r.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.person_to_meet && r.person_to_meet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.purpose && r.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Visitor Entry History
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Dedicated repository tracking all visitor check-in/out records, host details, and entry logs.
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
          🔄 Refresh Entries
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
            placeholder="Search visitor name, company, host or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: "220px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: "#334155" }}
          >
            <option value="all">All Visitor Statuses</option>
            <option value="checked-in">Checked-In</option>
            <option value="checked-out">Checked-Out</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: "#64748b", fontSize: "14px", padding: "16px 0" }}>Loading visitor entries...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Photo</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Visitor Name</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Phone</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Company</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Person to Meet</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Purpose</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>In Time</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Out Time</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: "28px", fontStyle: "italic", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                      No visitor entry records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px" }}>
                        {r.image_url ? (
                          <img 
                            src={r.image_url} 
                            alt="Visitor" 
                            onClick={() => setSelectedPhoto(r.image_url)}
                            style={{ 
                              width: "40px", 
                              height: "40px", 
                              objectFit: "cover", 
                              borderRadius: "6px", 
                              cursor: "pointer", 
                              border: "1px solid #cbd5e1" 
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>No Photo</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>{r.visitor_name}</td>
                      <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>{r.phone || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>{r.company_name || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>{r.person_to_meet || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>{r.purpose || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#334155" }}>{new Date(r.in_time).toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#334155" }}>{r.out_time ? new Date(r.out_time).toLocaleString() : "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "14px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: r.status === "Checked-In" ? "#dbeafe" : "#f1f5f9",
                            color: r.status === "Checked-In" ? "#1d4ed8" : "#64748b",
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {r.status === "Checked-In" && (
                            <button
                              onClick={() => handleCheckOut(r.id)}
                              style={{
                                background: "#3b82f6",
                                color: "#ffffff",
                                border: "none",
                                padding: "4px 10px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              Check Out
                            </button>
                          )}
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for full photo view */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            cursor: "pointer"
          }}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
            <img 
              src={selectedPhoto} 
              alt="Visitor Full" 
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "8px", border: "4px solid #fff", boxShadow: "0 10px 25px rgba(0,0,0,0.35)" }} 
            />
            <div style={{ position: "absolute", top: "-30px", right: "0", color: "#fff", fontWeight: "bold", fontSize: "14px" }}>
              Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
