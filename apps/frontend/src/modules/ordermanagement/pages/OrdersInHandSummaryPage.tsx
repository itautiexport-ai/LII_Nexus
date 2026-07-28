import React, { useEffect, useState } from "react";
import { orderInHandApi, OrderInHandRecord } from "../api/orderInHandApi";

export default function OrdersInHandSummaryPage() {
  const [orders, setOrders] = useState<OrderInHandRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await orderInHandApi.getAll();
      setOrders(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load orders summary");
    } finally {
      setLoading(false);
    }
  }

  // --- Calculations ---
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + (o.orderValue || 0), 0);
  const totalQty = orders.reduce((sum, o) => sum + (o.totalQty || 0), 0);
  const totalCbm = orders.reduce((sum, o) => sum + (o.totalCbm || 0), 0);
  
  const delayedOrders = orders.filter(o => {
    if (!o.expectedDispatchDate || !o.exFactoryDate) return false;
    const expDate = new Date(o.expectedDispatchDate);
    const exFactory = new Date(o.exFactoryDate);
    return expDate.getTime() > exFactory.getTime();
  }).length;

  const underProcessCount = orders.filter(o => o.overallStatus === "Under Process").length;
  const dispatchedCount = orders.filter(o => o.overallStatus === "Dispatched").length;
  
  const prodStarted = orders.filter(o => o.productionStatus === "In Progress").length;
  const prodCompleted = orders.filter(o => o.productionStatus === "Completed").length;
  const prodPending = totalOrders - prodStarted - prodCompleted;

  // Country Breakdown
  const countryMap: Record<string, number> = {};
  orders.forEach(o => {
    const c = o.country || "Unknown";
    countryMap[c] = (countryMap[c] || 0) + 1;
  });
  const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontSize: 18, color: "#6b7280" }}>Loading Dashboard...</div>;
  }

  return (
    <div style={{ padding: "32px", background: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ margin: "0 0 24px 0", fontSize: 28, fontWeight: 700, color: "#111827" }}>Order Dashboard</h1>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Total Orders</div>
          <div style={cardValueStyle}>{totalOrders}</div>
        </div>
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "#fff" }}>
          <div style={{ ...cardTitleStyle, color: "#e0e7ff" }}>Total Revenue</div>
          <div style={{ ...cardValueStyle, color: "#fff" }}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Total Quantity</div>
          <div style={cardValueStyle}>{totalQty.toLocaleString()}</div>
        </div>
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff" }}>
          <div style={{ ...cardTitleStyle, color: "#d1fae5" }}>Total CBM</div>
          <div style={{ ...cardValueStyle, color: "#fff" }}>{totalCbm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div style={{ ...cardStyle, borderLeft: "4px solid #ef4444" }}>
          <div style={cardTitleStyle}>Delayed Orders</div>
          <div style={{ ...cardValueStyle, color: "#ef4444" }}>{delayedOrders}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        
        {/* Status Breakdown */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>Overall Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            <ProgressBar label="Under Process" count={underProcessCount} total={totalOrders} color="#3b82f6" />
            <ProgressBar label="Dispatched" count={dispatchedCount} total={totalOrders} color="#10b981" />
          </div>
        </div>

        {/* Production Breakdown */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>Production Stages</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            <ProgressBar label="Not Started" count={prodPending} total={totalOrders} color="#9ca3af" />
            <ProgressBar label="Started" count={prodStarted} total={totalOrders} color="#f59e0b" />
            <ProgressBar label="Completed" count={prodCompleted} total={totalOrders} color="#10b981" />
          </div>
        </div>

        {/* Country Breakdown */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>Top Countries</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {topCountries.map(([country, count]) => (
              <li key={country} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f9fafb", borderRadius: 8 }}>
                <span style={{ fontWeight: 500, color: "#374151" }}>{country}</span>
                <span style={{ background: "#e5e7eb", padding: "4px 10px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{count}</span>
              </li>
            ))}
            {topCountries.length === 0 && <div style={{ color: "#9ca3af" }}>No data available</div>}
          </ul>
        </div>
        
      </div>
    </div>
  );
}

// --- Styles ---
const cardStyle: React.CSSProperties = {
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s",
  cursor: "default",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const cardValueStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  color: "#111827",
};

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
};

const sectionHeaderStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: "#1f2937",
  borderBottom: "1px solid #f3f4f6",
  paddingBottom: 12,
};

// --- Helper Components ---
function ProgressBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, fontWeight: 500, color: "#4b5563" }}>
        <span>{label}</span>
        <span>{count} ({percent}%)</span>
      </div>
      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${percent}%`, background: color, borderRadius: 4, transition: "width 1s ease-out" }} />
      </div>
    </div>
  );
}
