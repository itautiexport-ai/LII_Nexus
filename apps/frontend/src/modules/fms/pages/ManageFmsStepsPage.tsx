import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmsApi, FmsStep } from "../api/fmsApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import "./Fms.css";

export function ManageFmsStepsPage() {
  const { fmsId } = useParams();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<FmsStep[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  
  const [formData, setFormData] = useState({
    stepName: "",
    doerEmployeeId: "",
    timelineHours: 0,
    timelineUnit: "hours" as "hours" | "days",
    isSequential: true,
  });

  const [loading, setLoading] = useState(true);
  const [fmsName, setFmsName] = useState<string>("");

  useEffect(() => {
    if (!fmsId) return;

    const fetchData = async () => {
      try {
        const [stepsRes, empRes, fmsListRes] = await Promise.all([
          fmsApi.getSteps(fmsId),
          employeesApi.list(),
          fmsApi.getAll(),
        ]);
        setSteps(stepsRes);
        setEmployees(empRes);
        const fms = fmsListRes.find((f) => f.id === fmsId);
        if (fms) setFmsName(fms.name);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fmsId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === "isSequential") {
      setFormData((prev) => ({ ...prev, isSequential: value === "sequential" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fmsId) return;

    try {
      const newStep = await fmsApi.addStep(fmsId, {
        stepName: formData.stepName,
        doerEmployeeId: formData.doerEmployeeId,
        timelineHours: formData.timelineHours,
        timelineUnit: formData.timelineUnit,
        isSequential: formData.isSequential,
        sequenceOrder: steps.length, // Put at end
      });
      setSteps((prev) => [...prev, newStep]);
      setFormData({
        stepName: "",
        doerEmployeeId: "",
        timelineHours: 0,
        timelineUnit: "hours",
        isSequential: true,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to add step");
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("Are you sure you want to delete this step?")) return;
    try {
      await fmsApi.deleteStep(stepId);
      setSteps((prev) => prev.filter((s) => s.id !== stepId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete step");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="fms-container">
      <div className="fms-card">
        <div className="fms-card-header">
          <h2 className="fms-title">MANAGE STEPS: {fmsName.toUpperCase()}</h2>
          <button className="fms-btn-primary" onClick={() => navigate("/admin/fms/list")}>
            BACK TO LIST
          </button>
        </div>

        <div className="fms-card-content">
          <form onSubmit={handleAddStep} className="fms-grid" style={{ marginBottom: "2rem" }}>
            <div className="fms-form-group">
              <label className="fms-label">Task Name <span className="fms-required">*</span></label>
              <input
                type="text"
                name="stepName"
                required
                value={formData.stepName}
                onChange={handleChange}
                className="fms-input"
                placeholder="e.g. Quality Check"
              />
            </div>

            <div className="fms-form-group">
              <label className="fms-label">Doer (Employee) <span className="fms-required">*</span></label>
              <select
                name="doerEmployeeId"
                required
                value={formData.doerEmployeeId}
                onChange={handleChange}
                className="fms-select"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="fms-form-group">
              <label className="fms-label">Timeline Unit <span className="fms-required">*</span></label>
              <select
                name="timelineUnit"
                required
                value={formData.timelineUnit}
                onChange={handleChange}
                className="fms-select"
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>

            <div className="fms-form-group">
              <label className="fms-label">Timeline Value <span className="fms-required">*</span></label>
              <input
                type="number"
                name="timelineHours"
                required
                min="0"
                step="0.5"
                value={formData.timelineHours}
                onChange={handleChange}
                className="fms-input"
              />
            </div>

            <div className="fms-form-group">
              <label className="fms-label">Step Type</label>
              <select
                name="isSequential"
                value={formData.isSequential ? "sequential" : "parallel"}
                onChange={handleChange}
                className="fms-select"
              >
                <option value="sequential">Sequential (Waits for previous step)</option>
                <option value="parallel">Parallel (Can start immediately)</option>
              </select>
            </div>

            <div className="fms-form-group full-width" style={{ marginTop: "1rem" }}>
              <button type="submit" className="fms-btn-primary">ADD STEP</button>
            </div>
          </form>

          <hr className="fms-divider" />

          <h3 className="fms-title" style={{ marginTop: "2rem", marginBottom: "1rem" }}>Current Steps</h3>
          <div className="fms-table-container">
            <table className="fms-table">
              <thead>
                <tr>
                  <th className="fms-th">Order</th>
                  <th className="fms-th">Task Name</th>
                  <th className="fms-th">Doer</th>
                  <th className="fms-th">Timeline</th>
                  <th className="fms-th">Type</th>
                  <th className="fms-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {steps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="fms-empty">No steps added yet.</td>
                  </tr>
                ) : (
                  steps.map((step, index) => {
                    const emp = employees.find(e => e.id === step.doerEmployeeId);
                    return (
                      <tr key={step.id} className="fms-tr">
                        <td className="fms-td">{index + 1}</td>
                        <td className="fms-td">{step.stepName}</td>
                        <td className="fms-td">{emp ? emp.fullName : "Unknown"}</td>
                        <td className="fms-td">{step.timelineHours} {step.timelineUnit}</td>
                        <td className="fms-td">{step.isSequential ? "Sequential" : "Parallel"}</td>
                        <td className="fms-td">
                          <button 
                            type="button" 
                            style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                            onClick={() => handleDeleteStep(step.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
