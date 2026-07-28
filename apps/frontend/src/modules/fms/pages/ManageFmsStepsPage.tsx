import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmsApi, FmsStep } from "../api/fmsApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import "./Fms.css";

export function ManageFmsStepsPage() {
  const { fmsId } = useParams();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<FmsStep[]>([]);
  const [allGlobalSteps, setAllGlobalSteps] = useState<(FmsStep & { managerName: string })[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    stepName: "",
    doerEmployeeIds: [] as string[],
    timelineHours: 0,
    timelineUnit: "hours" as "hours" | "days",
    dependsOnStepIds: [] as string[],
    stepType: "sequential" as "sequential" | "parallel",
  });

  const [loading, setLoading] = useState(true);
  const [fmsName, setFmsName] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dependsDropdownOpen, setDependsDropdownOpen] = useState(false);
  const dependsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (dependsDropdownRef.current && !dependsDropdownRef.current.contains(event.target as Node)) {
        setDependsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!fmsId) return;

    const fetchData = async () => {
      try {
        const [stepsRes, empRes, fmsListRes, globalStepsRes] = await Promise.all([
          fmsApi.getSteps(fmsId),
          employeesApi.list(),
          fmsApi.getAll(),
          fmsApi.getAllStepsGlobal()
        ]);
        setSteps(stepsRes);
        setAllGlobalSteps(globalStepsRes);
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
    } else if (name === "stepType") {
      setFormData((prev) => ({
        ...prev,
        stepType: value as "sequential" | "parallel",
        dependsOnStepIds: value === "parallel" ? [] : prev.dependsOnStepIds,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddOrUpdateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fmsId) return;

    try {
      if (editingStepId) {
        const existingStep = steps.find(s => s.id === editingStepId);
        const updatedStep = await fmsApi.updateStep(editingStepId, {
          stepName: formData.stepName,
          doerEmployeeIds: formData.doerEmployeeIds,
          timelineHours: formData.timelineHours,
          timelineUnit: formData.timelineUnit,
          dependsOnStepIds: formData.dependsOnStepIds,
        });
        setSteps(prev => prev.map(s => s.id === editingStepId ? updatedStep : s));
        setEditingStepId(null);
      } else {
        await fmsApi.addStep(fmsId, {
          stepName: formData.stepName,
          doerEmployeeIds: formData.doerEmployeeIds,
          timelineHours: formData.timelineHours,
          timelineUnit: formData.timelineUnit,
          dependsOnStepIds: formData.dependsOnStepIds,
        });

        const updatedSteps = await fmsApi.getSteps(fmsId);
        setSteps(updatedSteps);
      }
      

      setFormData({
        stepName: "",
        doerEmployeeIds: [],
        timelineHours: 0,
        timelineUnit: "hours",
        dependsOnStepIds: [],
        stepType: "sequential",
      });
    } catch (err) {
      console.error(err);
      alert(editingStepId ? "Failed to update step" : "Failed to add step");
    }
  };

  const handleEditClick = (step: FmsStep) => {
    setEditingStepId(step.id);
    setFormData({
      stepName: step.stepName,
      doerEmployeeIds: step.doerEmployeeIds || [],
      timelineHours: step.timelineHours,
      timelineUnit: step.timelineUnit,
      dependsOnStepIds: step.dependsOnStepIds || [],
      stepType: (!step.dependsOnStepIds || step.dependsOnStepIds.length === 0) ? "parallel" : "sequential",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <button 
            className="fms-btn-primary" 
            onClick={() => navigate("/admin/fms/list")}
            style={{ background: "#ffc107", color: "#333", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            BACK TO LIST
          </button>
        </div>

        <div className="fms-card-content">
          <form onSubmit={handleAddOrUpdateStep} className="fms-grid" style={{ marginBottom: "2rem" }}>
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
              <div className="custom-multi-select" ref={dropdownRef} style={{ position: "relative" }}>
                <div 
                  className="fms-input" 
                  style={{ minHeight: "38px", display: "flex", flexWrap: "wrap", gap: "4px", padding: "4px 8px", cursor: "pointer", alignItems: "center" }}
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen);
                    setSearchQuery("");
                  }}
                >
                  {formData.doerEmployeeIds.length === 0 ? (
                    <span style={{ color: "#6c757d" }}>Select Employees...</span>
                  ) : (
                    formData.doerEmployeeIds.map(id => {
                      const emp = employees.find(e => e.id === id);
                      if (!emp) return null;
                      return (
                        <span key={id} style={{ background: "#e9ecef", padding: "2px 8px", borderRadius: "12px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                          {emp.fullName}
                          <span 
                            style={{ cursor: "pointer", color: "#dc3545", fontWeight: "bold" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({
                                ...prev,
                                doerEmployeeIds: prev.doerEmployeeIds.filter(eid => eid !== id)
                              }));
                            }}
                          >
                            &times;
                          </span>
                        </span>
                      );
                    })
                  )}
                </div>
                
                {dropdownOpen && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #ced4da", borderRadius: "4px", marginTop: "4px", maxHeight: "250px", overflowY: "auto", zIndex: 10 }}>
                    <div style={{ padding: "8px", borderBottom: "1px solid #ced4da", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
                      <input 
                        type="text" 
                        placeholder="Search employees..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #ced4da", boxSizing: "border-box" }}
                        autoFocus
                      />
                    </div>
                    {employees
                      .filter(emp => emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())))
                      .map(emp => (
                      <label key={emp.id} style={{ display: "flex", alignItems: "center", padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f8f9fa", margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={formData.doerEmployeeIds.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, doerEmployeeIds: [...prev.doerEmployeeIds, emp.id] }));
                            } else {
                              setFormData(prev => ({ ...prev, doerEmployeeIds: prev.doerEmployeeIds.filter(id => id !== emp.id) }));
                            }
                          }}
                          style={{ marginRight: "8px" }}
                        />
                        {emp.fullName} ({emp.employeeCode})
                      </label>
                    ))}
                  </div>
                )}
              </div>
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
                name="stepType"
                value={formData.stepType}
                onChange={handleChange}
                className="fms-select"
              >
                <option value="sequential">Sequential (Waits for specific step)</option>
                <option value="parallel">Parallel (Can start immediately)</option>
              </select>
            </div>

            {formData.stepType === "sequential" && (
              <div className="fms-form-group">
                <label className="fms-label">Depends On (Prerequisites)</label>
                <div className="custom-multi-select" ref={dependsDropdownRef} style={{ position: "relative" }}>
                  <div 
                    className="fms-input" 
                    style={{ minHeight: "38px", display: "flex", flexWrap: "wrap", gap: "4px", padding: "4px 8px", cursor: "pointer", alignItems: "center" }}
                    onClick={() => setDependsDropdownOpen(!dependsDropdownOpen)}
                  >
                    {formData.dependsOnStepIds.length === 0 ? (
                      <span style={{ color: "#6c757d" }}>Select prerequisite steps...</span>
                    ) : (
                      formData.dependsOnStepIds.map(id => {
                        const step = allGlobalSteps.find(s => s.id === id);
                        if (!step) return null;
                        const isCurrent = step.fmsId === fmsId;
                        const mgrSteps = allGlobalSteps.filter(s => s.fmsId === step.fmsId);
                        const stepIndex = mgrSteps.findIndex(s => s.id === id);
                        return (
                          <span key={id} style={{ background: "#e9ecef", padding: "2px 8px", borderRadius: "12px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold" }}>
                            {isCurrent ? `Step-${stepIndex + 1}` : `[${step.managerName}] Step-${stepIndex + 1}`}
                            <span 
                              style={{ cursor: "pointer", color: "#dc3545", marginLeft: "4px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({
                                  ...prev,
                                  dependsOnStepIds: prev.dependsOnStepIds.filter(did => did !== id)
                                }));
                              }}
                            >
                              &times;
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>
                  
                  {dependsDropdownOpen && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #ced4da", borderRadius: "4px", marginTop: "4px", maxHeight: "250px", overflowY: "auto", zIndex: 10 }}>
                      {allGlobalSteps.length === 0 || (editingStepId && allGlobalSteps.length === 1) ? (
                        <div style={{ padding: "8px", color: "#6c757d" }}>No other steps available</div>
                      ) : (
                        Object.entries(
                          allGlobalSteps.reduce((acc, step) => {
                            if (!acc[step.managerName]) acc[step.managerName] = [];
                            acc[step.managerName].push(step);
                            return acc;
                          }, {} as Record<string, typeof allGlobalSteps>)
                        ).map(([managerName, mgrSteps]) => (
                          <div key={managerName}>
                            <div style={{ background: "#f1f5f9", padding: "4px 8px", fontSize: "0.8rem", fontWeight: "bold", color: "#475569" }}>
                              {managerName === fmsName ? `[Current] ${managerName}` : managerName}
                            </div>
                            {mgrSteps.map((step, index) => {
                              if (step.id === editingStepId) return null;
                              return (
                                <label key={step.id} style={{ display: "flex", alignItems: "center", padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f8f9fa", margin: 0 }}>
                                  <input
                                    type="checkbox"
                                    checked={formData.dependsOnStepIds.includes(step.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData(prev => ({ ...prev, dependsOnStepIds: [...prev.dependsOnStepIds, step.id] }));
                                      } else {
                                        setFormData(prev => ({ ...prev, dependsOnStepIds: prev.dependsOnStepIds.filter(id => id !== step.id) }));
                                      }
                                    }}
                                    style={{ marginRight: "8px" }}
                                  />
                                  <span style={{ fontWeight: "bold", display: "flex", flexDirection: "column" }}>
                                    Step-{index + 1}
                                    <span style={{ fontWeight: "normal", fontSize: "0.75rem", color: "#64748b" }}>{step.stepName}</span>
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="fms-form-group full-width" style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
              <button type="submit" className="fms-btn-primary">
                {editingStepId ? "UPDATE STEP" : "ADD STEP"}
              </button>
              {editingStepId && (
                <button 
                  type="button" 
                  style={{ background: "#6c757d", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => {
                    setEditingStepId(null);
                    setFormData({
                      stepName: "",
                      doerEmployeeIds: [],
                      timelineHours: 0,
                      timelineUnit: "hours",
                      dependsOnStepIds: [],
                      stepType: "sequential"
                    });
                  }}
                >
                  CANCEL EDIT
                </button>
              )}
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
                  <th className="fms-th">Depends On</th>
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
                    const emps = employees.filter(e => step.doerEmployeeIds?.includes(e.id));
                    let empNames = emps.length > 0 ? emps.map(e => e.fullName).join(", ") : "Form Creator (Dynamic)";
                    return (
                      <tr key={step.id} className="fms-tr">
                        <td className="fms-td">{index + 1}</td>
                        <td className="fms-td">{step.stepName}</td>
                        <td className="fms-td">{empNames}</td>
                        <td className="fms-td">{step.timelineHours} {step.timelineUnit}</td>
                        <td className="fms-td">
                          {(!step.dependsOnStepIds || step.dependsOnStepIds.length === 0) ? (
                            <span style={{ color: "#28a745", fontWeight: "bold" }}>Parallel (Start)</span>
                          ) : (
                            step.dependsOnStepIds.map(depId => {
                              const depStep = allGlobalSteps.find(s => s.id === depId);
                              if (!depStep) return null;
                              
                              const isCurrentFms = depStep.fmsId === fmsId;
                              const mgrSteps = allGlobalSteps.filter(s => s.fmsId === depStep.fmsId);
                              const depIndex = mgrSteps.findIndex(s => s.id === depId);
                              
                              return (
                                <div key={depId} style={{ fontSize: "0.80rem", background: isCurrentFms ? "#f8f9fa" : "#e0e7ff", padding: "3px 6px", borderRadius: "4px", marginBottom: "4px", display: "inline-block", marginRight: "4px", fontWeight: "bold", border: isCurrentFms ? "1px solid #dee2e6" : "1px solid #c7d2fe" }}>
                                  {isCurrentFms ? `Step-${depIndex + 1}` : `[${depStep.managerName}] Step-${depIndex + 1}`}
                                </div>
                              );
                            })
                          )}
                        </td>
                        <td className="fms-td">
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button 
                              type="button" 
                              style={{ background: "#007bff", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                              onClick={() => handleEditClick(step)}
                            >
                              Edit
                            </button>
                            <button 
                              type="button" 
                              style={{ background: "#dc3545", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                              onClick={() => handleDeleteStep(step.id)}
                            >
                              Delete
                            </button>
                          </div>
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
