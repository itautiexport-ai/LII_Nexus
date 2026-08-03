import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadialBarChart, RadialBar, Treemap, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { ChartType } from "../api/reportApi";

const COLORS = ["#4a90d9", "#1a7f37", "#e08e0b", "#c0392b", "#8e44ad", "#16a085", "#d35400", "#2c3e50"];

function heatColor(value: number, max: number): string {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  if (ratio >= 0.8) return "#1a7f37";
  if (ratio >= 0.5) return "#e08e0b";
  return "#c0392b";
}

export default function ReportChart({ chartType, data }: { chartType: ChartType; data: { name: string; value: number }[] }) {
  if (data.length === 0) return <p style={{ color: "#999", fontSize: 13 }}>No chartable data for this report/filter combination.</p>;

  if (chartType === "table") return null;

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={11} angle={-20} textAnchor="end" height={60} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Bar dataKey="value" fill="#4a90d9" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "line" || chartType === "area") {
    const Chart = chartType === "line" ? LineChart : AreaChart;
    return (
      <ResponsiveContainer width="100%" height={280}>
        <Chart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          {chartType === "line"
            ? <Line type="monotone" dataKey="value" stroke="#4a90d9" strokeWidth={2} dot={{ r: 3 }} />
            : <Area type="monotone" dataKey="value" stroke="#4a90d9" fill="#cfe3f7" />}
        </Chart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Tooltip />
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "treemap") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <Treemap data={data} dataKey="value" nameKey="name" stroke="#fff" fill="#4a90d9" />
      </ResponsiveContainer>
    );
  }

  if (chartType === "gauge") {
    const value = data[0]?.value ?? 0;
    const gaugeData = [{ name: data[0]?.name ?? "Value", value, fill: value >= 80 ? "#1a7f37" : value >= 50 ? "#e08e0b" : "#c0392b" }];
    return (
      <ResponsiveContainer width="100%" height={220}>
        <RadialBarChart data={gaugeData} innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} barSize={20}>
          <RadialBar dataKey="value" background />
          <text x="50%" y="70%" textAnchor="middle" fontSize={28} fontWeight={700}>{value}</text>
        </RadialBarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "heatmap") {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
        {data.map((d) => (
          <div key={d.name} style={{ background: heatColor(d.value, max), color: "#fff", borderRadius: 6, padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11 }}>{d.name}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{d.value}</div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
