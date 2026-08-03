import { FormEvent, useEffect, useState } from "react";
import { reportApi, REPORT_TYPE_LABELS, ReportType, ChartType, DashboardWidgetRecord, ReportResult } from "../api/reportApi";
import ReportChart from "../components/ReportChart";

const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[];
const CHART_TYPES: ChartType[] = ["bar", "line", "area", "pie", "treemap", "gauge", "heatmap", "table"];

export default function DashboardWidgetsPage() {
  const [widgets, setWidgets] = useState<DashboardWidgetRecord[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, ReportResult>>({});
  const [form, setForm] = useState({ reportType: "employee_performance" as ReportType, chartType: "bar" as ChartType, title: "" });

  async function load() {
    const list = await reportApi.listWidgets();
    setWidgets(list);
    const data: Record<string, ReportResult> = {};
    for (const w of list) {
      data[w.id] = await reportApi.run(w.reportType, {});
    }
    setWidgetData(data);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    await reportApi.addWidget(form.reportType, form.chartType, form.title);
    setForm({ ...form, title: "" });
    await load();
  }

  async function handleRemove(id: string) {
    await reportApi.removeWidget(id);
    await load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>My Dashboard</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>Configure your own widgets — pick a report and chart type, and it's added to your personal dashboard below.</p>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value as ReportType })} style={{ padding: 6 }}>
          {REPORT_TYPES.map((t) => <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>)}
        </select>
        <select value={form.chartType} onChange={(e) => setForm({ ...form, chartType: e.target.value as ChartType })} style={{ padding: 6 }}>
          {CHART_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input required placeholder="Widget title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ padding: 6, flex: 1 }} />
        <button type="submit">+ Add Widget</button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {widgets.map((w) => (
          <div key={w.id} style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>{w.title}</strong>
              <button onClick={() => handleRemove(w.id)} style={{ fontSize: 11 }}>Remove</button>
            </div>
            {widgetData[w.id] ? <ReportChart chartType={w.chartType} data={widgetData[w.id].chartSeries} /> : <p style={{ fontSize: 12, color: "#999" }}>Loading...</p>}
          </div>
        ))}
        {widgets.length === 0 && <p style={{ color: "#999" }}>No widgets yet — add one above.</p>}
      </div>
    </div>
  );
}
