import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crmApi, LeadRecord, LeadMessage, LeadStatus } from "../api/crmApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

function formatLabel(str?: string | null): string {
  if (!str) return "—";
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PRIORITY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  urgent: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  high: { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
  medium: { bg: "#fefce8", text: "#854d0e", border: "#fef08a" },
  low: { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; border: string }> = {
  active: { label: "Active", bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  won: { label: "Won", bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
  lost: { label: "Lost", bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  dead: { label: "Dead", bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
  dormant: { label: "Dormant", bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
};

export default function LeadCommandCenterPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const [items, setItems] = useState<LeadRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Status updating indicator
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Remarks Modal State
  const [remarksModalLead, setRemarksModalLead] = useState<LeadRecord | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);

  // Chat Drawer / Modal State
  const [chatModalLead, setChatModalLead] = useState<LeadRecord | null>(null);
  const [chatMessages, setChatMessages] = useState<LeadMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [senderRole, setSenderRole] = useState<"management" | "merchant">("management");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await crmApi.list({
        page: String(page),
        pageSize: String(pageSize),
        search: search.trim() || undefined,
      });
      setItems(res.items || []);
      setTotal(res.totalItems || 0);
    } catch (err) {
      console.error("Failed to load Lead Command Center leads:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Handle direct Status dropdown change
  async function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    setUpdatingStatusId(leadId);
    try {
      await crmApi.update(leadId, { status: newStatus });
      setItems((prev) =>
        prev.map((item) => (item.id === leadId ? { ...item, status: newStatus } : item))
      );
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(err?.response?.data?.error?.message || "Failed to update status.");
      load();
    } finally {
      setUpdatingStatusId(null);
    }
  }

  // Handle Remarks Modal Open & Save
  function openRemarksModal(lead: LeadRecord) {
    setRemarksModalLead(lead);
    setRemarkText(lead.managementRemarks || lead.followUpRemarks || "");
  }

  async function handleSaveRemarks() {
    if (!remarksModalLead) return;
    setSavingRemark(true);
    try {
      const text = remarkText.trim();
      await crmApi.update(remarksModalLead.id, {
        managementRemarks: text || null,
        followUpRemarks: text || null,
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === remarksModalLead.id
            ? { ...item, managementRemarks: text || null, followUpRemarks: text || null }
            : item
        )
      );
      setRemarksModalLead(null);
    } catch (err: any) {
      console.error("Failed to update remarks:", err);
      alert(err?.response?.data?.error?.message || "Failed to update remarks.");
    } finally {
      setSavingRemark(false);
    }
  }

  // Handle Chat Drawer Open & Messages
  async function openChatModal(lead: LeadRecord) {
    setChatModalLead(lead);
    setChatLoading(true);
    setChatInput("");

    // Determine initial sender role based on user designation
    const desig = (currentUser?.designation || "").toLowerCase();
    const isMerchant = desig.includes("merchant") || desig.includes("executive");
    setSenderRole(isMerchant ? "merchant" : "management");

    try {
      const msgs = await crmApi.listMessages(lead.id);
      setChatMessages(msgs || []);
    } catch (err: any) {
      console.error("Failed to load chat messages:", err);
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  }

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatModalLead && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatModalLead]);

  // Send Chat Message
  async function handleSendChatMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chatModalLead || !chatInput.trim() || sendingChat) return;

    const text = chatInput.trim();
    setSendingChat(true);

    try {
      const newMsg = await crmApi.addMessage(chatModalLead.id, {
        message: text,
        senderRole,
        senderName: currentUser?.fullName || (senderRole === "management" ? "Management" : "Merchant"),
        messageType: "chat",
      });

      setChatMessages((prev) => [...prev, newMsg]);
      setChatInput("");

      // Update remarks display in the table
      setItems((prev) =>
        prev.map((item) =>
          item.id === chatModalLead.id
            ? {
                ...item,
                managementRemarks: senderRole === "management" ? text : item.managementRemarks,
                merchantUpdate: senderRole === "merchant" ? text : item.merchantUpdate,
              }
            : item
        )
      );
    } catch (err: any) {
      console.error("Failed to send message:", err);
      alert(err?.response?.data?.error?.message || "Failed to send message.");
    } finally {
      setSendingChat(false);
    }
  }

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto", background: "#fff" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Lead Command Center</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#2563eb",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "2px 8px",
                borderRadius: 12,
              }}
            >
              {total} Total
            </span>
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
            Operational overview of leads with essential contact and ownership details.
          </p>
        </div>

        {/* Search & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search ID, customer, company, country, merchant..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: 320,
                padding: "7px 12px",
                fontSize: 13,
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                outline: "none",
                background: "#f8fafc",
              }}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => load()}
            title="Refresh"
            style={{
              padding: "7px 14px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#334155",
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          overflowX: "auto",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Lead ID
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Customer Name
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Company Name
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Country
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Source
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Merchant
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Priority
              </th>
              {/* Option 1: Status */}
              <th
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Status
              </th>
              {/* Option 2: Remarks */}
              <th
                data-no-filter="true"
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Remarks
              </th>
              {/* Option 3: Chat */}
              <th
                data-no-filter="true"
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  textAlign: "center",
                }}
              >
                Chat
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ padding: "40px 16px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  Loading leads...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: "40px 16px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              items.map((lead) => {
                const priorityBadge = PRIORITY_BADGES[lead.priority] || PRIORITY_BADGES.low;
                const statusMeta = STATUS_CONFIG[lead.status] || STATUS_CONFIG.active;
                const activeRemarks = lead.managementRemarks || lead.followUpRemarks;

                return (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* 1. Lead ID */}
                    <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>
                      <span
                        style={{
                          color: "#2563eb",
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                      >
                        {lead.leadCode || lead.id.slice(0, 8)}
                      </span>
                    </td>

                    {/* 2. Customer Name */}
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#1e293b", fontWeight: 500 }}>
                      {lead.contactName || "—"}
                    </td>

                    {/* 3. Company Name */}
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155" }}>
                      {lead.companyName || "—"}
                    </td>

                    {/* 4. Country */}
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>
                      {lead.country || "—"}
                    </td>

                    {/* 5. Source */}
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#334155" }}>
                      <span>{formatLabel(lead.leadSource)}</span>
                      {lead.leadSource === "trade_fair" && lead.tradeFairName && (
                        <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>
                          ({lead.tradeFairName})
                        </span>
                      )}
                    </td>

                    {/* 6. Merchant */}
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#1e293b" }}>
                      {lead.merchantName ? (
                        <span style={{ fontWeight: 500, color: "#0f172a" }}>{lead.merchantName}</span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Unassigned</span>
                      )}
                    </td>

                    {/* 7. Priority */}
                    <td style={{ padding: "12px 14px", fontSize: 12 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          backgroundColor: priorityBadge.bg,
                          color: priorityBadge.text,
                          border: `1px solid ${priorityBadge.border}`,
                        }}
                      >
                        {lead.priority || "low"}
                      </span>
                    </td>

                    {/* 8. Status Dropdown */}
                    <td
                      style={{ padding: "10px 14px", whiteSpace: "nowrap" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={lead.status}
                        disabled={updatingStatusId === lead.id}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: `1px solid ${statusMeta.border}`,
                          backgroundColor: statusMeta.bg,
                          color: statusMeta.text,
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                          outline: "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="dead">Dead</option>
                        <option value="dormant">Dormant</option>
                      </select>
                    </td>

                    {/* 9. Remarks & Update */}
                    <td
                      style={{ padding: "10px 14px", minWidth: 180, maxWidth: 240 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div
                          title={activeRemarks || "No remarks added yet"}
                          style={{
                            fontSize: 12,
                            color: activeRemarks ? "#334155" : "#94a3b8",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            fontStyle: activeRemarks ? "normal" : "italic",
                          }}
                        >
                          {activeRemarks || "No remarks"}
                        </div>
                        <button
                          type="button"
                          onClick={() => openRemarksModal(lead)}
                          title="Update Remarks"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 4,
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#334155",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e2e8f0";
                            e.currentTarget.style.borderColor = "#94a3b8";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                            e.currentTarget.style.borderColor = "#cbd5e1";
                          }}
                        >
                          ✏️ Update
                        </button>
                      </div>
                    </td>

                    {/* 10. Chat */}
                    <td
                      style={{ padding: "10px 14px", whiteSpace: "nowrap", textAlign: "center" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openChatModal(lead)}
                        title="View chat history & communicate"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 6,
                          border: "1px solid #c7d2fe",
                          background: "#eef2ff",
                          color: "#4338ca",
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(67, 56, 202, 0.08)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e0e7ff";
                          e.currentTarget.style.borderColor = "#818cf8";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#eef2ff";
                          e.currentTarget.style.borderColor = "#c7d2fe";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        💬 Chat
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Showing {items.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, total)} of {total} leads
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              background: "#fff",
              color: "#334155",
            }}
          >
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              background: page <= 1 ? "#f1f5f9" : "#fff",
              color: page <= 1 ? "#94a3b8" : "#334155",
              cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>

          <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              background: page >= totalPages ? "#f1f5f9" : "#fff",
              color: page >= totalPages ? "#94a3b8" : "#334155",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Remarks Modal */}
      {remarksModalLead && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setRemarksModalLead(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  Update Remarks
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  {remarksModalLead.leadCode || "Lead"} • {remarksModalLead.contactName}
                  {remarksModalLead.companyName ? ` (${remarksModalLead.companyName})` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRemarksModalLead(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Management / Lead Remarks
              </label>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter remarks or updates regarding this lead..."
                rows={4}
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 13,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>💡</span>
                <span>Saving remarks will also record a management note in the lead chat history.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                backgroundColor: "#f8fafc",
              }}
            >
              <button
                type="button"
                onClick={() => setRemarksModalLead(null)}
                style={{
                  padding: "7px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingRemark}
                onClick={handleSaveRemarks}
                style={{
                  padding: "7px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  background: savingRemark ? "#93c5fd" : "#2563eb",
                  color: "#fff",
                  cursor: savingRemark ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 2px rgba(37, 99, 235, 0.15)",
                }}
              >
                {savingRemark ? "Saving..." : "Save Remarks"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Slide-Over Drawer */}
      {chatModalLead && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 1100,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setChatModalLead(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              height: "100%",
              background: "#fff",
              boxShadow: "-8px 0 25px rgba(0, 0, 0, 0.12)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>💬</span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                    Lead Discussion & Chat
                  </h3>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#2563eb",
                      background: "#eff6ff",
                      padding: "1px 6px",
                      borderRadius: 4,
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    {chatModalLead.leadCode || chatModalLead.id.slice(0, 8)}
                  </span>
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                  <strong>{chatModalLead.contactName}</strong>
                  {chatModalLead.companyName ? ` • ${chatModalLead.companyName}` : ""}
                  {chatModalLead.country ? ` (${chatModalLead.country})` : ""}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setChatModalLead(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 4,
                  lineHeight: 1,
                  borderRadius: 4,
                }}
                title="Close Chat"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages Container */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 20px",
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {chatLoading ? (
                <div style={{ margin: "auto", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  <div style={{ marginBottom: 8, fontSize: 22 }}>⏳</div>
                  Loading chat history...
                </div>
              ) : chatMessages.length === 0 ? (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: "#64748b",
                    padding: "40px 20px",
                    maxWidth: 320,
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                  <div style={{ fontWeight: 600, color: "#334155", fontSize: 14, marginBottom: 4 }}>
                    No messages yet
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Start the discussion below. Send messages, merchant updates, or management instructions for this lead.
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isManagement = msg.senderRole === "management";
                  const isSystem = msg.senderRole === "system" || msg.messageType === "stage_change";
                  const isRemark = msg.messageType === "management_remark";
                  const isMerchantUpdate = msg.messageType === "merchant_update";

                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        style={{
                          textAlign: "center",
                          margin: "6px 0",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: 11,
                            backgroundColor: "#e2e8f0",
                            color: "#475569",
                            fontWeight: 500,
                          }}
                        >
                          🔄 {msg.message} • {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  }

                  if (isRemark) {
                    return (
                      <div
                        key={msg.id}
                        style={{
                          backgroundColor: "#faf5ff",
                          border: "1px solid #e9d5ff",
                          borderLeft: "4px solid #a855f7",
                          borderRadius: 8,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12 }}>📌</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#7e22ce" }}>
                              Management Remark
                            </span>
                            <span style={{ fontSize: 11, color: "#9333ea" }}>by {msg.senderName}</span>
                          </div>
                          <span style={{ fontSize: 10, color: "#a855f7" }}>
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "#3b0764", whiteSpace: "pre-wrap" }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  if (isMerchantUpdate) {
                    return (
                      <div
                        key={msg.id}
                        style={{
                          backgroundColor: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          borderLeft: "4px solid #10b981",
                          borderRadius: 8,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12 }}>📝</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#065f46" }}>
                              Merchant Update
                            </span>
                            <span style={{ fontSize: 11, color: "#047857" }}>by {msg.senderName}</span>
                          </div>
                          <span style={{ fontSize: 10, color: "#059669" }}>
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "#064e3b", whiteSpace: "pre-wrap" }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isManagement ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 3,
                          padding: "0 4px",
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>
                          {msg.senderName}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 10,
                            fontWeight: 600,
                            backgroundColor: isManagement ? "#ede9fe" : "#dcfce7",
                            color: isManagement ? "#6d28d9" : "#15803d",
                          }}
                        >
                          {isManagement ? "Management" : "Merchant"}
                        </span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
                      <div
                        style={{
                          maxWidth: "85%",
                          backgroundColor: isManagement ? "#4f46e5" : "#ffffff",
                          color: isManagement ? "#ffffff" : "#1e293b",
                          padding: "9px 13px",
                          borderRadius: isManagement ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                          border: isManagement ? "none" : "1px solid #e2e8f0",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          fontSize: 13,
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <form
              onSubmit={handleSendChatMessage}
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #e2e8f0",
                backgroundColor: "#fff",
              }}
            >
              {/* Role Indicator / Selector */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Sending as:</span>
                  <button
                    type="button"
                    onClick={() => setSenderRole("management")}
                    style={{
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 4,
                      border: "1px solid",
                      cursor: "pointer",
                      borderColor: senderRole === "management" ? "#818cf8" : "#cbd5e1",
                      backgroundColor: senderRole === "management" ? "#eef2ff" : "#fff",
                      color: senderRole === "management" ? "#4338ca" : "#64748b",
                    }}
                  >
                    👔 Management
                  </button>
                  <button
                    type="button"
                    onClick={() => setSenderRole("merchant")}
                    style={{
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 4,
                      border: "1px solid",
                      cursor: "pointer",
                      borderColor: senderRole === "merchant" ? "#86efac" : "#cbd5e1",
                      backgroundColor: senderRole === "merchant" ? "#f0fdf4" : "#fff",
                      color: senderRole === "merchant" ? "#166534" : "#64748b",
                    }}
                  >
                    💼 Merchant
                  </button>
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Press Enter to send</span>
              </div>

              {/* Textarea & Send button */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  placeholder="Type a message or note... (Shift+Enter for new line)"
                  rows={2}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: 13,
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingChat}
                  style={{
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: "none",
                    background: !chatInput.trim() || sendingChat ? "#94a3b8" : "#4f46e5",
                    color: "#fff",
                    cursor: !chatInput.trim() || sendingChat ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    height: 52,
                    boxShadow: "0 1px 2px rgba(79, 70, 229, 0.2)",
                  }}
                >
                  {sendingChat ? "..." : "➤ Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
