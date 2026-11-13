import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export interface CurrencyRateRecord {
  id: string;
  currencyCode: string;
  currencyName: string;
  symbol: string;
  rateToInr: number;
  isDefaultUsd?: boolean;
  status: "active" | "inactive";
  updatedAt?: string;
}

export const DEFAULT_CURRENCY_RATES: CurrencyRateRecord[] = [
  {
    id: "curr-usd",
    currencyCode: "USD",
    currencyName: "US Dollar",
    symbol: "$",
    rateToInr: 86.5,
    isDefaultUsd: true,
    status: "active",
    updatedAt: "2026-11-05",
  },
  {
    id: "curr-eur",
    currencyCode: "EUR",
    currencyName: "Euro",
    symbol: "€",
    rateToInr: 94.0,
    status: "active",
    updatedAt: "2026-11-05",
  },
  {
    id: "curr-gbp",
    currencyCode: "GBP",
    currencyName: "British Pound",
    symbol: "£",
    rateToInr: 110.0,
    status: "active",
    updatedAt: "2026-11-05",
  },
  {
    id: "curr-aed",
    currencyCode: "AED",
    currencyName: "UAE Dirham",
    symbol: "AED ",
    rateToInr: 23.55,
    status: "active",
    updatedAt: "2026-11-05",
  },
  {
    id: "curr-aud",
    currencyCode: "AUD",
    currencyName: "Australian Dollar",
    symbol: "A$",
    rateToInr: 56.5,
    status: "active",
    updatedAt: "2026-11-05",
  },
  {
    id: "curr-cad",
    currencyCode: "CAD",
    currencyName: "Canadian Dollar",
    symbol: "C$",
    rateToInr: 63.0,
    status: "active",
    updatedAt: "2026-11-05",
  },
  {
    id: "curr-sgd",
    currencyCode: "SGD",
    currencyName: "Singapore Dollar",
    symbol: "S$",
    rateToInr: 65.0,
    status: "active",
    updatedAt: "2026-11-05",
  },
  {
    id: "curr-sar",
    currencyCode: "SAR",
    currencyName: "Saudi Riyal",
    symbol: "SAR ",
    rateToInr: 23.0,
    status: "active",
    updatedAt: "2026-11-05",
  },
  {
    id: "curr-jpy",
    currencyCode: "JPY",
    currencyName: "Japanese Yen",
    symbol: "¥",
    rateToInr: 0.58,
    status: "active",
    updatedAt: "2026-11-05",
  },
];

export const LOCAL_STORAGE_KEY = "nexus_currency_rates";

export function getLocalCurrencyRates(): CurrencyRateRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: any) => ({
          id: String(c.id || `curr-${Date.now()}`),
          currencyCode: String(c.currencyCode || "USD").toUpperCase(),
          currencyName: String(c.currencyName || c.currencyCode || "Currency"),
          symbol: String(c.symbol || "$"),
          rateToInr: Number(c.rateToInr) || 1,
          isDefaultUsd: Boolean(c.isDefaultUsd || c.currencyCode === "USD"),
          status: c.status === "inactive" ? "inactive" : "active",
          updatedAt: c.updatedAt || new Date().toISOString().split("T")[0],
        }));
      }
    }
  } catch (e) {
    console.error("Failed to read local currency rates", e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_CURRENCY_RATES));
  return DEFAULT_CURRENCY_RATES;
}

export function saveLocalCurrencyRates(rates: CurrencyRateRecord[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rates));
}

export function getLocalUsdRate(): number {
  const all = getLocalCurrencyRates();
  const usd = all.find((c) => c.currencyCode === "USD" || c.isDefaultUsd);
  return usd && usd.rateToInr > 0 ? usd.rateToInr : 86.5;
}

export function getLocalCurrencyMap(): Record<string, number> {
  const all = getLocalCurrencyRates();
  const map: Record<string, number> = {};
  for (const c of all) {
    if (c.status !== "inactive") {
      map[c.currencyCode] = c.rateToInr;
    }
  }
  if (!map["USD"]) map["USD"] = 86.5;
  return map;
}

