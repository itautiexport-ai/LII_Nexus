import React, { useEffect, useState } from "react";
import { vehicleRequestApi } from "../api/vehicleRequestApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { usersApi, UserRecord } from "../../admin/users/api/usersApi";

export default function VehicleRequirementFormPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Master Data Employee List
  const [employeeOptions, setEmployeeOptions] = useState<{ id: string; name: string; department?: string }[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Form State
  const [requesterName, setRequesterName] = useState("");
  const [department, setDepartment] = useState("");
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split("T")[0]);
  const [travelTime, setTravelTime] = useState("");
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadMasterDataEmployees();
  }, []);

  async function loadMasterDataEmployees() {
    setLoadingEmployees(true);
    try {
      // Fetch employees & users to get complete master list
      const [empList, userList] = await Promise.all([
        employeesApi.list("").catch(() => []),
        usersApi.list("").catch(() => []),
      ]);

      const nameMap = new Map<string, { id: string; name: string; department?: string }>();

      empList.forEach((e: EmployeeRecord) => {
        if (e.fullName) {
          nameMap.set(e.fullName.trim().toLowerCase(), {
            id: e.id,
            name: e.fullName.trim(),
            department: e.departmentName || undefined,
          });
        }
      });

      userList.forEach((u: UserRecord) => {
        const isExcludedRole = u.roles?.some(r => {
          const lower = r.toLowerCase();
          return lower.includes("director") || lower.includes("admin");
        });
        if (u.fullName && !isExcludedRole && !nameMap.has(u.fullName.trim().toLowerCase())) {
          nameMap.set(u.fullName.trim().toLowerCase(), {
            id: u.id,
            name: u.fullName.trim(),
            department: u.department || undefined,
          });
        }
      });

      const sorted = Array.from(nameMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setEmployeeOptions(sorted);
    } catch (err) {
      console.error("Failed to load master data employees", err);
    } finally {
      setLoadingEmployees(false);
    }
  }

  function handleEmployeeSelect(selectedName: string) {
    setRequesterName(selectedName);
    const emp = employeeOptions.find((e) => e.name === selectedName);
    if (emp && emp.department) {
      setDepartment(emp.department);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requesterName || !travelDate || !destination) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await vehicleRequestApi.createRequest({
        requesterName,
        department,
        travelDate,
        travelTime,
        destination,
        purpose,
        remarks,
      });

      // Reset
      setRequesterName("");
      setDepartment("");
      setTravelDate(new Date().toISOString().split("T")[0]);
      setTravelTime("");
      setDestination("");
      setPurpose("");
      setRemarks("");

      setSuccessMsg("Vehicle requirement request submitted successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to submit vehicle requirement request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
          Vehicle Requirement Form
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          HR Vehicle Request Management sub-module for requesting company vehicles for official travel and transport.
        </p>
      </div>

      {/* Main Form Container */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          maxWidth: "800px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginTop: 0, marginBottom: "16px" }}>
          + New Vehicle Requisition Request
        </h2>

        {successMsg && (
          <div style={{ padding: "12px 16px", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", border: "1px solid #bbf7d0" }}>
            ✅ {successMsg}
          </div>
        )}

        {error && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            {/* Requester Employee Name Dropdown */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Requester Employee Name *
              </label>
              <select
                required
                value={requesterName}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", background: "#ffffff" }}
              >
                <option value="">{loadingEmployees ? "Loading master data..." : "-- Select Employee --"}</option>
                {employeeOptions.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} {emp.department ? `(${emp.department})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Sales, Production, HR"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Travel Date *
              </label>
              <input
                type="date"
                required
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Travel Time
              </label>
              <input
                type="time"
                value={travelTime}
                onChange={(e) => setTravelTime(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Drop Location *
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter Drop Location"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Purpose of Visit / Work
              </label>
              <textarea
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Client meeting at site, material transport, audit visit"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Remarks / Special Instructions
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional notes"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 28px",
              background: loading ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting Request..." : "Submit Vehicle Requirement Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
