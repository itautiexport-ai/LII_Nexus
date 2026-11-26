import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi, CostEstimation } from "../api/costingApi";

interface ParsedBuyerQuote {
  label: string;
  currency: string;
  amount: number;
  note?: string;
}

interface QuoteHistoryRow {
  estimation: CostEstimation;
  buyerCode: string;
  buyerName: string;
  imageUrls: string[];
  usdRate: number;
  quotes: ParsedBuyerQuote[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  AUD: "A$",
  CAD: "C$",
};

function getOrdinalLabel(num: number): string {
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th Quote`;
  switch (num % 10) {
    case 1:
      return `${num}st Quote`;
    case 2:
      return `${num}nd Quote`;
    case 3:
      return `${num}rd Quote`;
    default:
      return `${num}th Quote`;
  }
}

export default function BuyerQuotesHistoryPage() {
  const navigate = useNavigate();
  const [estimations, setEstimations] = useState<CostEstimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [galleryModal, setGalleryModal] = useState<{ title: string; urls: string[]; index: number } | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const list = await costingApi.getAllEstimations();
      setEstimations(list || []);
    } catch (err) {
      console.error("Failed to load buyer quotes history:", err);
    } finally {
      setLoading(false);
    }
  };

  const historyRows = useMemo<QuoteHistoryRow[]>(() => {
    const rows: QuoteHistoryRow[] = [];
    estimations.forEach((est) => {
      let fd: any = null;
      if (est.form_data) {
        try {
          fd = typeof est.form_data === "string" ? JSON.parse(est.form_data) : est.form_data;
        } catch {
          fd = null;
        }
      }

      const rawQuotes = Array.isArray(fd?.buyerQuotes) ? fd.buyerQuotes : [];
      const parsedQuotes: ParsedBuyerQuote[] = [];
      rawQuotes.forEach((q: any, idx: number) => {
        const amt = Number(q?.amount);
        if (q && q.amount !== "" && q.amount !== null && q.amount !== undefined && Number.isFinite(amt) && amt > 0) {
          parsedQuotes.push({
            label: getOrdinalLabel(idx + 1),
            currency: (q.currency || "USD").toUpperCase(),
            amount: amt,
            note: q.note || "",
          });
        }
      });

      // Only show estimations where at least 1 quote was recorded
      if (parsedQuotes.length === 0) return;

      const photos: string[] = [];
      if (Array.isArray(fd?.imageUrls)) {
        fd.imageUrls.forEach((u: any) => {
          if (typeof u === "string" && u.trim()) photos.push(u.trim());
        });
      }
      if (photos.length === 0 && typeof fd?.imageUrl === "string" && fd.imageUrl.trim()) {
        photos.push(fd.imageUrl.trim());
      }

      rows.push({
        estimation: est,
        buyerCode: fd?.buyerCode || "",
        buyerName: est.client_name || "",
        imageUrls: photos,
        usdRate: Number(fd?.usdExchangeRate) > 0 ? Number(fd.usdExchangeRate) : 86.5,
        quotes: parsedQuotes,
      });
    });

    return rows;
  }, [estimations]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return historyRows;
    const q = search.trim().toLowerCase();
    return historyRows.filter((row) => {
      const est = row.estimation;
      const matchQuotes = row.quotes.some(
        (bq) =>
          bq.label.toLowerCase().includes(q) ||
          (bq.note || "").toLowerCase().includes(q) ||
          String(bq.amount).includes(q)
      );
      const matchMeta =
        (est.product_code || "").toLowerCase().includes(q) ||
        (row.buyerCode || "").toLowerCase().includes(q) ||
        (row.buyerName || "").toLowerCase().includes(q) ||
        (est.product_name || est.title || "").toLowerCase().includes(q);
      return matchQuotes || matchMeta;
    });
  }, [historyRows, search]);

  // Dynamic quote columns: expands automatically to however many quotes are entered (1st, 2nd, 3rd, 4th, 5th...)
  const maxQuoteColumns = useMemo(() => {
    let maxLen = 1;
    filteredRows.forEach((r) => {
      if (r.quotes.length > maxLen) maxLen = r.quotes.length;
    });
    return maxLen;
  }, [filteredRows]);

  const quoteColumnIndices = useMemo(
    () => Array.from({ length: maxQuoteColumns }, (_, i) => i),
    [maxQuoteColumns]
  );

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", color: "#1f2937" }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>💬</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#111827" }}>
            Buyer's Quote History
          </h1>
        </div>
        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
          Total Records: <strong style={{ color: "#0f172a" }}>{filteredRows.length}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by costing code, buyer code, buyer name, product, or quote..."
          style={{ flex: "1 1 320px", maxWidth: 480, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{ background: "none", border: "none", color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Buyer's Quote History Table */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table
          data-no-enhance="true"
          style={{
            width: "100%",
            minWidth: 780 + maxQuoteColumns * 160,
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Product Image</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Costing Code</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Buyer Code</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Buyer Name</th>
              {quoteColumnIndices.map((idx) => (
                <th key={`qh-${idx}`} style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>
                  {getOrdinalLabel(idx + 1)}
                </th>
              ))}
              <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5 + maxQuoteColumns} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                  Loading buyer's quote history...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5 + maxQuoteColumns} style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>No buyer quotes recorded yet</div>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13 }}>
                    Quotes entered in the Costing Sheet (1st Quote, 2nd Quote, etc.) will automatically record here.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rIdx) => {
                const est = row.estimation;
                const prodTitle = est.product_name || est.title || "Product";
                return (
                  <tr key={est.id} style={{ borderBottom: "1px solid #f1f5f9", background: rIdx % 2 === 0 ? "#ffffff" : "#fbfcfe" }}>
                    {/* Product Image + Name */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {row.imageUrls.length > 0 ? (
                          <div
                            onClick={() => setGalleryModal({ title: prodTitle, urls: row.imageUrls, index: 0 })}
                            style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                            title={row.imageUrls.length > 1 ? `Click to view all ${row.imageUrls.length} photos` : "Click to enlarge"}
                          >
                            <img
                              src={row.imageUrls[0]}
                              alt={prodTitle}
                              style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" }}
                              onError={(e) => ((e.target as any).style.display = "none")}
                            />
                            {row.imageUrls.length > 1 && (
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
                                +{row.imageUrls.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 6,
                              background: "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 20,
                              color: "#94a3b8",
                              flexShrink: 0,
                            }}
                          >
                            🪑
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{prodTitle}</div>
                          {est.product_type && (
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{est.product_type}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Costing Code */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: "#dcfce7",
                          color: "#166534",
                          fontWeight: 800,
                          fontSize: 13,
                          display: "inline-block",
                        }}
                      >
                        {est.product_code || est.estimation_number || "—"}
                      </span>
                    </td>

                    {/* Buyer Code */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      {row.buyerCode ? (
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "#ede9fe",
                            color: "#6d28d9",
                            fontWeight: 700,
                            fontSize: 12,
                            display: "inline-block",
                          }}
                        >
                          {row.buyerCode}
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>—</span>
                      )}
                    </td>

                    {/* Buyer Name */}
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
                      {row.buyerName || "—"}
                    </td>

                    {/* 1st Quote, 2nd Quote, 3rd Quote... */}
                    {quoteColumnIndices.map((qIdx) => {
                      const bq = row.quotes[qIdx];
                      const isLatest = bq && qIdx === row.quotes.length - 1;
                      if (!bq) {
                        return (
                          <td key={`${est.id}-qc-${qIdx}`} style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                            —
                          </td>
                        );
                      }
                      const sym = CURRENCY_SYMBOLS[bq.currency] || `${bq.currency} `;
                      return (
                        <td key={`${est.id}-qc-${qIdx}`} style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <div
                            style={{
                              display: "inline-block",
                              padding: "6px 10px",
                              borderRadius: 6,
                              background: isLatest ? "#f0fdf4" : "#f8fafc",
                              border: isLatest ? "1.5px solid #86efac" : "1px solid #e2e8f0",
                            }}
                          >
                            <div style={{ fontSize: 14, fontWeight: 800, color: isLatest ? "#16a34a" : "#0f172a" }}>
                              {sym}{bq.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {bq.currency === "USD" && (
                              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                                ₹{(bq.amount * row.usdRate).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                            {bq.note && (
                              <div style={{ fontSize: 11, color: "#475569", marginTop: 2, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }} title={bq.note}>
                                {bq.note}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Action */}
                    <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/costing/detail/${est.id}`)}
                          style={{
                            padding: "6px 10px",
                            background: "#ffffff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          👁️ View
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/costing/edit/${est.id}`)}
                          style={{
                            padding: "6px 10px",
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          ✏️ Edit
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
