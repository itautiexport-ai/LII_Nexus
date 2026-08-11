import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmsApi, FmsStep, FmsManager } from "../api/fmsApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import "./Fms.css";

export function ManageFmsStepsPage() {
  const { fmsId } = useParams();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<FmsStep[]>([]);
  const [allGlobalSteps, setAllGlobalSteps] = useState<(FmsStep & { managerName: string })[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [fmsList, setFmsList] = useState<FmsManager[]>([]);
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
  
  // Prerequisite dependency modal/dropdown state
  const [dependsDropdownOpen, setDependsDropdownOpen] = useState(false);
  const [depTab, setDepTab] = useState<"current" | "other">("current");
  const [selectedOtherFmsId, setSelectedOtherFmsId] = useState<string>("all");
  const [depSearchQuery, setDepSearchQuery] = useState("");
  const dependsDropdownRef = useRef<HTMLDivElement>(null);

  // Step insertion & position state
  const [insertPosition, setInsertPosition] = useState<"end" | "start" | number>("end");
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

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
          employeesApi.listForDropdown(),
          fmsApi.getAll(),
          fmsApi.getAllStepsGlobal()
        ]);
        setSteps(stepsRes);
        setAllGlobalSteps(globalStepsRes);
        setEmployees(empRes);
        setFmsList(fmsListRes);
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
        // Calculate sequence order for insertion
        let targetSequenceOrder: number | undefined = undefined;
        if (insertPosition === "start") {
          targetSequenceOrder = 0;
        } else if (typeof insertPosition === "number") {
          targetSequenceOrder = insertPosition + 1;
        } else {
          targetSequenceOrder = steps.length;
        }

        await fmsApi.addStep(fmsId, {
          stepName: formData.stepName,
          doerEmployeeIds: formData.doerEmployeeIds,
          timelineHours: formData.timelineHours,
          timelineUnit: formData.timelineUnit,
          dependsOnStepIds: formData.dependsOnStepIds,
          sequenceOrder: targetSequenceOrder,
        });

        const updatedSteps = await fmsApi.getSteps(fmsId);
        setSteps(updatedSteps);
      }
      
      const refreshedGlobal = await fmsApi.getAllStepsGlobal();
      setAllGlobalSteps(refreshedGlobal);

      setFormData({
        stepName: "",
        doerEmployeeIds: [],
        timelineHours: 0,
        timelineUnit: "hours",
        dependsOnStepIds: [],
        stepType: "sequential",
      });
      setInsertPosition("end");
    } catch (err: any) {
      console.error(err);
      const serverMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
      alert(editingStepId ? `Failed to update step: ${serverMsg}` : `Failed to add step: ${serverMsg}`);
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

  const handleInsertAfterClick = (step: FmsStep, stepIndex: number) => {
    setEditingStepId(null);
    setInsertPosition(stepIndex);
    setFormData({
      stepName: "",
      doerEmployeeIds: [],
      timelineHours: 0,
      timelineUnit: "hours",
      dependsOnStepIds: [step.id],
      stepType: "sequential",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReorderStep = async (stepId: string, direction: "up" | "down") => {
    if (!fmsId) return;
    try {
      await fmsApi.reorderStep(stepId, direction);
      const updatedSteps = await fmsApi.getSteps(fmsId);
      setSteps(updatedSteps);
      const refreshedGlobal = await fmsApi.getAllStepsGlobal();
      setAllGlobalSteps(refreshedGlobal);
    } catch (err: any) {
      console.error(err);
      const serverMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
      alert(`Failed to reorder step: ${serverMsg}`);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("Are you sure you want to delete this step?")) return;
    try {
      await fmsApi.deleteStep(stepId);
      setSteps((prev) => prev.filter((s) => s.id !== stepId));
      setAllGlobalSteps((prev) => prev.filter((s) => s.id !== stepId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete step");
    }
  };

  // Filter steps for current FMS vs other FMSs
  const currentFmsSteps = allGlobalSteps.filter(s => s.fmsId === fmsId && s.id !== editingStepId);
  const otherFmsSteps = allGlobalSteps.filter(s => s.fmsId !== fmsId);
  const otherFmsOptions = fmsList.filter(f => f.id !== fmsId);

  // Selected counts
  const currentSelectedCount = formData.dependsOnStepIds.filter(id => {
    const s = allGlobalSteps.find(g => g.id === id);
    return s && s.fmsId === fmsId;
  }).length;

  const otherSelectedCount = formData.dependsOnStepIds.filter(id => {
    const s = allGlobalSteps.find(g => g.id === id);
    return s && s.fmsId !== fmsId;
  }).length;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="fms-container">
      <div className="fms-card">
        <div className="fms-card-header">
          <h2 className="fms-title">MANAGE STEPS: {fmsName.toUpperCase()}</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsSavedModalOpen(true)}
              style={{ background: "#22c55e", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
            >
              💾 SAVE & FINALIZE FMS
            </button>
            <button 
              className="fms-btn-primary" 
              onClick={() => navigate("/admin/fms/list")}
              style={{ background: "#ffc107", color: "#333", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
            >
              BACK TO LIST
            </button>
          </div>
        </div>

        <div className="fms-card-content">

          {/* Insertion Banner */}
          {!editingStepId && typeof insertPosition === "number" && steps[insertPosition] && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "10px 16px", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#1e40af", fontWeight: "bold", fontSize: "0.9rem" }}>
                ➕ Inserting new step right after <u>Step-{insertPosition + 1}: {steps[insertPosition].stepName}</u>
              </span>
              <button 
                type="button" 
                onClick={() => {
                  setInsertPosition("end");
                  setFormData(prev => ({ ...prev, dependsOnStepIds: [] }));
                }}
                style={{ background: "transparent", border: "none", color: "#dc2626", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Reset to End
              </button>
            </div>
          )}

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

            {/* Step Position Field */}
            {!editingStepId && (
              <div className="fms-form-group">
                <label className="fms-label">Step Position (Where to Insert)</label>
                <select
                  value={typeof insertPosition === "number" ? insertPosition : insertPosition}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "end" || val === "start") {
                      setInsertPosition(val);
                    } else {
                      const numIdx = parseInt(val, 10);
                      setInsertPosition(numIdx);
                      const targetStep = steps[numIdx];
                      if (targetStep && formData.stepType === "sequential") {
                        setFormData(prev => ({
                          ...prev,
                          dependsOnStepIds: prev.dependsOnStepIds.includes(targetStep.id) ? prev.dependsOnStepIds : [...prev.dependsOnStepIds, targetStep.id]
                        }));
                      }
                    }
                  }}
                  className="fms-select"
                  style={{ background: typeof insertPosition === "number" ? "#eff6ff" : "white" }}
                >
                  <option value="end">📌 Append at the end (Step {steps.length + 1})</option>
                  <option value="start">⏫ Insert at the beginning (As Step 1)</option>
                  {steps.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      📍 Insert after Step-{idx + 1}: {s.stepName}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              <div className="fms-form-group full-width">
                <label className="fms-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Depends On (Prerequisites)</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    Select steps from current or other FMS workflows
                  </span>
                </label>
                
                <div className="custom-multi-select" ref={dependsDropdownRef} style={{ position: "relative" }}>
                  <div 
                    className="fms-input" 
                    style={{ minHeight: "42px", display: "flex", flexWrap: "wrap", gap: "6px", padding: "6px 10px", cursor: "pointer", alignItems: "center" }}
                    onClick={() => {
                      setDependsDropdownOpen(!dependsDropdownOpen);
                      setDepSearchQuery("");
                    }}
                  >
                    {formData.dependsOnStepIds.length === 0 ? (
                      <span style={{ color: "#6c757d" }}>Select prerequisite steps from current or external FMS...</span>
                    ) : (
                      formData.dependsOnStepIds.map(id => {
                        const step = allGlobalSteps.find(s => s.id === id);
                        if (!step) return null;
                        const isCurrent = step.fmsId === fmsId;
                        const mgrSteps = allGlobalSteps.filter(s => s.fmsId === step.fmsId);
                        const stepIndex = mgrSteps.findIndex(s => s.id === id);
                        
                        return (
                          <span 
                            key={id} 
                            style={{ 
                              background: isCurrent ? "#eff6ff" : "#faf5ff", 
                              color: isCurrent ? "#1e40af" : "#6b21a8",
                              border: isCurrent ? "1px solid #bfdbfe" : "1px solid #e9d5ff",
                              padding: "4px 10px", 
                              borderRadius: "16px", 
                              fontSize: "0.82rem", 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "6px", 
                              fontWeight: 600 
                            }}
                          >
                            <span>{isCurrent ? "🏠 Current:" : `🌐 [${step.managerName}]:`} Step-{stepIndex + 1} ({step.stepName})</span>
                            <span 
                              style={{ cursor: "pointer", color: "#dc3545", marginLeft: "4px", fontSize: "1rem", lineHeight: "1" }}
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
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", marginTop: "6px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", zIndex: 20, overflow: "hidden" }}>
                      
                      {/* Tabs Header */}
                      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDepTab("current");
                          }}
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            border: "none",
                            borderBottom: depTab === "current" ? "3px solid #2563eb" : "3px solid transparent",
                            background: depTab === "current" ? "#ffffff" : "transparent",
                            fontWeight: depTab === "current" ? "bold" : "600",
                            color: depTab === "current" ? "#1d4ed8" : "#64748b",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          🏠 Within Current FMS
                          {currentSelectedCount > 0 && (
                            <span style={{ background: "#2563eb", color: "white", borderRadius: "10px", padding: "1px 6px", fontSize: "0.75rem" }}>
                              {currentSelectedCount}
                            </span>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDepTab("other");
                          }}
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            border: "none",
                            borderBottom: depTab === "other" ? "3px solid #9333ea" : "3px solid transparent",
                            background: depTab === "other" ? "#ffffff" : "transparent",
                            fontWeight: depTab === "other" ? "bold" : "600",
                            color: depTab === "other" ? "#7e22ce" : "#64748b",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          🌐 From Other FMS Workflows
                          {otherSelectedCount > 0 && (
                            <span style={{ background: "#9333ea", color: "white", borderRadius: "10px", padding: "1px 6px", fontSize: "0.75rem" }}>
                              {otherSelectedCount}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Search & Filter Bar */}
                      <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", gap: "8px" }}>
                        {depTab === "other" && (
                          <select
                            value={selectedOtherFmsId}
                            onChange={(e) => setSelectedOtherFmsId(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "white", maxWidth: "45%" }}
                          >
                            <option value="all">All Other FMS Workflows</option>
                            {otherFmsOptions.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          placeholder={depTab === "current" ? "Search current FMS steps..." : "Search external steps or workflows..."}
                          value={depSearchQuery}
                          onChange={(e) => setDepSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ flex: 1, padding: "6px 10px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                          autoFocus
                        />
                      </div>

                      {/* Content Panel */}
                      <div style={{ maxHeight: "240px", overflowY: "auto", padding: "4px 0" }}>
                        {depTab === "current" ? (
                          currentFmsSteps.length === 0 ? (
                            <div style={{ padding: "16px", color: "#64748b", textAlign: "center", fontSize: "0.85rem" }}>
                              No other steps exist in this current FMS yet.
                            </div>
                          ) : (
                            currentFmsSteps
                              .filter(step => step.stepName.toLowerCase().includes(depSearchQuery.toLowerCase()))
                              .map((step) => {
                                const stepIndex = currentFmsSteps.findIndex(s => s.id === step.id);
                                return (
                                  <label 
                                    key={step.id} 
                                    style={{ 
                                      display: "flex", 
                                      alignItems: "center", 
                                      padding: "10px 14px", 
                                      cursor: "pointer", 
                                      borderBottom: "1px solid #f1f5f9", 
                                      margin: 0,
                                      background: formData.dependsOnStepIds.includes(step.id) ? "#f0f9ff" : "transparent"
                                    }}
                                  >
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
                                      style={{ marginRight: "10px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                                    />
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b" }}>
                                        Step-{stepIndex + 1}: {step.stepName}
                                      </span>
                                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                        Timeline: {step.timelineHours} {step.timelineUnit}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })
                          )
                        ) : (
                          otherFmsSteps.length === 0 ? (
                            <div style={{ padding: "16px", color: "#64748b", textAlign: "center", fontSize: "0.85rem" }}>
                              No other FMS workflows or steps found.
                            </div>
                          ) : (
                            Object.entries(
                              otherFmsSteps
                                .filter(s => selectedOtherFmsId === "all" || s.fmsId === selectedOtherFmsId)
                                .filter(s => s.stepName.toLowerCase().includes(depSearchQuery.toLowerCase()) || s.managerName.toLowerCase().includes(depSearchQuery.toLowerCase()))
                                .reduce((acc, step) => {
                                  if (!acc[step.managerName]) acc[step.managerName] = [];
                                  acc[step.managerName].push(step);
                                  return acc;
                                }, {} as Record<string, typeof otherFmsSteps>)
                            ).map(([managerName, mgrSteps]) => (
                              <div key={managerName}>
                                <div style={{ background: "#f3e8ff", padding: "6px 14px", fontSize: "0.80rem", fontWeight: "bold", color: "#6b21a8", borderTop: "1px solid #e9d5ff", borderBottom: "1px solid #e9d5ff" }}>
                                  🌐 WORKFLOW: {managerName}
                                </div>
                                {mgrSteps.map((step) => {
                                  const allMgrSteps = allGlobalSteps.filter(s => s.fmsId === step.fmsId);
                                  const stepIndex = allMgrSteps.findIndex(s => s.id === step.id);
                                  return (
                                    <label 
                                      key={step.id} 
                                      style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        padding: "10px 14px", 
                                        cursor: "pointer", 
                                        borderBottom: "1px solid #f1f5f9", 
                                        margin: 0,
                                        background: formData.dependsOnStepIds.includes(step.id) ? "#faf5ff" : "transparent"
                                      }}
                                    >
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
                                        style={{ marginRight: "10px", width: "16px", height: "16px", accentColor: "#9333ea" }}
                                      />
                                      <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b" }}>
                                          Step-{stepIndex + 1}: {step.stepName}
                                        </span>
                                        <span style={{ fontSize: "0.75rem", color: "#7e22ce" }}>
                                          Workflow: {managerName}
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            ))
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="fms-form-group full-width" style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
              <button type="submit" className="fms-btn-primary">
                {editingStepId ? "UPDATE STEP" : (typeof insertPosition === "number" ? `INSERT STEP AFTER STEP-${insertPosition + 1}` : "ADD STEP")}
              </button>
              {(editingStepId || typeof insertPosition === "number") && (
                <button 
                  type="button" 
                  style={{ background: "#6c757d", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => {
                    setEditingStepId(null);
                    setInsertPosition("end");
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
                  CANCEL
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
                  <th className="fms-th">Actions & Reorder</th>
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
                        <td className="fms-td" style={{ fontWeight: "bold" }}>{index + 1}</td>
                        <td className="fms-td" style={{ fontWeight: 600 }}>{step.stepName}</td>
                        <td className="fms-td">{empNames}</td>
                        <td className="fms-td">{step.timelineHours} {step.timelineUnit}</td>
                        <td className="fms-td">
                          {(!step.dependsOnStepIds || step.dependsOnStepIds.length === 0) ? (
                            <span style={{ color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: "12px", fontSize: "0.80rem", fontWeight: "bold" }}>
                              Parallel (Start immediately)
                            </span>
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {step.dependsOnStepIds.map(depId => {
                                const depStep = allGlobalSteps.find(s => s.id === depId);
                                if (!depStep) return null;
                                
                                const isCurrentFms = depStep.fmsId === fmsId;
                                const mgrSteps = allGlobalSteps.filter(s => s.fmsId === depStep.fmsId);
                                const depIndex = mgrSteps.findIndex(s => s.id === depId);
                                
                                return (
                                  <div 
                                    key={depId} 
                                    style={{ 
                                      fontSize: "0.78rem", 
                                      background: isCurrentFms ? "#eff6ff" : "#faf5ff", 
                                      color: isCurrentFms ? "#1d4ed8" : "#7e22ce",
                                      border: isCurrentFms ? "1px solid #bfdbfe" : "1px solid #e9d5ff",
                                      padding: "3px 8px", 
                                      borderRadius: "6px", 
                                      fontWeight: "bold",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px"
                                    }}
                                  >
                                    {isCurrentFms ? (
                                      <span>🏠 Step-{depIndex + 1} ({depStep.stepName})</span>
                                    ) : (
                                      <span>🌐 [{depStep.managerName}] Step-{depIndex + 1} ({depStep.stepName})</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="fms-td">
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                            
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              title="Move Up"
                              disabled={index === 0}
                              onClick={() => handleReorderStep(step.id, "up")}
                              style={{ 
                                background: index === 0 ? "#f1f5f9" : "#e2e8f0", 
                                color: index === 0 ? "#cbd5e1" : "#1e293b", 
                                border: "1px solid #cbd5e1", 
                                padding: "4px 8px", 
                                borderRadius: "4px", 
                                cursor: index === 0 ? "not-allowed" : "pointer",
                                fontWeight: "bold"
                              }}
                            >
                              ⬆
                            </button>
                            
                            <button
                              type="button"
                              title="Move Down"
                              disabled={index === steps.length - 1}
                              onClick={() => handleReorderStep(step.id, "down")}
                              style={{ 
                                background: index === steps.length - 1 ? "#f1f5f9" : "#e2e8f0", 
                                color: index === steps.length - 1 ? "#cbd5e1" : "#1e293b", 
                                border: "1px solid #cbd5e1", 
                                padding: "4px 8px", 
                                borderRadius: "4px", 
                                cursor: index === steps.length - 1 ? "not-allowed" : "pointer",
                                fontWeight: "bold"
                              }}
                            >
                              ⬇
                            </button>

                            {/* Insert Step After Button */}
                            <button 
                              type="button" 
                              style={{ background: "#0284c7", color: "white", border: "none", padding: "5px 9px", borderRadius: "4px", cursor: "pointer", fontWeight: 600, fontSize: "0.80rem" }}
                              onClick={() => handleInsertAfterClick(step, index)}
                            >
                              ➕ Insert After
                            </button>

                            <button 
                              type="button" 
                              style={{ background: "#2563eb", color: "white", border: "none", padding: "5px 9px", borderRadius: "4px", cursor: "pointer", fontWeight: 600, fontSize: "0.80rem" }}
                              onClick={() => handleEditClick(step)}
                            >
                              Edit
                            </button>
                            
                            <button 
                              type="button" 
                              style={{ background: "#dc2626", color: "white", border: "none", padding: "5px 9px", borderRadius: "4px", cursor: "pointer", fontWeight: 600, fontSize: "0.80rem" }}
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

          {/* Finalization / Save & Finish Section at the End */}
          <div style={{ marginTop: "3rem", padding: "24px", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderRadius: "12px", border: "1px solid #bbf7d0", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#15803d", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                  🎉 WORKFLOW CONFIGURATION COMPLETE: {fmsName.toUpperCase()}
                </h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", color: "#166534" }}>
                  You have configured <strong>{steps.length} step(s)</strong> for this FMS workflow. All changes are saved in real-time. Choose an option below to complete setup:
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setIsSavedModalOpen(true)}
                  style={{
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "0.92rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)"
                  }}
                >
                  💾 SAVE & FINALIZE FMS
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const ref = prompt(`Enter Reference/Order ID to start an instance of FMS '${fmsName}':`);
                    if (!ref) return;
                    try {
                      await fmsApi.startInstance(fmsId!, ref);
                      alert(`Successfully started FMS instance for ${ref}!`);
                      navigate(`/admin/fms/${fmsId}/grid`);
                    } catch (err) {
                      console.error(err);
                      alert("Failed to start FMS instance");
                    }
                  }}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "0.92rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  🚀 SAVE & START FMS INSTANCE
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/admin/fms/${fmsId}/grid`)}
                  style={{
                    background: "#0891b2",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "0.92rem",
                    cursor: "pointer"
                  }}
                >
                  📊 VIEW GRID
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Completion & Finalization Modal */}
      {isSavedModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "32px", maxWidth: "520px", width: "90%", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>✅</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "1.35rem", fontWeight: "bold" }}>
              FMS Workflow Saved Successfully!
            </h3>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginBottom: "24px", lineHeight: "1.5" }}>
              The FMS workflow <strong>"{fmsName}"</strong> is completely set up with <strong>{steps.length} step(s)</strong> and ready for operational execution.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={async () => {
                  setIsSavedModalOpen(false);
                  const ref = prompt(`Enter Reference/Order ID to start an instance of FMS '${fmsName}':`);
                  if (!ref) return;
                  try {
                    await fmsApi.startInstance(fmsId!, ref);
                    alert(`Successfully started FMS instance for ${ref}!`);
                    navigate(`/admin/fms/${fmsId}/grid`);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to start FMS instance");
                  }
                }}
                style={{ background: "#2563eb", color: "white", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}
              >
                🚀 Start FMS Instance Now
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSavedModalOpen(false);
                  navigate("/admin/fms/list");
                }}
                style={{ background: "#16a34a", color: "white", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}
              >
                📋 Return to FMS Managers List
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSavedModalOpen(false);
                  navigate(`/admin/fms/${fmsId}/grid`);
                }}
                style={{ background: "#0891b2", color: "white", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}
              >
                📊 View Live Grid View
              </button>

              <button
                type="button"
                onClick={() => setIsSavedModalOpen(false)}
                style={{ background: "transparent", color: "#64748b", border: "none", padding: "8px", cursor: "pointer", fontSize: "0.85rem", marginTop: "4px" }}
              >
                Close & Continue Editing Steps
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

