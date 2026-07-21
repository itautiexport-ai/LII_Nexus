import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { commandCenterApi, CommandCenterOverview } from "../api/commandCenterApi";
import { lightTheme, darkTheme, statusColor, ThemeTokens } from "../components/theme";

const THEME_STORAGE_KEY = "lii-command-center-theme";

function useTheme() {
  const [mode, setMode] = useState<"light" | "dark">(() => (localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark") || "light");
  useEffect(() => { localStorage.setItem(THEME_STORAGE_KEY, mode); }, [mode]);
  return { mode, theme: mode === "dark" ? darkTheme : lightTheme, toggle: () => setMode((m) => (m === "light" ? "dark" : "light")) };
}

function Card({ theme, children, style }: { theme: ThemeTokens; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, ...style }}>{children}</div>;
}

function SectionTitle({ theme, children }: { theme: ThemeTokens; children: React.ReactNode }) {
  return <h2 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5, color: theme.textMuted, marginBottom: 10 }}>{children}</h2>;
}

function HealthStat({ theme, label, value, status, onClick }: { theme: ThemeTokens; label: string; value: string; status: string; onClick?: () => void }) {
  return (
    <Card theme={theme} style={{ cursor: onClick ? "pointer" : "default", borderLeft: `4px solid ${statusColor(theme, status)}` }}>
      <div onClick={onClick}>
        <div style={{ fontSize: 12, color: theme.textMuted, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 30, fontWeight: 700, color: theme.text, marginTop: 4 }}>{value}</div>
      </div>
    </Card>
  );
}

