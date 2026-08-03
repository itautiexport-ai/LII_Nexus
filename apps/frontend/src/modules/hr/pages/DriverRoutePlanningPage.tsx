import React, { useEffect, useState } from "react";
import { vehicleRequestApi, DriverRouteRecord } from "../api/vehicleRequestApi";

const FLEET_VEHICLES = [
  "PICK UP - RJ14GR6576",
  "MINI TRUCK - RJ14GF8469",
  "CNG - RJ14GN9996",
];

export default function DriverRoutePlanningPage() {
  const [routes, setRoutes] = useState<DriverRouteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [driverName, setDriverName] = useState("");
  const [vehicleName, setVehicleName] = useState(FLEET_VEHICLES[0]);
  const [routeName, setRouteName] = useState("");
  const [waypoints, setWaypoints] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes() {
    setLoading(true);
    try {
      const data = await vehicleRequestApi.getDriverRoutes();
      setRoutes(data || []);
    } catch (err: any) {
      console.error("Failed to load driver routes", err);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!driverName || !vehicleName || !routeName || !scheduledDate) return;
    setError(null);

    try {
      await vehicleRequestApi.createDriverRoute({
        driverName,
        vehicleName,
        routeName,
        waypoints,
        scheduledDate,
        startTime,
        endTime,
        status: "Scheduled",
      });

      // Reset
      setDriverName("");
      setRouteName("");
      setWaypoints("");
      loadRoutes();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create driver route plan.");
    }
  }

  async function handleStatusChange(id: string, newStatus: 'Scheduled' | 'En Route' | 'Completed') {
    try {
      await vehicleRequestApi.updateDriverRouteStatus(id, newStatus);
      loadRoutes();
    } catch (err: any) {
      console.error("Failed to update route status", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this route plan?")) return;
    try {
      await vehicleRequestApi.deleteDriverRoute(id);
      loadRoutes();
    } catch (err: any) {
      console.error("Failed to delete route", err);
    }
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Driver Route Planning
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            HR Vehicle Management summary dashboard for planning, mapping, and tracking daily driver dispatch routes.
          </p>
        </div>
        <button
          onClick={loadRoutes}
          style={{
            padding: "8px 16px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          🔄 Refresh Routes
        </button>
      </div>

      {/* Form Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginTop: 0, marginBottom: "16px" }}>
          🗺️ Plan & Map New Driver Route
        </h2>

        {error && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Driver Name *
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Assigned Vehicle *
              </label>
              <select
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              >
                {FLEET_VEHICLES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Route Title / Code *
              </label>
              <input
                type="text"
                required
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g. Route A - Factory to Site"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Scheduled Date *
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Scheduled Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Scheduled End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Route Waypoints / Stops
              </label>
              <input
                type="text"
                value={waypoints}
                onChange={(e) => setWaypoints(e.target.value)}
                placeholder="e.g. Factory ➔ Sitapura Industrial Area ➔ Mansarovar Office"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: "9px 24px",
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            + Publish Driver Route Plan
          </button>
        </form>
      </div>

      {/* Routes Cards Grid */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginTop: 0, marginBottom: "16px" }}>
          Active Driver Route Plans ({routes.length})
        </h2>

        {loading ? (
          <p style={{ color: "#64748b", fontSize: "14px" }}>Loading routes...</p>
        ) : routes.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "14px", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
            No driver route plans created yet. Use the form above to add a new route plan.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {routes.map((rt) => (
              <div
                key={rt.id}
                style={{
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  padding: "16px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ fontWeight: "700", fontSize: "15px", color: "#0f172a" }}>{rt.route_name}</div>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "700",
                      background: rt.status === "En Route" ? "#dbeafe" : rt.status === "Completed" ? "#f1f5f9" : "#fef3c7",
                      color: rt.status === "En Route" ? "#1d4ed8" : rt.status === "Completed" ? "#475569" : "#92400e",
                    }}
                  >
                    {rt.status}
                  </span>
                </div>

                <div style={{ fontSize: "13px", color: "#334155", marginBottom: "12px" }}>
                  <div><strong>👨‍✈️ Driver:</strong> {rt.driver_name}</div>
                  <div><strong>🚗 Vehicle:</strong> {rt.vehicle_name}</div>
                  <div><strong>📅 Date & Time:</strong> {rt.scheduled_date} ({rt.start_time || "--"} - {rt.end_time || "--"})</div>
                  {rt.waypoints && (
                    <div style={{ marginTop: "8px", padding: "8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#0369a1", fontWeight: "600" }}>
                      📍 Route: {rt.waypoints}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleStatusChange(rt.id, "En Route")}
                      style={{
                        background: "#3b82f6",
                        color: "#ffffff",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      En Route
                    </button>

                    <button
                      onClick={() => handleStatusChange(rt.id, "Completed")}
                      style={{
                        background: "#16a34a",
                        color: "#ffffff",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Complete
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(rt.id)}
                    style={{
                      background: "transparent",
                      border: "1px solid #ef4444",
                      color: "#ef4444",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
