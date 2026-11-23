import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { costingApi, CostingRequestItem, isDirectorApprover } from "../api/costingApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

export default function CostingRequestsProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const bunchCodeParam = searchParams.get("bunchCode") || "";

  const user = useAuthStore((s) => s.user);
  const canApprove = isDirectorApprover(user);

  const [items, setItems] = useState<CostingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    loadItems();
  }, [stageFilter, priorityFilter, bunchCodeParam]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await costingApi.getRequestItems({
        search: search.trim() || undefined,
        stage: stageFilter !== "ALL" ? stageFilter : undefined,
        priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
        bunchCode: bunchCodeParam || undefined,
      });
      setItems(data || []);
    } catch (err) {
      console.error("Failed to load costing request items:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  const handleDoCosting = (item: CostingRequestItem) => {
    const params = new URLSearchParams({
      requestId: item.id,
      bunchCode: item.bunch_code,
      productCode: item.product_code,
      productName: item.product_name,
      clientName: item.client_name || "",
      woodType: item.wood_type || "",
      overallSize: item.overall_size || "",
      productType: item.product_type || "",
      collectionName: item.collection_name || "",
      merchantName: item.merchant_name || "",
    });
    navigate(`/admin/costing/new?${params.toString()}`);
  };

  const handleQuickApprove = async (item: CostingRequestItem) => {
    if (!window.confirm(`Are you sure you want to approve costing for ${item.product_code} (${item.product_name})?`)) return;
    try {
      await costingApi.updateRequestItemStage(item.id, { stage: "Approved" });
      alert(`Costing for ${item.product_code} has been approved!`);
      loadItems();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to approve costing.");
    }
  };

  const handleQuickReject = async (item: CostingRequestItem) => {
    const reason = window.prompt(`Enter rejection reason for ${item.product_code}:`);
    if (reason === null) return;
    try {
      await costingApi.updateRequestItemStage(item.id, { stage: "Rejected" });
      alert(`Costing for ${item.product_code} has been rejected.`);
      loadItems();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to reject costing.");
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "Approved":
        return <span style={{ padding: "4px 8px", borderRadius: 12, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700 }}>✅ Approved</span>;
      case "In Review":
        return <span style={{ padding: "4px 8px", borderRadius: 12, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700 }}>⏳ Under Review</span>;
      case "In Progress":
        return <span style={{ padding: "4px 8px", borderRadius: 12, background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 700 }}>🛠️ In Progress</span>;
      case "Rejected":
        return <span style={{ padding: "4px 8px", borderRadius: 12, background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 700 }}>❌ Rejected</span>;
      default:
        return <span style={{ padding: "4px 8px", borderRadius: 12, background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 700 }}>⏳ Not Started</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Urgent":
        return <span style={{ padding: "3px 8px", borderRadius: 4, background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 700 }}>🔴 Urgent</span>;
      case "High":
        return <span style={{ padding: "3px 8px", borderRadius: 4, background: "#ffedd5", color: "#c2410c", fontSize: 11, fontWeight: 700 }}>🟠 High</span>;
      default:
        return <span style={{ padding: "3px 8px", borderRadius: 4, background: "#f0fdf4", color: "#166534", fontSize: 11, fontWeight: 700 }}>🟢 Normal</span>;
    }
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", color: "#1f2937" }}>
      {/* Top Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>📋</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#111827" }}>
            SKU Wise Costing
          </h1>
        </div>
        <p style={{ margin: "4px 0 0 38px", fontSize: 14, color: "#6b7280" }}>
          List of all individual product SKUs for costing. Click "Do Costing" to start or edit estimation.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, flex: "1 1 320px", maxWidth: 500 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, code, bunch, merchant..."
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
          {bunchCodeParam && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#ede9fe",
                color: "#4f46e5",
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <span>Batch: {bunchCodeParam}</span>
              <button
                type="button"
                onClick={() => {
                  searchParams.delete("bunchCode");
                  setSearchParams(searchParams);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#4f46e5",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 13,
                  padding: 0,
                  lineHeight: 1,
                }}
                title="Clear batch filter"
              >
                ✕
              </button>
            </div>
          )}

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
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginRight: 6 }}>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, fontWeight: 600 }}
            >
              <option value="ALL">All Priorities</option>
              <option value="Normal">🟢 Normal</option>
              <option value="High">🟠 High</option>
              <option value="Urgent">🔴 Urgent</option>
            </select>
          </div>

          {(search || stageFilter !== "ALL" || priorityFilter !== "ALL" || bunchCodeParam) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStageFilter("ALL");
                setPriorityFilter("ALL");
                if (bunchCodeParam) {
                  searchParams.delete("bunchCode");
                  setSearchParams(searchParams);
                }
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
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Product Info</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Bunch Code</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Merchant</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Client</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Requested Date</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Priority</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Stage</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Approved Price</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                  Loading costing request items...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>No costing requests found</div>
                  <p style={{ margin: "4px 0 16px 0", fontSize: 13 }}>Merchants can submit new product costing requests from the Request Center.</p>
                  <button
                    onClick={() => navigate("/admin/costing/request-center")}
                    style={{
                      padding: "8px 16px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Create First Request
                  </button>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb" }}
                          onError={(e) => ((e.target as any).style.display = "none")}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 6,
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            color: "#94a3b8",
                          }}
                        >
                          🪑
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>
                          {item.product_name}
                        </div>
                        <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, marginTop: 2 }}>
                          {item.product_code}
                          {item.product_type && <span style={{ color: "#6b7280", fontWeight: 400 }}> • {item.product_type}</span>}
                        </div>
                        {item.overall_size && (
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                            Size: {item.overall_size}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
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
                      {item.bunch_code}
                    </span>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#374151" }}>{item.merchant_name}</div>
                  </td>

                  <td style={{ padding: "12px 16px", color: "#6b7280" }}>
                    {item.client_name || "—"}
                  </td>

                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 12 }}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    <span style={{ display: "block", fontSize: 11, color: "#9ca3af" }}>
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    {getPriorityBadge(item.priority)}
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    {getStageBadge(item.stage)}
                  </td>

                  {/* Approved Price (USD and INR) */}
                  <td style={{ padding: "12px 16px" }}>
                    {item.stage === "Approved" ? (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>
                          ${(item.final_price_usd ? Number(item.final_price_usd) : Number(item.final_price || 0) / 86.5).toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginTop: 2 }}>
                          ₹{Number(item.final_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
                    )}
                  </td>

                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                      {/* Director Approval Action (Ravi Utmani / Raj Utmani only) */}
                      {canApprove && (item.stage === "In Review" || item.stage === "In Progress") && (
                        <button
                          type="button"
                          onClick={() => handleQuickApprove(item)}
                          title="Director Approval"
                          style={{
                            padding: "6px 12px",
                            background: "#16a34a",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            boxShadow: "0 1px 2px rgba(22, 163, 74, 0.2)",
                          }}
                        >
                          ✅ Approve
                        </button>
                      )}

                      {canApprove && item.stage === "In Review" && (
                        <button
                          type="button"
                          onClick={() => handleQuickReject(item)}
                          style={{
                            padding: "6px 10px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            border: "1px solid #fca5a5",
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          ❌ Reject
                        </button>
                      )}

                      {/* Do Costing / Edit Costing Action */}
                      <button
                        type="button"
                        onClick={() => handleDoCosting(item)}
                        style={{
                          padding: "6px 14px",
                          background: item.stage === "Approved" ? "#f3f4f6" : "#2563eb",
                          color: item.stage === "Approved" ? "#374151" : "#ffffff",
                          border: item.stage === "Approved" ? "1px solid #d1d5db" : "none",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        {item.estimation_id ? "✏️ Edit Costing" : "⚡ Do Costing"}
                      </button>

                      {item.estimation_id && (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/costing/detail/${item.estimation_id}`)}
                          style={{
                            padding: "6px 10px",
                            background: "#ffffff",
                            color: "#059669",
                            border: "1px solid #a7f3d0",
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          👁️ View Sheet
                        </button>
                      )}
                    </div>
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