export default function CommandCenterPage() {
  const { mode, theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState<CommandCenterOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setData(await commandCenterApi.getOverview());
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to load Command Center.");
    }
  }
  useEffect(() => { load(); }, []);

  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!data) return <p>Loading Command Center...</p>;

  const gridAutoFit = (min: number): React.CSSProperties => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 16 });

  return (
    <div style={{ background: theme.bg, margin: -24, padding: 24, minHeight: "100vh", color: theme.text, transition: "background 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>CEO Command Center</h1>
          <p style={{ fontSize: 12, color: theme.textMuted, margin: "4px 0 0" }}>What requires my attention — generated {new Date(data.generatedAt).toLocaleString()}</p>
        </div>
        <button onClick={toggle} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, cursor: "pointer" }}>
          {mode === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      {/* Critical Alerts - always at the top, this is the "what needs attention" answer */}
      {data.criticalAlerts.length > 0 && (
        <div style={{ margin: "16px 0" }}>
          <SectionTitle theme={theme}>Critical Alerts</SectionTitle>
          <div style={gridAutoFit(280)}>
            {data.criticalAlerts.map((a, i) => (
              <Card key={i} theme={theme} style={{ borderLeft: `4px solid ${statusColor(theme, a.severity === "critical" ? "critical" : "warning")}` }}>
                <span style={{ fontSize: 13 }}>{a.message}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Health summary row */}
      <div style={{ margin: "20px 0" }}>
        <SectionTitle theme={theme}>Business · Production · People Health</SectionTitle>
        <div style={gridAutoFit(200)}>
          <HealthStat theme={theme} label="Business Health" value={data.businessHealth.averageScore !== null ? `${data.businessHealth.averageScore}%` : "—"} status={data.businessHealth.status} onClick={() => navigate("/admin/rankings")} />
          <HealthStat theme={theme} label="Production Health" value={data.productionHealth.targetAchievementPercent !== null ? `${data.productionHealth.targetAchievementPercent}%` : "—"} status={data.productionHealth.status} onClick={() => navigate("/admin/factory-entries")} />
          <HealthStat theme={theme} label="People at Risk" value={`${data.peopleHealth.employeesAtRisk} / ${data.peopleHealth.activeEmployees}`} status={data.peopleHealth.employeesAtRisk > 0 ? "warning" : "good"} onClick={() => navigate("/admin/employees")} />
          <HealthStat theme={theme} label="Defect Rate" value={data.productionHealth.defectRatePercent !== null ? `${data.productionHealth.defectRatePercent}%` : "—"} status={data.productionHealth.defectRatePercent !== null && data.productionHealth.defectRatePercent > 10 ? "critical" : "good"} onClick={() => navigate("/admin/factory-entries")} />
        </div>
      </div>

      {/* Department Health */}
      <div style={{ margin: "20px 0" }}>
        <SectionTitle theme={theme}>Department Health</SectionTitle>
        <Card theme={theme}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ textAlign: "left", color: theme.textMuted }}><th style={{ padding: 6 }}>Rank</th><th style={{ padding: 6 }}>Department</th><th style={{ padding: 6 }}>Avg Score</th><th style={{ padding: 6 }}>Employees</th></tr></thead>
            <tbody>
              {data.departmentHealth.map((d) => (
                <tr key={d.departmentName} style={{ borderTop: `1px solid ${theme.border}`, cursor: "pointer" }} onClick={() => navigate("/admin/rankings")}>
                  <td style={{ padding: 6 }}>#{d.rank}</td>
                  <td style={{ padding: 6 }}>{d.departmentName}</td>
                  <td style={{ padding: 6, color: statusColor(theme, d.status), fontWeight: 700 }}>{d.averageScore}%</td>
                  <td style={{ padding: 6 }}>{d.employeeCount}</td>
                </tr>
              ))}
              {data.departmentHealth.length === 0 && <tr><td colSpan={4} style={{ padding: 12, textAlign: "center", color: theme.textMuted }}>No department scores yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Order Health */}
      <div style={{ margin: "20px 0" }}>
        <SectionTitle theme={theme}>Order Health</SectionTitle>
        <div style={gridAutoFit(220)}>
          <Card theme={theme} style={{ cursor: "pointer" }} >
            <div onClick={() => navigate("/admin/flowchart")}>
              <div style={{ fontSize: 12, color: theme.textMuted }}>Workflow Runs</div>
              {Object.entries(data.orderHealth.workflowRuns).map(([status, count]) => (
                <div key={status} style={{ fontSize: 13, marginTop: 4 }}>{status.replace("_", " ")}: <strong>{count}</strong></div>
              ))}
              {Object.keys(data.orderHealth.workflowRuns).length === 0 && <div style={{ fontSize: 13, color: theme.textMuted }}>No runs yet.</div>}
            </div>
          </Card>
          <Card theme={theme} style={{ cursor: "pointer" }}>
            <div onClick={() => navigate("/admin/factory-entries")}>
              <div style={{ fontSize: 12, color: theme.textMuted }}>Factory Orders</div>
              {Object.entries(data.orderHealth.factoryOrders).map(([status, count]) => (
                <div key={status} style={{ fontSize: 13, marginTop: 4 }}>{status}: <strong>{count}</strong></div>
              ))}
              {Object.keys(data.orderHealth.factoryOrders).length === 0 && <div style={{ fontSize: 13, color: theme.textMuted }}>No orders yet.</div>}
            </div>
          </Card>
        </div>
      </div>

      {/* Delayed: Tasks / Orders / Production */}
      <div style={{ margin: "20px 0" }}>
        <SectionTitle theme={theme}>Delayed Tasks · Orders · Production</SectionTitle>
        <div style={gridAutoFit(260)}>
          <Card theme={theme}>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>Delayed Tasks ({data.delayedTasks.flowchart.length + data.delayedTasks.delegation.length})</div>
            {[...data.delayedTasks.flowchart, ...data.delayedTasks.delegation].slice(0, 6).map((t) => (
              <div key={t.id} style={{ fontSize: 12, padding: "4px 0", borderTop: `1px solid ${theme.border}`, cursor: "pointer" }} onClick={() => navigate("/admin/delegation")}>
                {t.label} <span style={{ color: theme.textMuted }}>· {t.assigneeName} · due {t.dueDate}</span>
              </div>
            ))}
            {data.delayedTasks.flowchart.length + data.delayedTasks.delegation.length === 0 && <div style={{ fontSize: 12, color: theme.good }}>Nothing overdue.</div>}
          </Card>
          <Card theme={theme}>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>Delayed Orders ({data.delayedOrders.length})</div>
            {data.delayedOrders.slice(0, 6).map((o) => (
              <div key={o.id} style={{ fontSize: 12, padding: "4px 0", borderTop: `1px solid ${theme.border}`, cursor: "pointer" }} onClick={() => navigate(`/admin/flowchart/runs/${o.id}`)}>
                {o.reference} <span style={{ color: theme.textMuted }}>· {o.workflowName}</span>
              </div>
            ))}
            {data.delayedOrders.length === 0 && <div style={{ fontSize: 12, color: theme.good }}>No overdue orders.</div>}
          </Card>
          <Card theme={theme}>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>Delayed Production ({data.delayedProduction.length})</div>
            {data.delayedProduction.slice(0, 6).map((p) => (
              <div key={p.id} style={{ fontSize: 12, padding: "4px 0", borderTop: `1px solid ${theme.border}`, cursor: "pointer" }} onClick={() => navigate("/admin/factory-entries")}>
                {p.departmentName} <span style={{ color: theme.textMuted }}>· {p.entryDate} · {p.daysPending}d pending</span>
              </div>
            ))}
            {data.delayedProduction.length === 0 && <div style={{ fontSize: 12, color: theme.good }}>Nothing delayed.</div>}
          </Card>
        </div>
      </div>

      {/* Top / Bottom performers */}
      <div style={{ margin: "20px 0" }}>
        <SectionTitle theme={theme}>Top Performers · Bottom Performers</SectionTitle>
        <div style={gridAutoFit(280)}>
          <Card theme={theme}>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>Top Performers</div>
            {data.topPerformers.map((e) => (
              <div key={e.employeeId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderTop: `1px solid ${theme.border}`, cursor: "pointer" }} onClick={() => navigate("/admin/rankings")}>
                <span>#{e.rank} {e.employeeName}</span><strong style={{ color: theme.good }}>{e.overallScore}%</strong>
              </div>
            ))}
          </Card>
          <Card theme={theme}>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>Bottom Performers</div>
            {data.bottomPerformers.map((e) => (
              <div key={e.employeeId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderTop: `1px solid ${theme.border}`, cursor: "pointer" }} onClick={() => navigate("/admin/rankings")}>
                <span>#{e.rank} {e.employeeName}</span><strong style={{ color: theme.critical }}>{e.overallScore}%</strong>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Factory Heat Map */}
      <div style={{ margin: "20px 0" }}>
        <SectionTitle theme={theme}>Factory Heat Map</SectionTitle>
        <div style={gridAutoFit(140)}>
          {data.factoryHeatMap.map((d) => (
            <div
              key={d.departmentId}
              onClick={() => navigate("/admin/factory-entries")}
              style={{
                background: statusColor(theme, d.status), color: "#fff", borderRadius: 10, padding: 16, cursor: "pointer",
                display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 90,
              }}
            >
              <strong style={{ fontSize: 13 }}>{d.departmentName}</strong>
              <span style={{ fontSize: 20, fontWeight: 700 }}>{d.health !== null ? `${d.health}%` : "n/a"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trends */}
      <div style={{ margin: "20px 0", ...gridAutoFit(320) }}>
        <Card theme={theme}>
          <SectionTitle theme={theme}>Weekly Trend (completion rate)</SectionTitle>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={data.weeklyTrend.map((w) => ({ week: w.weekStart, rate: w.completionRate }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                <XAxis dataKey="week" fontSize={11} stroke={theme.textMuted} />
                <YAxis domain={[0, 100]} fontSize={11} stroke={theme.textMuted} />
                <Tooltip />
                <Bar dataKey="rate" fill={theme.accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card theme={theme}>
          <SectionTitle theme={theme}>Monthly Trend (avg composite score)</SectionTitle>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={data.monthlyTrend.map((m) => ({ month: m.periodKey, score: m.averageScore }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                <XAxis dataKey="month" fontSize={11} stroke={theme.textMuted} />
                <YAxis domain={[0, 100]} fontSize={11} stroke={theme.textMuted} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke={theme.accent} strokeWidth={2} connectNulls dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI Placeholder - genuinely inert, not fake output */}
      <div style={{ margin: "20px 0" }}>
        <SectionTitle theme={theme}>AI Insights</SectionTitle>
        <Card theme={theme} style={{ border: `1px dashed ${theme.border}`, textAlign: "center", color: theme.textMuted }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
          <p style={{ fontSize: 13, margin: 0 }}>{data.aiPlaceholder.message}</p>
        </Card>
      </div>
    </div>
  );
}