export default function CurrencyRatesMasterPage() {
  const [rates, setRates] = useState<CurrencyRateRecord[]>(() => getLocalCurrencyRates());
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [currencyName, setCurrencyName] = useState("US Dollar");
  const [symbol, setSymbol] = useState("$");
  const [rateToInr, setRateToInr] = useState<number | "">(86.5);
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Direct quick update state for USD
  const usdRecord = rates.find((r) => r.currencyCode === "USD") || rates[0];
  const [quickUsdRate, setQuickUsdRate] = useState<number | "">(usdRecord ? usdRecord.rateToInr : 86.5);
  const [quickSavedMsg, setQuickSavedMsg] = useState(false);

  useEffect(() => {
    const list = getLocalCurrencyRates();
    setRates(list);
    const u = list.find((r) => r.currencyCode === "USD");
    if (u) setQuickUsdRate(u.rateToInr);
  }, []);

  const handleQuickSaveUsd = () => {
    const num = Number(quickUsdRate);
    if (!num || num <= 0) {
      alert("Please enter a valid positive exchange rate for USD");
      return;
    }
    const updated = rates.map((r) =>
      r.currencyCode === "USD"
        ? { ...r, rateToInr: num, updatedAt: new Date().toISOString().split("T")[0] }
        : r
    );
    setRates(updated);
    saveLocalCurrencyRates(updated);
    setQuickSavedMsg(true);
    setTimeout(() => setQuickSavedMsg(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = currencyCode.trim().toUpperCase();
    if (!cleanCode) {
      alert("Please enter Currency Code (e.g. USD, EUR)");
      return;
    }
    const num = Number(rateToInr);
    if (!num || num <= 0) {
      alert("Please enter a valid positive exchange rate to INR");
      return;
    }

    if (editingId) {
      const updated = rates.map((r) =>
        r.id === editingId
          ? {
              ...r,
              currencyCode: cleanCode,
              currencyName: currencyName.trim() || cleanCode,
              symbol: symbol.trim() || cleanCode,
              rateToInr: num,
              status,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : r
      );
      setRates(updated);
      saveLocalCurrencyRates(updated);
      if (cleanCode === "USD") setQuickUsdRate(num);
      alert(`Currency ${cleanCode} updated successfully!`);
    } else {
      const existing = rates.find((r) => r.currencyCode === cleanCode);
      if (existing) {
        alert(`Currency ${cleanCode} already exists in master. Please edit the existing entry.`);
        return;
      }
      const newRecord: CurrencyRateRecord = {
        id: `curr-${Date.now()}`,
        currencyCode: cleanCode,
        currencyName: currencyName.trim() || cleanCode,
        symbol: symbol.trim() || cleanCode,
        rateToInr: num,
        status,
        isDefaultUsd: cleanCode === "USD",
        updatedAt: new Date().toISOString().split("T")[0],
      };
      const updated = [newRecord, ...rates];
      setRates(updated);
      saveLocalCurrencyRates(updated);
      if (cleanCode === "USD") setQuickUsdRate(num);
      alert(`Currency ${cleanCode} added successfully!`);
    }

    handleCancelEdit();
  };

  const handleEdit = (item: CurrencyRateRecord) => {
    setEditingId(item.id);
    setCurrencyCode(item.currencyCode);
    setCurrencyName(item.currencyName);
    setSymbol(item.symbol);
    setRateToInr(item.rateToInr);
    setStatus(item.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string, code: string) => {
    if (code === "USD") {
      alert("USD is the base reference currency for Costing and cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${code} rate?`)) return;
    const updated = rates.filter((r) => r.id !== id);
    setRates(updated);
    saveLocalCurrencyRates(updated);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCurrencyCode("");
    setCurrencyName("");
    setSymbol("");
    setRateToInr("");
    setStatus("active");
  };

  const filteredRates = rates.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.currencyCode.toLowerCase().includes(q) ||
      r.currencyName.toLowerCase().includes(q) ||
      r.symbol.toLowerCase().includes(q) ||
      r.rateToInr.toString().includes(q)
    );
  });

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1150, margin: "0 auto" }}>
      {/* Navigation Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 10 }}>
          <Link
            to="/admin/master-data/costing"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            &larr; Back to Costing Master
          </Link>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
          💵 Currency Conversion Rates Master
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          Manage global exchange rates against INR (₹). Rates configured here are automatically referenced in the Cost Estimation Sheet for USD ($) and foreign currency conversions.
        </p>
      </div>

      {/* Featured USD ($) Quick Control Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
          borderRadius: 12,
          padding: "24px 28px",
          color: "#ffffff",
          marginBottom: 32,
          boxShadow: "0 6px 16px rgba(37, 99, 235, 0.25)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            <span>⭐ Primary Reference Rate for Costing</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px 0" }}>
            US Dollar (USD / $) Conversion Rate
          </h2>
          <p style={{ fontSize: 14, margin: 0, opacity: 0.9 }}>
            Used across all cost estimation sheets to compute Grand Total in USD ($).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.12)", padding: "10px 16px", borderRadius: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>$1 USD = ₹</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={quickUsdRate}
            onChange={(e) => setQuickUsdRate(e.target.value === "" ? "" : Number(e.target.value))}
            style={{
              width: "100px",
              padding: "8px 12px",
              fontSize: 18,
              fontWeight: 800,
              color: "#1e3a8a",
              background: "#ffffff",
              border: "none",
              borderRadius: 6,
              textAlign: "center",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={handleQuickSaveUsd}
            style={{
              padding: "9px 18px",
              background: "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Save Rate
          </button>
        </div>
      </div>

      {quickSavedMsg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 16px", borderRadius: 8, marginBottom: 24, fontWeight: 600, fontSize: 14 }}>
          ✓ USD Conversion Rate updated successfully! All new costing calculations will reference this rate.
        </div>
      )}

      {/* Add / Edit Currency Form */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0" }}>
          {editingId ? "Edit Currency Conversion Rate" : "Add / Configure Currency"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
            {/* Currency Code */}
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Currency Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. USD, EUR, AED"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                style={{ width: "100%", height: 42, boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}
              />
            </div>

            {/* Currency Name */}
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Currency Name
              </label>
              <input
                type="text"
                placeholder="e.g. US Dollar, Euro"
                value={currencyName}
                onChange={(e) => setCurrencyName(e.target.value)}
                style={{ width: "100%", height: 42, boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
              />
            </div>

            {/* Symbol */}
            <div style={{ flex: "1 1 120px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Symbol
              </label>
              <input
                type="text"
                placeholder="$, €, £"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                style={{ width: "100%", height: 42, boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, fontWeight: 700 }}
              />
            </div>

            {/* Rate in INR */}
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                1 Unit = ₹ INR *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 86.50"
                value={rateToInr}
                onChange={(e) => setRateToInr(e.target.value === "" ? "" : Number(e.target.value))}
                style={{ width: "100%", height: 42, boxSizing: "border-box", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, fontWeight: 700, color: "#0f172a" }}
              />
            </div>

            {/* Status */}
            <div style={{ flex: "1 1 120px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                style={{ width: "100%", height: 42, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, backgroundColor: "#ffffff" }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{ padding: "9px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              style={{ padding: "9px 22px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              {editingId ? "Update Currency Rate" : "+ Add Currency Rate"}
            </button>
          </div>
        </form>
      </div>

      {/* Rates Table */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            Configured Currency Rates ({filteredRates.length})
          </h3>
          <input
            type="text"
            placeholder="Search currency code, name, symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px 14px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, width: "260px" }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Code</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Currency Name</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Symbol</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Exchange Rate (₹ INR)</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Status</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#475569", width: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0f172a" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{item.currencyCode}</span>
                      {item.isDefaultUsd && (
                        <span style={{ fontSize: 10, background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>
                          DEFAULT USD
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 500 }}>
                    {item.currencyName}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#2563eb", fontSize: 15 }}>
                    {item.symbol}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: "#059669", fontSize: 15 }}>
                    ₹{item.rateToInr.toFixed(2)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: item.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: item.status === "active" ? "#166534" : "#991b1b",
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                      >
                        Edit
                      </button>
                      {!item.isDefaultUsd && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.currencyCode)}
                          style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
