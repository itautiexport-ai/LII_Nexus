import React, { useEffect, useState } from "react";
import { orderInHandApi, OrderInHandRecord } from "../api/orderInHandApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function BuyerDashboardPage() {
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
      alert("Failed to load orders for buyer dashboard");
    } finally {
      setLoading(false);
    }
  }

  // --- Calculations ---
  const buyerMap: Record<string, { name: string; revenue: number; orderCount: number; quantity: number; cbm: number }> = {};
  
  orders.forEach(o => {
    const buyer = o.customerName || "Unknown Buyer";
    if (!buyerMap[buyer]) {
      buyerMap[buyer] = { name: buyer, revenue: 0, orderCount: 0, quantity: 0, cbm: 0 };
    }
    buyerMap[buyer].revenue += (o.orderValue || 0);
    buyerMap[buyer].orderCount += 1;
    buyerMap[buyer].quantity += (o.totalQty || 0);
    buyerMap[buyer].cbm += (o.totalCbm || 0);
  });

  const allBuyers = Object.values(buyerMap).sort((a, b) => b.revenue - a.revenue);
  const topBuyers = allBuyers.slice(0, 5);

  const totalRevenue = allBuyers.reduce((sum, b) => sum + b.revenue, 0);

  // Pie chart data: show top 5, and group the rest as "Others"
  let pieData: { name: string; value: number }[] = [];
  if (allBuyers.length <= 6) {
    pieData = allBuyers.map(b => ({ name: b.name, value: b.revenue }));
  } else {
    pieData = allBuyers.slice(0, 5).map(b => ({ name: b.name, value: b.revenue }));
    const othersRevenue = allBuyers.slice(5).reduce((sum, b) => sum + b.revenue, 0);
    pieData.push({ name: "Others", value: othersRevenue });
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontSize: 18, color: "#6b7280" }}>Loading Dashboard...</div>;
  }

  return (
    <div style={{ padding: "32px", background: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ margin: "0 0 24px 0", fontSize: 28, fontWeight: 700, color: "#111827" }}>Buyer Dashboard</h1>

      {/* Top Level KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Total Buyers</div>
          <div style={cardValueStyle}>{allBuyers.length}</div>
        </div>
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "#fff" }}>
          <div style={{ ...cardTitleStyle, color: "#e0e7ff" }}>Top Buyer</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 8 }}>{allBuyers[0]?.name || "N/A"}</div>
          <div style={{ fontSize: 14, color: "#e0e7ff", marginTop: 4 }}>
            ${(allBuyers[0]?.revenue || 0).toLocaleString()}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Avg Revenue / Buyer</div>
          <div style={cardValueStyle}>
            ${allBuyers.length ? Math.round(totalRevenue / allBuyers.length).toLocaleString() : 0}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32, alignItems: "stretch" }}>
        
        {/* Bar Chart: Top 5 Buyers by Revenue */}
        <div style={{ ...sectionStyle, minHeight: 400 }}>
          <h3 style={sectionHeaderStyle}>Top 5 Buyers (Revenue)</h3>
          <div style={{ width: "100%", height: 320, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBuyers} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip 
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Revenue Share */}
        <div style={{ ...sectionStyle, minHeight: 400 }}>
          <h3 style={sectionHeaderStyle}>Revenue Share</h3>
          <div style={{ width: "100%", height: 320, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 13, color: "#374151" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div style={sectionStyle}>
        <h3 style={sectionHeaderStyle}>All Buyers Overview</h3>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f9fafb", textAlign: "left" }}>
              <tr>
                <th style={thStyle}>Buyer Name</th>
                <th style={thStyle}>Total Orders</th>
                <th style={thStyle}>Total Quantity</th>
                <th style={thStyle}>Total CBM</th>
                <th style={thStyle}>Total Revenue</th>
                <th style={thStyle}>% of Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {allBuyers.map(buyer => {
                const percent = totalRevenue > 0 ? ((buyer.revenue / totalRevenue) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={buyer.name} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ ...tdStyle, fontWeight: 500, color: "#111827" }}>{buyer.name}</td>
                    <td style={tdStyle}>{buyer.orderCount}</td>
                    <td style={tdStyle}>{buyer.quantity.toLocaleString()}</td>
                    <td style={tdStyle}>{buyer.cbm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>${buyer.revenue.toLocaleString()}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${percent}%`, background: "#10b981", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 13, width: 40 }}>{percent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {allBuyers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No buyer data available.</td>
                </tr>
              )}
            </tbody>
          </table>
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

const thStyle: React.CSSProperties = {
  padding: "12px 16px", 
  fontSize: 13, 
  fontWeight: 600, 
  color: "#4b5563", 
  borderBottom: "1px solid #e5e7eb", 
  whiteSpace: "nowrap"
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px", 
  fontSize: 14,
  color: "#374151"
};
