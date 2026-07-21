import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { scoringApi, CompositeScoreResult, TrendPoint } from "../api/scoringApi";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MyScorePage() {
  const [score, setScore] = useState<CompositeScoreResult | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const periodKey = currentMonthKey();

  useEffect(() => {
    scoringApi.myScore("monthly", periodKey).then(setScore);
    scoringApi.myTrend("monthly", 6).then(setTrend);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- periodKey is derived from "now" and stable for the component's lifetime
  }, []);

  const chartData = trend.map((t) => ({ period: t.periodKey, score: t.overallScore }));

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>My Performance Score</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 20 }}>Period: {periodKey}</p>

      {score && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: "#777", textTransform: "uppercase" }}>Overall Score</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: score.overallScore === null ? "#999" : score.overallScore >= 80 ? "#1a7f37" : score.overallScore >= 50 ? "#e08e0b" : "#c0392b" }}>
              {score.overallScore !== null ? `${score.overallScore}%` : "—"}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontSize: 13, marginBottom: 8, color: "#777" }}>KPI Breakdown</h3>
            {score.kpiScores.map((k) => (
              <div key={k.kpiDefinitionId} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                <span>{k.kpiName} <span style={{ color: "#999" }}>({k.weightageUsed}%)</span></span>
                <span style={{ fontWeight: 600 }}>{k.rawScore !== null ? `${k.rawScore}%` : "n/a"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>6-Month Trend</h3>
      <div style={{ width: "100%", height: 260, maxWidth: 640 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" fontSize={12} />
            <YAxis domain={[0, 100]} fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#4a90d9" strokeWidth={2} connectNulls dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
