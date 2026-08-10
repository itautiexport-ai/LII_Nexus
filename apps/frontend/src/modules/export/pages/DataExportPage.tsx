import React, { useState } from "react";
import { exportData } from "../api/exportApi";
import { CustomSelect } from "../../../shared/components/CustomSelect";

export default function DataExportPage() {
  const [moduleType, setModuleType] = useState<string>("Users");
  const [period, setPeriod] = useState<string>("Last Week");
  const [customMonth, setCustomMonth] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const modules = ["Users", "Delegation", "Checklist", "DPR", "FMS"];
  const periods = [
    "Today",
    "This Week",
    "Last Week",
    "This Month",
    "Last Month",
    "Last 6 Months",
    "Yearly",
    "Custom Month & Year",
  ];

  const handleExport = async () => {
    setIsLoading(true);
    setError("");
    try {
      let startDate, endDate;
      const today = new Date();

      switch (period) {
        case "Today":
          startDate = today.toISOString().split("T")[0];
          endDate = startDate;
          break;
        case "This Week":
          const firstDayWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          startDate = firstDayWeek.toISOString().split("T")[0];
          break;
        case "Last Week":
          const lastWeek = new Date(today.setDate(today.getDate() - 7 - today.getDay()));
          const lastWeekEnd = new Date(today.setDate(today.getDate() + 6));
          startDate = lastWeek.toISOString().split("T")[0];
          endDate = lastWeekEnd.toISOString().split("T")[0];
          break;
        case "This Month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
          break;
        case "Last Month":
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0];
          endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0];
          break;
        case "Last 6 Months":
          startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split("T")[0];
          break;
        case "Yearly":
          startDate = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
          break;
        case "Custom Month & Year":
          if (!customMonth) throw new Error("Please select a month and year.");
          const [year, month] = customMonth.split("-");
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString().split("T")[0];
          endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];
          break;
      }

      const blob = await exportData(moduleType, startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${moduleType}_export_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to export data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
        Data Export
      </h1>
      <p style={{ color: "#64748b", marginBottom: 32 }}>
        Export data from various modules to a formatted Excel file.
      </p>

      <div style={{ background: "#fff", padding: 32, borderRadius: 16, border: "1px solid #e2e8f0" }}>
        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 16, borderRadius: 8, marginBottom: 24 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#334155", marginBottom: 8 }}>
              Select Module
            </label>
            <CustomSelect
              options={modules.map((m) => ({ value: m, label: m }))}
              value={moduleType}
              onChange={(e) => setModuleType(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#334155", marginBottom: 8 }}>
              Time Period
            </label>
            <CustomSelect
              options={periods.map((p) => ({ value: p, label: p }))}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          {period === "Custom Month & Year" && (
            <div>
              <label style={{ display: "block", fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                Month & Year
              </label>
              <input
                type="month"
                value={customMonth}
                onChange={(e) => setCustomMonth(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 16,
                }}
              />
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleExport}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px",
                background: isLoading ? "#94a3b8" : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "Generating Excel..." : "Download Excel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
