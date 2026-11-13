import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi, CostEstimation } from "../api/costingApi";

export default function CostEstimationsListPage() {
  const navigate = useNavigate();
  const [estimations, setEstimations] = useState<CostEstimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Chat Modal State
  const [activeChatEst, setActiveChatEst] = useState<CostEstimation | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    loadEstimations();
  }, [search, statusFilter]);

  const loadEstimations = async () => {
    setLoading(true);
    try {
      const data = await costingApi.getAllEstimations(search, statusFilter);
      setEstimations(data);
    } catch (err) {
      console.error("Failed to load estimations list", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'Draft' | 'In Review' | 'Approved' | 'Rejected') => {
    try {
      await costingApi.updateEstimation(id, { status: newStatus });
      setEstimations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete costing for "${name}"?`)) return;
    try {
      await costingApi.deleteEstimation(id);
      loadEstimations();
    } catch (err) {
      alert("Failed to delete costing sheet");
    }
  };

  const handleSendChatMessage = async () => {
    if (!activeChatEst || !chatMessage.trim()) return;
    setChatSending(true);
    try {
      const timestamp = new Date().toLocaleString("en-IN", {
        dateStyle: "short",
        timeStyle: "short",
      });
      const formattedEntry = `[${timestamp}] ${chatMessage.trim()}`;
      const updatedNotes = activeChatEst.notes
        ? `${activeChatEst.notes}\n${formattedEntry}`
        : formattedEntry;

      await costingApi.updateEstimation(activeChatEst.id, { notes: updatedNotes });

      const updatedEst = { ...activeChatEst, notes: updatedNotes };
      setActiveChatEst(updatedEst);
      setEstimations((prev) =>
        prev.map((item) => (item.id === activeChatEst.id ? updatedEst : item))
      );
      setChatMessage("");
    } catch (err) {
      alert("Failed to send message");
    } finally {
      setChatSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <span style={{ padding: "4px 10px", borderRadius: 6, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700, border: "1px solid #86efac" }}>
            ✅ Approved
          </span>
        );
      case "In Review":
        return (
          <span style={{ padding: "4px 10px", borderRadius: 6, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700, border: "1px solid #fde68a" }}>
            ⏳ Pending Approval
          </span>
        );
      case "Rejected":
        return (
          <span style={{ padding: "4px 10px", borderRadius: 6, background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 700, border: "1px solid #fca5a5" }}>
            ❌ Rejected
          </span>
        );
      default:
        return (
          <span style={{ padding: "4px 10px", borderRadius: 6, background: "#f3f4f6", color: "#374151", fontSize: 12, fontWeight: 600, border: "1px solid #e5e7eb" }}>
            Draft
          </span>
        );
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            List of New Costing
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0", fontSize: 14 }}>
            Review, approve, and track all submitted product cost estimations
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/costing/new")}
          style={{
            padding: "10px 18px",
            background: "#2563eb",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            color: "#ffffff",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          + Create New Costing
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, background: "#ffffff", padding: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <input
          type="text"
          placeholder="Search by Product Code, Product Name, Buyer Name, or Type of Costing..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            background: "#ffffff",
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="In Review">Pending Approval (In Review)</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Datatable */}
      <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 0, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading costing sheets...</div>
        ) : estimations.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
            No costing sheets found. Click "+ Create New Costing" to start a new sheet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#475569", width: "140px" }}>Product Code</th>
                <th style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Product Name</th>
                <th style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Buyer Name</th>
                <th style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Type of Costing</th>
                <th style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#475569", width: "130px" }}>Status</th>
                <th style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#475569", width: "300px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {estimations.map((est) => {
                const isApproved = est.status === "Approved";
                const isRejected = est.status === "Rejected";
                const isInReview = est.status === "In Review";

                // Entire row color logic:
                // Approved = full green row
                // Rejected = full red row
                // In Review = soft amber row
                // Draft = clean white
                const rowBackground = isApproved
                  ? "#ecfdf5"
                  : isRejected
                  ? "#fef2f2"
                  : isInReview
                  ? "#fffbeb"
                  : "#ffffff";

                const rowBorderColor = isApproved
                  ? "#a7f3d0"
                  : isRejected
                  ? "#fecaca"
                  : isInReview
                  ? "#fde68a"
                  : "#f1f5f9";

                const leftBorder = isApproved
                  ? "6px solid #10b981"
                  : isRejected
                  ? "6px solid #ef4444"
                  : isInReview
                  ? "6px solid #f59e0b"
                  : "6px solid transparent";

                return (
                  <tr
                    key={est.id}
                    style={{
                      background: rowBackground,
                      borderBottom: `1px solid ${rowBorderColor}`,
                      borderLeft: leftBorder,
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    {/* 1. Product Code */}
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>
                      <span style={{ background: isApproved ? "#d1fae5" : isRejected ? "#fee2e2" : "#f1f5f9", padding: "4px 8px", borderRadius: 4, fontSize: 13 }}>
                        {est.product_code || "—"}
                      </span>
                    </td>

                    {/* 2. Product Name */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                        {est.product_name || est.title}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                        {est.product_type && (
                          <span style={{ fontSize: 11, background: "#e0e7ff", color: "#3730a3", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                            {est.product_type}
                          </span>
                        )}
                        {est.collection_name && (
                          <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>
                            {est.collection_name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Buyer Name */}
                    <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600, fontSize: 13 }}>
                      {est.client_name ? (
                        <span>👤 {est.client_name}</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>

                    {/* 4. Type of Costing */}
                    <td style={{ padding: "14px 16px" }}>
                      {est.type_of_costing ? (
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            background:
                              est.type_of_costing === "Showroom Based"
                                ? "#fce7f3"
                                : "#dbeafe",
                            color:
                              est.type_of_costing === "Showroom Based"
                                ? "#9d174d"
                                : "#1e40af",
                            border:
                              est.type_of_costing === "Showroom Based"
                                ? "1px solid #fbcfe8"
                                : "1px solid #bfdbfe",
                          }}
                        >
                          {est.type_of_costing}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>

                    {/* 5. Status Badge */}
                    <td style={{ padding: "14px 16px" }}>
                      {getStatusBadge(est.status)}
                    </td>

                    {/* 6. Actions: View button, Approve/Reject dropdown, Chat button */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {/* View Button -> Opens complete costing form */}
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/costing/edit/${est.id}`)}
                          title="View & edit complete costing sheet"
                          style={{
                            padding: "6px 12px",
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          }}
                        >
                          👁️ View
                        </button>

                        {/* Approve / Reject Dropdown */}
                        <select
                          data-no-enhance="true"
                          value={est.status || "Draft"}
                          onChange={(e) => handleStatusChange(est.id, e.target.value as any)}
                          title="Change costing status"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            outline: "none",
                            background: isApproved
                              ? "#10b981"
                              : isRejected
                              ? "#ef4444"
                              : isInReview
                              ? "#f59e0b"
                              : "#ffffff",
                            color: isApproved || isRejected || isInReview ? "#ffffff" : "#374151",
                            border: isApproved
                              ? "1.5px solid #059669"
                              : isRejected
                              ? "1.5px solid #dc2626"
                              : isInReview
                              ? "1.5px solid #d97706"
                              : "1.5px solid #cbd5e1",
                          }}
                        >
                          <option value="Draft" style={{ background: "#ffffff", color: "#374151" }}>Draft</option>
                          <option value="In Review" style={{ background: "#ffffff", color: "#b45309" }}>⏳ Pending</option>
                          <option value="Approved" style={{ background: "#ffffff", color: "#15803d" }}>✅ Approved</option>
                          <option value="Rejected" style={{ background: "#ffffff", color: "#b91c1c" }}>❌ Rejected</option>
                        </select>

                        {/* Chat Button */}
                        <button
                          type="button"
                          onClick={() => setActiveChatEst(est)}
                          title="Approval chat & discussion"
                          style={{
                            padding: "6px 12px",
                            background: "#8b5cf6",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          }}
                        >
                          💬 Chat
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(est.id, est.product_name || est.product_code || est.estimation_number)}
                          title="Delete costing sheet"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: "4px 6px",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Chat & Discussion Modal */}
      {activeChatEst && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setActiveChatEst(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 580,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                  💬 Approval Chat & Remarks
                </h3>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {activeChatEst.product_name || activeChatEst.title} {activeChatEst.product_code ? `(${activeChatEst.product_code})` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveChatEst(null)}
                style={{ background: "none", border: "none", fontSize: 20, color: "#64748b", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {/* Chat Body (Messages) */}
            <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "#f8fafc" }}>
              {activeChatEst.notes ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeChatEst.notes.split("\n").filter(Boolean).map((line, idx) => {
                    const isSystemOrTagged = line.startsWith("[");
                    return (
                      <div
                        key={idx}
                        style={{
                          background: isSystemOrTagged ? "#ffffff" : "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          padding: "10px 14px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                          {line}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>No approval messages yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Write a message below to communicate regarding approval, rate clarifications, or specifications.
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Footer */}
            <div style={{ padding: 16, background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Type a message or note for approval..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  disabled={chatSending || !chatMessage.trim()}
                  onClick={handleSendChatMessage}
                  style={{
                    padding: "10px 18px",
                    background: chatMessage.trim() ? "#8b5cf6" : "#cbd5e1",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: chatMessage.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  {chatSending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
