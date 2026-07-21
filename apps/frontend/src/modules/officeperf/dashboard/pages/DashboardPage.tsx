import { useEffect, useState } from "react";
import { dashboardApi, EmployeeDashboard, ManagerDashboard, CompanyDashboard, DepartmentDashboard, WindowScore } from "../api/dashboardApi";
import { departmentsApi, DepartmentRecord } from "../../../admin/organization/departments/api/departmentsApi";
import { useHasPermission } from "../../../auth/hooks/usePermissions";

function ScoreCard({ label, score }: { label: string; score: WindowScore }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, minWidth: 160, flex: 1 }}>
      <div style={{ fontSize: 12, color: "#777", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: score.overall === null ? "#999" : score.overall >= 80 ? "#1a7f37" : score.overall >= 50 ? "#e08e0b" : "#c0392b" }}>
        {score.overall !== null ? `${score.overall}%` : "—"}
      </div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
        Flowchart: {score.flowchart.rate !== null ? `${Math.round(score.flowchart.rate)}%` : "n/a"} ·{" "}
        Checklist: {score.checklist.rate !== null ? `${Math.round(score.checklist.rate)}%` : "n/a"} ·{" "}
        Delegation: {score.delegation.rate !== null ? `${Math.round(score.delegation.rate)}%` : "n/a"}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const canViewDepartment = useHasPermission("performance.dashboard.department.view");
  const canViewCompany = useHasPermission("performance.dashboard.company.view");

  const [view, setView] = useState<"employee" | "manager" | "department" | "company">("employee");
  const [employeeDash, setEmployeeDash] = useState<EmployeeDashboard | null>(null);
  const [managerDash, setManagerDash] = useState<ManagerDashboard | null>(null);
  const [companyDash, setCompanyDash] = useState<CompanyDashboard | null>(null);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [deptDash, setDeptDash] = useState<DepartmentDashboard | null>(null);

  useEffect(() => { dashboardApi.employee().then(setEmployeeDash); }, []);
  useEffect(() => { if (view === "manager") dashboardApi.manager().then(setManagerDash); }, [view]);
  useEffect(() => { if (view === "company") dashboardApi.company().then(setCompanyDash); }, [view]);
  useEffect(() => { if (view === "department" && departments.length === 0) departmentsApi.list().then(setDepartments); }, [view, departments.length]);
  useEffect(() => { if (selectedDept) dashboardApi.department(selectedDept).then(setDeptDash); }, [selectedDept]);

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Performance Dashboard</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #ddd" }}>
        {(["employee", "manager"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "8px 16px", border: "none", background: "none", textTransform: "capitalize", borderBottom: view === v ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: view === v ? 600 : 400 }}>{v}</button>
        ))}
        {canViewDepartment && <button onClick={() => setView("department")} style={{ padding: "8px 16px", border: "none", background: "none", borderBottom: view === "department" ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: view === "department" ? 600 : 400 }}>Department</button>}
        {canViewCompany && <button onClick={() => setView("company")} style={{ padding: "8px 16px", border: "none", background: "none", borderBottom: view === "company" ? "2px solid #4a90d9" : "2px solid transparent", fontWeight: view === "company" ? 600 : 400 }}>Company (CEO)</button>}
      </div>

      {view === "employee" && employeeDash && (
        <div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <ScoreCard label="Today's Score" score={employeeDash.scores.today} />
            <ScoreCard label="Weekly Score" score={employeeDash.scores.week} />
            <ScoreCard label="Monthly Score" score={employeeDash.scores.month} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {(["todaysTasks", "pendingTasks", "delayedTasks"] as const).map((key) => (
              <div key={key} style={{ flex: 1, minWidth: 240 }}>
                <h3 style={{ fontSize: 14, textTransform: "capitalize", marginBottom: 8 }}>{key.replace(/([A-Z])/g, " $1")}</h3>
                {employeeDash[key].length === 0 && <p style={{ fontSize: 13, color: "#777" }}>None</p>}
                {employeeDash[key].map((t) => (
                  <div key={t.id} style={{ padding: 8, border: "1px solid #eee", borderRadius: 4, marginBottom: 6, fontSize: 13 }}>
                    <div>{t.title}</div>
                    <div style={{ color: "#999", fontSize: 11 }}>{t.source} · due {t.dueDate ?? "—"}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "manager" && managerDash && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>Employee</th>
              <th style={{ padding: 8 }}>Today</th>
              <th style={{ padding: 8 }}>Pending</th>
              <th style={{ padding: 8 }}>Delayed</th>
              <th style={{ padding: 8 }}>Today Score</th>
              <th style={{ padding: 8 }}>Week Score</th>
              <th style={{ padding: 8 }}>Month Score</th>
            </tr>
          </thead>
          <tbody>
            {managerDash.directReports.map((r) => (
              <tr key={r.employeeId} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8, fontWeight: 600 }}>{r.employeeName}</td>
                <td style={{ padding: 8 }}>{r.todaysTaskCount}</td>
                <td style={{ padding: 8 }}>{r.pendingTaskCount}</td>
                <td style={{ padding: 8, color: r.delayedTaskCount > 0 ? "#c0392b" : undefined }}>{r.delayedTaskCount}</td>
                <td style={{ padding: 8 }}>{r.todayScore ?? "—"}</td>
                <td style={{ padding: 8 }}>{r.weekScore ?? "—"}</td>
                <td style={{ padding: 8 }}>{r.monthScore ?? "—"}</td>
              </tr>
            ))}
            {managerDash.directReports.length === 0 && <tr><td colSpan={7} style={{ padding: 16, textAlign: "center", color: "#777" }}>No direct reports.</td></tr>}
          </tbody>
        </table>
      )}

      {view === "department" && (
        <div>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{ padding: 6, marginBottom: 16 }}>
            <option value="">— Select department —</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {deptDash && (
            <>
              <p style={{ marginBottom: 12 }}>Department average (today): <strong>{deptDash.departmentAverageToday ?? "—"}%</strong></p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    <th style={{ padding: 8 }}>Employee</th><th style={{ padding: 8 }}>Today</th><th style={{ padding: 8 }}>Week</th><th style={{ padding: 8 }}>Month</th>
                  </tr>
                </thead>
                <tbody>
                  {deptDash.employees.map((e) => (
                    <tr key={e.employeeId} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 8 }}>{e.employeeName}</td>
                      <td style={{ padding: 8 }}>{e.todayScore ?? "—"}</td>
                      <td style={{ padding: 8 }}>{e.weekScore ?? "—"}</td>
                      <td style={{ padding: 8 }}>{e.monthScore ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {view === "company" && companyDash && (
        <div>
          <p style={{ marginBottom: 12 }}>Company average (today): <strong>{companyDash.companyAverageToday ?? "—"}%</strong></p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: 8 }}>Department</th><th style={{ padding: 8 }}>Employees</th><th style={{ padding: 8 }}>Average Today</th>
              </tr>
            </thead>
            <tbody>
              {companyDash.departments.map((d) => (
                <tr key={d.departmentId} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{d.departmentName}</td>
                  <td style={{ padding: 8 }}>{d.employeeCount}</td>
                  <td style={{ padding: 8 }}>{d.averageToday ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
