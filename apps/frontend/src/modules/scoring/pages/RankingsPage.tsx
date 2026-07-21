import { useEffect, useState } from "react";
import { scoringApi, RankedEmployee, DepartmentRankingRow } from "../api/scoringApi";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function RankingsPage() {
  const [view, setView] = useState<"top" | "bottom" | "departments">("top");
  const [top, setTop] = useState<RankedEmployee[]>([]);
  const [bottom, setBottom] = useState<RankedEmployee[]>([]);
  const [departments, setDepartments] = useState<DepartmentRankingRow[]>([]);
  const periodKey = currentMonthKey();

  useEffect(() => {
    scoringApi.topPerformers("monthly", periodKey).then(setTop);
    scoringApi.bottomPerformers("monthly", periodKey).then(setBottom);
    scoringApi.departmentRanking("monthly", periodKey).then(setDepartments);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- periodKey is derived from "now" and stable for the component's lifetime
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Rankings</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>Period: {periodKey}</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #ddd" }}>
        {(["top", "bottom", "departments"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "8px 16px", border: "none", background: "none", textTransform: "capitalize", borderBottom: view === v ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: view === v ? 600 : 400 }}>
            {v === "top" ? "Top Performers" : v === "bottom" ? "Bottom Performers" : "Department Ranking"}
          </button>
        ))}
      </div>

      {(view === "top" || view === "bottom") && (
        <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: 560 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>Rank</th><th style={{ padding: 8 }}>Employee</th><th style={{ padding: 8 }}>Department</th><th style={{ padding: 8 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {(view === "top" ? top : bottom).map((e) => (
              <tr key={e.employeeId} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8, fontWeight: 700 }}>#{e.rank}</td>
                <td style={{ padding: 8 }}>{e.employeeName}</td>
                <td style={{ padding: 8 }}>{e.departmentName ?? "—"}</td>
                <td style={{ padding: 8, fontWeight: 600 }}>{e.overallScore}%</td>
              </tr>
            ))}
            {(view === "top" ? top : bottom).length === 0 && <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#777" }}>No scored employees this period.</td></tr>}
          </tbody>
        </table>
      )}

      {view === "departments" && (
        <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: 560 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>Rank</th><th style={{ padding: 8 }}>Department</th><th style={{ padding: 8 }}>Avg Score</th><th style={{ padding: 8 }}>Employees</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.departmentName} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8, fontWeight: 700 }}>#{d.rank}</td>
                <td style={{ padding: 8 }}>{d.departmentName}</td>
                <td style={{ padding: 8, fontWeight: 600 }}>{d.averageScore}%</td>
                <td style={{ padding: 8 }}>{d.employeeCount}</td>
              </tr>
            ))}
            {departments.length === 0 && <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#777" }}>No department scores this period.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
