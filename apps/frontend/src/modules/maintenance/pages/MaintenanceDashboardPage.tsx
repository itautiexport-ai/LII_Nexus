import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { maintenanceApi, MaintenanceDashboardStats, WorkOrderRecord, EquipmentRecord } from "../api/maintenanceApi";

export default function MaintenanceDashboardPage() {
  const [stats, setStats] = useState<MaintenanceDashboardStats | null>(null);
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrderRecord[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, woData, eqData] = await Promise.all([
        maintenanceApi.getStats().catch(() => null),
        maintenanceApi.getWorkOrders().catch(() => []),
        maintenanceApi.getEquipment().catch(() => [])
      ]);
      setStats(statsData);
      setRecentWorkOrders(woData.slice(0, 5));
      setEquipmentList(eqData.slice(0, 5));
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            Maintenance & Engineering Hub
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Plant equipment health, work orders, preventive schedules, and spare parts inventory
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            to="/admin/maintenance/work-orders"
            style={{
              padding: "10px 18px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "14px",
              display: "inline-block"
            }}
          >
            + New Work Order
          </Link>
          <Link
            to="/admin/maintenance/breakdowns"
            style={{
              padding: "10px 18px",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "14px",
              display: "inline-block"
            }}
          >
            Log Breakdown
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: "14px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "28px" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Active Work Orders</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b", marginTop: "8px" }}>
            {loading ? "..." : stats?.workOrders?.active_work_orders || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Total WO Logged: {stats?.workOrders?.total_work_orders || 0}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #10b981" }}>
          <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Operational Equipment</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#10b981", marginTop: "8px" }}>
            {loading ? "..." : stats?.equipment?.operational_count || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Total Machinery: {stats?.equipment?.total_equipment || 0}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #ef4444" }}>
          <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Breakdowns / Maintenance</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#ef4444", marginTop: "8px" }}>
            {loading ? "..." : (stats?.equipment?.breakdown_count || 0) + (stats?.equipment?.under_maintenance_count || 0)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Breakdowns: {stats?.equipment?.breakdown_count || 0} | Servicing: {stats?.equipment?.under_maintenance_count || 0}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Overdue Preventive PM</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#f59e0b", marginTop: "8px" }}>
            {loading ? "..." : stats?.preventive?.overdue_schedules || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Total Scheduled PMs: {stats?.preventive?.total_schedules || 0}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Work Orders", path: "/admin/maintenance/work-orders", count: stats?.workOrders?.active_work_orders, color: "#3b82f6", desc: "Manage repair tasks & status" },
          { label: "Preventive Schedules", path: "/admin/maintenance/preventive", count: stats?.preventive?.total_schedules, color: "#f59e0b", desc: "Routine maintenance calendar" },
          { label: "Equipment Assets", path: "/admin/maintenance/equipment", count: stats?.equipment?.total_equipment, color: "#10b981", desc: "Machinery & status registry" },
          { label: "Breakdown Logs", path: "/admin/maintenance/breakdowns", count: stats?.equipment?.breakdown_count, color: "#ef4444", desc: "Downtime & root cause logs" },
          { label: "Spare Parts", path: "/admin/maintenance/spare-parts", count: stats?.spareParts?.total_parts, color: "#8b5cf6", desc: "Inventory & min stock threshold" },
        ].map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            style={{
              display: "block",
              padding: "16px",
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              textDecoration: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              border: "1px solid #e2e8f0",
              transition: "transform 0.2s, boxShadow 0.2s"
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: "700", color: item.color }}>{item.label} &rarr;</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Tables Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Recent Work Orders */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>Recent Work Orders</h3>
            <Link to="/admin/maintenance/work-orders" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>View All</Link>
          </div>
          {recentWorkOrders.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No work orders logged yet</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "8px" }}>WO #</th>
                  <th style={{ padding: "8px" }}>Equipment</th>
                  <th style={{ padding: "8px" }}>Priority</th>
                  <th style={{ padding: "8px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentWorkOrders.map((wo) => (
                  <tr key={wo.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px", fontWeight: "600", color: "#2563eb" }}>{wo.work_order_no}</td>
                    <td style={{ padding: "8px" }}>{wo.equipment_name}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                        backgroundColor: wo.priority === 'Critical' ? '#fef2f2' : wo.priority === 'High' ? '#fff7ed' : '#f0fdf4',
                        color: wo.priority === 'Critical' ? '#dc2626' : wo.priority === 'High' ? '#c2410c' : '#15803d'
                      }}>
                        {wo.priority}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                        backgroundColor: wo.status === 'Completed' ? '#dcfce7' : wo.status === 'In Progress' ? '#dbeafe' : '#fef3c7',
                        color: wo.status === 'Completed' ? '#166534' : wo.status === 'In Progress' ? '#1e40af' : '#92400e'
                      }}>
                        {wo.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Equipment Status Registry */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>Equipment Overview</h3>
            <Link to="/admin/maintenance/equipment" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>View All</Link>
          </div>
          {equipmentList.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No equipment registered yet</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "8px" }}>Code</th>
                  <th style={{ padding: "8px" }}>Name</th>
                  <th style={{ padding: "8px" }}>Department</th>
                  <th style={{ padding: "8px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map((eq) => (
                  <tr key={eq.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px", fontWeight: "600" }}>{eq.equipment_code}</td>
                    <td style={{ padding: "8px" }}>{eq.name}</td>
                    <td style={{ padding: "8px" }}>{eq.department_name || '-'}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                        backgroundColor: eq.status === 'Operational' ? '#dcfce7' : eq.status === 'Breakdown' ? '#fef2f2' : '#fef3c7',
                        color: eq.status === 'Operational' ? '#166534' : eq.status === 'Breakdown' ? '#991b1b' : '#92400e'
                      }}>
                        {eq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
