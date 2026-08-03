import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { machineEfficiencyApi, MachineEfficiencyEntry } from "../api/machineEfficiencyApi";

export default function ListMachineEfficiencyPage() {
  const [entries, setEntries] = useState<MachineEfficiencyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    machineEfficiencyApi.listEntries()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Machine Efficiency List</h2>
        <Link to="/admin/machine-efficiency/new" style={styles.addBtn}>+ Add New Entry</Link>
      </div>

      <div style={styles.card}>
        {loading ? (
          <p>Loading...</p>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
            <p>No machine efficiency entries found.</p>
            <Link to="/admin/machine-efficiency/new" style={styles.addBtn}>Add First Entry</Link>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Machine</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Target</th>
                  <th style={styles.th}>Achieved</th>
                  <th style={styles.th}>Manpower</th>
                  <th style={styles.th}>Efficiency</th>
                  <th style={styles.th}>Added By</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={styles.tr}>
                    <td style={styles.td}>{new Date(e.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>{e.departmentName || e.departmentId}</td>
                    <td style={styles.td}>{e.machineName || e.machineId}</td>
                    <td style={styles.td}>{e.size}</td>
                    <td style={styles.td}>{e.target}</td>
                    <td style={styles.td}>{e.achieved}</td>
                    <td style={styles.td}>{e.manpowerCount}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: e.efficiency >= 100 ? "#dcfce7" : e.efficiency >= 80 ? "#fef9c3" : "#fee2e2",
                        color: e.efficiency >= 100 ? "#166534" : e.efficiency >= 80 ? "#854d0e" : "#991b1b"
                      }}>
                        {e.efficiency}%
                      </span>
                    </td>
                    <td style={styles.td}>{e.createdByName || e.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24, background: "#f0f2f5", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" },
  addBtn: { background: "#2563eb", color: "#fff", padding: "8px 16px", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 13 },
  card: { background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  trHead: { background: "#f8fafc", borderBottom: "1px solid #e5e7eb" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 16px", fontSize: 14, color: "#4b5563" },
  badge: { padding: "4px 8px", borderRadius: 999, fontWeight: 700, fontSize: 12 },
};
