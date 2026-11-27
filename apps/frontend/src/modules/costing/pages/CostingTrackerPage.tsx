import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi, CostingRequestItem, CostingTrackerResponse } from "../api/costingApi";

export default function CostingTrackerPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<CostingTrackerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [merchantFilter, setMerchantFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadTracker();
  }, [stageFilter, merchantFilter, dateFrom, dateTo]);

  const loadTracker = async () => {
    setLoading(true);
    try {
      const res = await costingApi.getTracker({
        search: search.trim() || undefined,
        stage: stageFilter !== "ALL" ? stageFilter : undefined,
        merchant: merchantFilter !== "ALL" ? merchantFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setData(res);
    } catch (err) {
      console.error("Failed to load costing tracker data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTracker();
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "Approved":
        return (
          <span style={{ padding: "4px 10px", borderRadius: 12, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span>✅</span> Approved
          </span>
        );
      case "In Review":
        return (
          <span style={{ padding: "4px 10px", borderRadius: 12, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span>⏳</span> Under Review
          </span>
        );
      case "In Progress":
        return (
          <span style={{ padding: "4px 10px", borderRadius: 12, background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span>🛠️</span> In Progress (Draft)
          </span>
        );
      case "Rejected":
        return (
          <span style={{ padding: "4px 10px", borderRadius: 12, background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span>❌</span> Rejected
          </span>
        );
      default:
        return (
          <span style={{ padding: "4px 10px", borderRadius: 12, background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span>⏸️</span> Not Started
          </span>
        );
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) return "Just now";
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    }
    return `${diffDays} days ago`;
  };

  const kpis = data?.kpis || {
    total_requests: 0,
    not_started_count: 0,
    under_process_count: 0,
    approved_count: 0,
    rejected_count: 0,
  };

  const items = data?.items || [];

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", color: "#1f2937" }}>
      {/* Top Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>⏱️</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#111827" }}>
            Costing Tracker
          </h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        {/* Total */}
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Total Costing Requests</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginTop: 4 }}>
            {kpis.total_requests}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>All product items</div>
        </div>

        {/* Not Started */}
        <div
          onClick={() => setStageFilter("Pending")}
          style={{
            background: stageFilter === "Pending" ? "#f1f5f9" : "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: 16,
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>⏳ Not Started</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#334155", marginTop: 4 }}>
            {kpis.not_started_count}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Costing not yet begun</div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setStageFilter("In Progress")}
          style={{
            background: stageFilter === "In Progress" || stageFilter === "In Review" ? "#eff6ff" : "#ffffff",
            border: "1px solid #93c5fd",
            borderRadius: 8,
            padding: 16,
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8" }}>🛠️ In Progress</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#2563eb", marginTop: 4 }}>
            {kpis.under_process_count}
          </div>
          <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 2 }}>In progress or under review</div>
        </div>

        {/* Approved */}
        <div
          onClick={() => setStageFilter("Approved")}
          style={{
            background: stageFilter === "Approved" ? "#f0fdf4" : "#ffffff",
            border: "1px solid #86efac",
            borderRadius: 8,
            padding: 16,
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>✅ Approved</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
            {kpis.approved_count}
          </div>
          <div style={{ fontSize: 11, color: "#166534", marginTop: 2 }}>Costing approved & ready</div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStageFilter("Rejected")}
          style={{
            background: stageFilter === "Rejected" ? "#fef2f2" : "#ffffff",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: 16,
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#b91c1c" }}>❌ Rejected</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>
            {kpis.rejected_count}
          </div>
          <div style={{ fontSize: 11, color: "#991b1b", marginTop: 2 }}>Costing sheet rejected</div>
        </div>
      </div>

      {/* Filter and Date Range Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, flex: "1 1 300px", maxWidth: 440 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search costing code, buyer code, product, merchant..."
            style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🔍 Search
          </button>
        </form>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginRight: 6 }}>Stage:</label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, fontWeight: 600 }}
            >
              <option value="ALL">All Stages</option>
              <option value="Pending">⏳ Not Started</option>
              <option value="In Progress">🛠️ In Progress</option>
              <option value="In Review">⏳ Under Review</option>
              <option value="Approved">✅ Approved</option>
              <option value="Rejected">❌ Rejected</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginRight: 6 }}>Date Range:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, marginRight: 6 }}
            />
            <span style={{ fontSize: 12, color: "#9ca3af", marginRight: 6 }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 }}
            />
          </div>

          {(search || stageFilter !== "ALL" || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStageFilter("ALL");
                setDateFrom("");
                setDateTo("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Tracker Table */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table data-no-enhance="true" style={{ width: "100%", minWidth: 1260, borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Costing Code</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Buyer Code</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Product Details</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Merchant (Requested By)</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Requested Date</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Approved Date</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Current Stage</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Quotation Price</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Sheet</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                  Loading costing tracker data...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>No costing records in tracker</div>
                  <p style={{ margin: "4px 0 16px 0", fontSize: 13 }}>Submit costing requests to track their live status here.</p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {/* Costing Code */}
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "#dcfce7",
                        color: "#166534",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {item.costing_code || item.product_code || "—"}
                    </span>
                  </td>

                  {/* Buyer Code */}
                  <td style={{ padding: "12px 16px" }}>
                    {item.buyer_code ? (
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          background: "#ede9fe",
                          color: "#6d28d9",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {item.buyer_code}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>—</span>
                    )}
                  </td>

                  {/* Product Details */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb" }}
                          onError={(e) => ((e.target as any).style.display = "none")}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 6,
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                          }}
                        >
                          🪑
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>
                          {item.product_name}
                        </div>
                        {item.product_type && (
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {item.product_type}
                          </div>
                        )}
                        {item.client_name && (
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            Client: {item.client_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Merchant */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#1f2937" }}>{item.merchant_name}</div>
                  </td>

                  {/* Requested Date */}
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 600, color: "#374151" }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} ({getTimeAgo(item.created_at)})
                    </div>
                  </td>

                  {/* Approved Date */}
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {item.stage === "Approved" && (item.approved_at || item.updated_at) ? (
                      (() => {
                        const approvedDateStr = item.approved_at || item.updated_at;
                        const appDate = new Date(approvedDateStr);
                        const reqDate = item.created_at ? new Date(item.created_at) : null;
                        const diffDays = reqDate ? Math.max(0, Math.floor((appDate.getTime() - reqDate.getTime()) / (1000 * 60 * 60 * 24))) : null;
                        return (
                          <div>
                            <div style={{ fontWeight: 700, color: "#15803d" }}>
                              {appDate.toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                              {appDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {diffDays !== null && (
                                <span style={{ color: "#16a34a", fontWeight: 600 }}>
                                  {" "}({diffDays === 0 ? "Same day" : `${diffDays}d`})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                    )}
                  </td>

                  {/* Current Stage */}
                  <td style={{ padding: "12px 16px" }}>
                    {getStageBadge(item.stage)}
                  </td>

                  {/* Quotation Price (Latest Buyer Quote if mentioned, else latest estimation final price) */}
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {item.latest_buyer_quote && item.latest_buyer_quote.amount > 0 ? (
                      (() => {
                        const q = item.latest_buyer_quote!;
                        const rate = q.usd_rate && q.usd_rate > 0 ? q.usd_rate : 86.5;
                        const symMap: Record<string, string> = {
                          USD: "$",
                          INR: "₹",
                          EUR: "€",
                          GBP: "£",
                          AED: "AED ",
                          AUD: "A$",
                          CAD: "C$",
                        };
                        const sym = symMap[q.currency] || `${q.currency} `;
                        const inrVal = q.currency === "INR" ? q.amount : q.currency === "USD" ? q.amount * rate : null;
                        const usdVal = q.currency === "USD" ? q.amount : q.currency === "INR" ? q.amount / rate : null;
                        return (
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>
                              {sym}{q.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {q.currency === "USD" && inrVal !== null && (
                              <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginTop: 2 }}>
                                ₹{inrVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                            {q.currency === "INR" && usdVal !== null && (
                              <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginTop: 2 }}>
                                ${usdVal.toFixed(2)}
                              </div>
                            )}
                            <div style={{ fontSize: 10, color: "#6d28d9", fontWeight: 700, marginTop: 2 }}>
                              {q.label}
                            </div>
                          </div>
                        );
                      })()
                    ) : item.final_price ? (
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>
                          ₹{Number(item.final_price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {item.estimation_number && (
                          <span style={{ display: "block", fontSize: 11, color: "#6b7280" }}>
                            {item.estimation_number}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: 12 }}>Pending Costing</span>
                    )}
                  </td>

                  {/* Sheet (View Costing - Read-Only Sheet) */}
                  <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      disabled={!item.estimation_id}
                      onClick={() => {
                        if (item.estimation_id) {
                          navigate(`/admin/costing/detail/${item.estimation_id}?readonly=true`);
                        }
                      }}
                      title={item.estimation_id ? "View complete read-only costing sheet" : "Costing sheet not yet created"}
                      style={{
                        padding: "6px 12px",
                        background: item.estimation_id ? "#ffffff" : "#f3f4f6",
                        color: item.estimation_id ? "#2563eb" : "#9ca3af",
                        border: item.estimation_id ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: item.estimation_id ? "pointer" : "not-allowed",
                        whiteSpace: "nowrap",
                      }}
                    >
                      👁️ View Costing
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

