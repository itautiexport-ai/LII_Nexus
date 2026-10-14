import React, { useEffect, useState } from "react";
import { securityCustomApi, SecurityVisitorEntryRecord } from "../api/securityCustomApi";
import { useIsAdmin } from "../../auth/hooks/usePermissions";
import { formatIndianDateTime } from "../../../shared/utils/dateUtils";
import { useNavigate } from "react-router-dom";

export default function VisitorEntryHistoryPage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [records, setRecords] = useState<SecurityVisitorEntryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<"card" | "table">(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "card" : "table"));

  useEffect(() => {
    loadRecords();
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: isMobile ? "12px" : "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: "12px", marginBottom: "16px" }}>
        <div>
          <button
            onClick={() => navigate("/admin/hr/security/visitor-entry")}
            style={{
              marginBottom: "10px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            + New Visitor Entry / फॉर्म भरें
          </button>
          <h1 style={{ fontSize: isMobile ? "19px" : "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Visitor Entry History
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
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
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            alignSelf: isMobile ? "stretch" : "flex-start",
            minHeight: "38px",
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
          padding: isMobile ? "12px" : "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Mobile View Toggle */}
        {isMobile && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: viewMode === "card" ? "#2563eb" : "#cbd5e1",
                background: viewMode === "card" ? "#eff6ff" : "#ffffff",
                color: viewMode === "card" ? "#2563eb" : "#475569",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              📱 Card View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: viewMode === "table" ? "#2563eb" : "#cbd5e1",
                background: viewMode === "table" ? "#eff6ff" : "#ffffff",
                color: viewMode === "table" ? "#2563eb" : "#475569",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              📊 Table View
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexDirection: isMobile ? "column" : "row" }}>
          <input
            type="text"
            placeholder="Search visitor name, company, host or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: isMobile ? "100%" : "220px", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: "#334155", minWidth: isMobile ? "100%" : "180px", boxSizing: "border-box" }}
          >
            <option value="all">All Visitor Statuses</option>
            <option value="checked-in">Checked-In</option>
            <option value="checked-out">Checked-Out</option>
          </select>
        </div>

        {/* Records Content */}
        {loading ? (
          <p style={{ color: "#64748b", fontSize: "14px", padding: "16px 0" }}>Loading visitor entries...</p>
        ) : isMobile && viewMode === "card" ? (
          /* Mobile Card View */
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredRecords.length === 0 ? (
              <div style={{ padding: "28px", fontStyle: "italic", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                No visitor entry records found.
              </div>
            ) : (
              filteredRecords.map((r) => (
                <div
                  key={r.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "14px",
                    background: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* Top Row: Visitor Photo + Name + Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt="Visitor"
                          onClick={() => setSelectedPhoto(r.image_url)}
                          style={{
                            width: "48px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            cursor: "pointer",
                            border: "1px solid #cbd5e1",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "8px",
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            flexShrink: 0,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          👤
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#0f172a" }}>
                          {r.visitor_name}
                        </div>
                        {r.phone ? (
                          <a
                            href={`tel:${r.phone}`}
                            style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "500" }}
                          >
                            📞 {r.phone}
                          </a>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>No phone</span>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "700",
                        background: r.status === "Checked-In" ? "#dbeafe" : "#f1f5f9",
                        color: r.status === "Checked-In" ? "#1d4ed8" : "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.status}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px", background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "11px", display: "block", fontWeight: "600" }}>COMPANY</span>
                      <span style={{ fontWeight: "600", color: "#334155" }}>{r.company_name || "-"}</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "11px", display: "block", fontWeight: "600" }}>PERSON TO MEET</span>
                      <span style={{ fontWeight: "600", color: "#334155" }}>{r.person_to_meet || "-"}</span>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <span style={{ color: "#64748b", fontSize: "11px", display: "block", fontWeight: "600" }}>PURPOSE</span>
                      <span style={{ color: "#334155" }}>{r.purpose || "-"}</span>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "12px" }}>
                    <div style={{ color: "#166534", fontWeight: "500" }}>
                      📥 <strong>In Time:</strong> {formatIndianDateTime(r.in_time)}
                    </div>
                    <div style={{ color: r.out_time ? "#475569" : "#d97706", fontWeight: "500" }}>
                      📤 <strong>Out Time:</strong> {r.out_time ? formatIndianDateTime(r.out_time) : "Still Inside"}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                    {r.status === "Checked-In" && (
                      <button
                        type="button"
                        onClick={() => handleCheckOut(r.id)}
                        style={{
                          flex: 1,
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          padding: "10px 16px",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          minHeight: "44px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        ✓ Check Out Visitor
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        style={{
                          background: "#fef2f2",
                          border: "1px solid #ef4444",
                          color: "#ef4444",
                          padding: "10px 14px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          minHeight: "44px",
                        }}
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Desktop / Responsive Table View */
          <div style={{ overflowX: "auto" }}>
            <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
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
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#334155" }}>{formatIndianDateTime(r.in_time)}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#334155" }}>{formatIndianDateTime(r.out_time)}</td>
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
                          {isAdmin && (
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
                          )}
                          {!isAdmin && r.status !== "Checked-In" && (
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>-</span>
                          )}
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
