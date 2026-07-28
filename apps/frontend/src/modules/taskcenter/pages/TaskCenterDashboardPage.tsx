import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { taskCenterApi, TaskStats } from "../api/taskCenterApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

export default function TaskCenterDashboardPage() {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state: any) => state.user);
  const isSystemAdmin = user?.roles?.includes("System Admin");

  useEffect(() => {
    taskCenterApi.getStats().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const cards = [
    {
      title: "Checklist",
      description: "Manage standalone checklist tasks",
      stats: stats?.checklist,
      to: "/admin/checklist/list",
      color: "#4f46e5", // Indigo
      bg: "#eef2ff",
      icon: "C"
    },
    {
      title: "Delegation",
      description: "Manage delegated tasks",
      stats: stats?.delegation,
      to: isSystemAdmin ? "/admin/delegation/list" : "/admin/delegation/user",
      color: "#0ea5e9", // Sky Blue
      bg: "#f0f9ff",
      icon: "D"
    },
    {
      title: "FMS",
      description: "Flow Management System Tasks",
      stats: stats?.fms,
      to: isSystemAdmin ? "/admin/fms" : "/admin/user-dashboard/fms",
      color: "#8b5cf6", // Violet
      bg: "#f5f3ff",
      icon: "F"
    }
  ];

  const barChartData = [
    { name: 'Checklist', Pending: stats?.checklist?.pending || 0, Completed: stats?.checklist?.completed || 0 },
    { name: 'Delegation', Pending: stats?.delegation?.pending || 0, Completed: stats?.delegation?.completed || 0 },
    { name: 'FMS', Pending: stats?.fms?.pending || 0, Completed: stats?.fms?.completed || 0 },
  ];

  const totalPending = barChartData.reduce((acc, item) => acc + item.Pending, 0);
  const totalCompleted = barChartData.reduce((acc, item) => acc + item.Completed, 0);

  const pieData = [
    { name: 'Pending Tasks', value: totalPending, color: '#f59e0b' },
    { name: 'Completed Tasks', value: totalCompleted, color: '#10b981' }
  ];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto", fontFamily: "var(--font-primary, sans-serif)", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>
            Task Center Overview
          </h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, lineHeight: 1.5, margin: 0 }}>
            Track and manage your operational tasks across divisions. Monitor real-time status updates and graphical representations.
          </p>
        </div>
        <div style={{ background: "#fff", padding: "12px 24px", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 13, textTransform: "uppercase", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", marginBottom: 4 }}>Total Active Tasks</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{totalPending + totalCompleted}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 40px" }}>
          <div className="spinner" style={{ width: 40, height: 40, border: "4px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
            gap: 24,
            marginBottom: 32
          }}>
            {cards.map((card) => (
              <Link 
                key={card.title}
                to={card.to}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: 24,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 12, 
                    background: card.bg, 
                    color: card.color,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: "bold",
                    marginRight: 16
                  }}>
                    {card.icon}
                  </div>
                  <div>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
                      {card.title}
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                      {card.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 16, marginTop: 'auto', background: "#f8fafc", padding: 16, borderRadius: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
                      Pending
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b" }}>
                      {card.stats?.pending || 0}
                    </div>
                  </div>
                  <div style={{ flex: 1, borderLeft: "1px solid #e2e8f0", paddingLeft: 16 }}>
                    <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
                      Completed
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981" }}>
                      {card.stats?.completed || 0}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
            {/* Bar Chart Container */}
            <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
              <h3 style={{ margin: "0 0 24px 0", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Task Distribution by Module</h3>
              <div style={{ height: 320, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                    <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart Container */}
            <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Overall Progress</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "#64748b" }}>Status summary of all your tasks</p>
              
              <div style={{ height: 260, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} Tasks`, undefined]}
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Custom Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
                {pieData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: entry.color }}></div>
                    <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
