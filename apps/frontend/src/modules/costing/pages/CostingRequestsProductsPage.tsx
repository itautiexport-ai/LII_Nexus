import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { costingApi, CostingRequestItem, isDirectorApprover, parseItemImageUrls } from "../api/costingApi";
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
  const [galleryModal, setGalleryModal] = useState<{ title: string; urls: string[]; index: number } | null>(null);

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
      productCode: item.costing_code || item.product_code || "",
      buyerCode: item.buyer_code || "",
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
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>✅ Approved</span>;
      case "In Review":
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>⏳ Under Review</span>;
      case "In Progress":
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>🛠️ In Progress</span>;
      case "Rejected":
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>❌ Rejected</span>;
      default:
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>⏳ Not Started</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Urgent":
        return <span style={{ padding: "3px 8px", borderRadius: 4, background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>🔴 Urgent</span>;
      case "High":
        return <span style={{ padding: "3px 8px", borderRadius: 4, background: "#ffedd5", color: "#c2410c", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>🟠 High</span>;
      default:
        return <span style={{ padding: "3px 8px", borderRadius: 4, background: "#f0fdf4", color: "#166534", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>🟢 Normal</span>;
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
            placeholder="Search by costing code, buyer code, product name, merchant..."
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
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table data-no-enhance="true" style={{ width: "100%", minWidth: 1260, borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Costing Code</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Buyer Code</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Product Info</th>
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
                <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                  Loading costing request items...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
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
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "#dcfce7",
                        color: "#166534",
                        fontWeight: 800,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        display: "inline-block",
                      }}
                    >
                      {item.costing_code || item.product_code || "—"}
                    </span>
                  </td>

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

                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {(() => {
                        const photos = parseItemImageUrls(item);
                        if (photos.length === 0) {
                          return (
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
                          );
                        }
                        return (
                          <div
                            onClick={() => setGalleryModal({ title: item.product_name, urls: photos, index: 0 })}
                            style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                            title={photos.length > 1 ? `Click to view all ${photos.length} photos` : "Click to enlarge"}
                          >
                            <img
                              src={photos[0]}
                              alt=""
                              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb" }}
                              onError={(e) => ((e.target as any).style.display = "none")}
                            />
                            {photos.length > 1 && (
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: -4,
                                  right: -4,
                                  background: "#2563eb",
                                  color: "#ffffff",
                                  fontSize: 9,
                                  fontWeight: 800,
                                  padding: "1px 5px",
                                  borderRadius: 8,
                                }}
                              >
                                +{photos.length - 1}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>
                          {item.product_name}
                        </div>
                        {item.product_type && (
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                            {item.product_type}
                          </div>
                        )}
                        {item.overall_size && (
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                            Size: {item.overall_size}
                          </div>
                        )}
                      </div>
                    </div>
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

                  {/* Approved Price (Latest Buyer Quote if mentioned, else Approved USD & INR) */}
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {item.stage === "Approved" ? (
                      item.latest_buyer_quote && item.latest_buyer_quote.amount > 0 ? (
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
                              <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>
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
                      ) : (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>
                            ${(item.final_price_usd ? Number(item.final_price_usd) : Number(item.final_price || 0) / 86.5).toFixed(2)}
                          </div>
                          <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginTop: 2 }}>
                            ₹{Number(item.final_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      )
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
                    )}
                  </td>

                  <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "nowrap" }}>
                      {/* Director Approval Action (Ravi Utmani / Raj Utmani / System Admin only) */}
                      {canApprove && (item.stage === "In Review" || item.stage === "In Progress") && (
                        <button
                          type="button"
                          onClick={() => handleQuickApprove(item)}
                          title="Director Approval"
                          style={{
                            padding: "6px 10px",
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
                            whiteSpace: "nowrap",
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
                            whiteSpace: "nowrap",
                          }}
                        >
                          ❌ Reject
                        </button>
                      )}

                      {/* Do Costing Action */}
                      <button
                        type="button"
                        onClick={() => handleDoCosting(item)}
                        style={{
                          padding: "6px 12px",
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ⚡ Do Costing
                      </button>

                      {/* Edit Costing Action */}
                      <button
                        type="button"
                        disabled={!item.estimation_id}
                        onClick={() => {
                          if (item.estimation_id) {
                            navigate(`/admin/costing/edit/${item.estimation_id}?requestId=${item.id}`);
                          }
                        }}
                        title={item.estimation_id ? "Edit saved costing sheet" : "Do Costing first to enable editing"}
                        style={{
                          padding: "6px 12px",
                          background: item.estimation_id ? "#fffbeb" : "#f3f4f6",
                          color: item.estimation_id ? "#b45309" : "#9ca3af",
                          border: item.estimation_id ? "1px solid #fcd34d" : "1px solid #e5e7eb",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: item.estimation_id ? "pointer" : "not-allowed",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✏️ Edit Costing
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

      {/* Multi-Angle Photo Gallery Modal */}
      {galleryModal && (
        <div
          onClick={() => setGalleryModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.72)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 20,
              maxWidth: 680,
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>
                {galleryModal.title} ({galleryModal.index + 1} / {galleryModal.urls.length})
              </div>
              <button
                type="button"
                onClick={() => setGalleryModal(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", borderRadius: 8, overflow: "hidden", minHeight: 340, maxHeight: 480 }}>
              <img
                src={galleryModal.urls[galleryModal.index]}
                alt=""
                style={{ maxWidth: "100%", maxHeight: 460, objectFit: "contain" }}
              />
            </div>
            {galleryModal.urls.length > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() =>
                    setGalleryModal((prev) =>
                      prev ? { ...prev, index: (prev.index - 1 + prev.urls.length) % prev.urls.length } : null
                    )
                  }
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                >
                  ◀ Previous
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>
                  Photo {galleryModal.index + 1} of {galleryModal.urls.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setGalleryModal((prev) =>
                      prev ? { ...prev, index: (prev.index + 1) % prev.urls.length } : null
                    )
                  }
                  style={{ padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

