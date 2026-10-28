import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crmApi, LeadRecord } from "../api/crmApi";

function formatLabel(str?: string | null): string {
  if (!str) return "—";
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const PRIORITY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  urgent: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  high: { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
  medium: { bg: "#fefce8", text: "#854d0e", border: "#fef08a" },
  low: { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
};

export default function LeadCommandCenterPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<LeadRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  Loading leads...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              items.map((lead) => {
                const priorityBadge = PRIORITY_BADGES[lead.priority] || PRIORITY_BADGES.low;
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
    </div>
  );
}
