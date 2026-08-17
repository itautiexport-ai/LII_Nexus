import React, { useState, useEffect } from "react";
import { performanceEvaluationApi, EvaluationData } from "../api/performanceEvaluationApi";
import { employeesApi } from "../../admin/organization/employees/api/employeesApi";

export default function HrEvaluationPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState<EvaluationData>({
    employeeId: "",
    evaluationPeriod: "",
    score: 0,
    comments: "",
    attendancePunctuality: 0,
    discipline: 0,
    behaviourAttitude: 0,
    communication: 0,
    responsibilityAccountability: 0,
    workEthics: 0,
    teamContribution: 0,
    attendancePercentage: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  useEffect(() => {
    employeesApi.listForDropdown().then(data => setEmployees(data)).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const isNumericField = ["attendancePunctuality", "discipline", "behaviourAttitude", "communication", "responsibilityAccountability", "workEthics", "teamContribution", "score", "attendancePercentage"].includes(name);
      
      const updatedValue = isNumericField ? (parseFloat(value) || 0) : value;
      
      const newData = { ...prev, [name]: updatedValue };

      if (isNumericField && name !== "score" && name !== "attendancePercentage") {
        const avg = ((newData.attendancePunctuality || 0) + (newData.discipline || 0) + (newData.behaviourAttitude || 0) + (newData.communication || 0) + (newData.responsibilityAccountability || 0) + (newData.workEthics || 0) + (newData.teamContribution || 0)) / 7;
        newData.score = parseFloat(avg.toFixed(2));
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      await performanceEvaluationApi.createHrEvaluation(formData);
      setMessage({ type: "success", text: "HR Evaluation saved successfully." });
      setFormData({ 
        employeeId: "", evaluationPeriod: "", score: 0, comments: "",
        attendancePunctuality: 0, discipline: 0, behaviourAttitude: 0, 
        communication: 0, responsibilityAccountability: 0, workEthics: 0, teamContribution: 0, attendancePercentage: 0
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save evaluation." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>HR Evaluation Form</h1>
      
      <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {message && (
          <div style={{ 
            backgroundColor: message.type === "success" ? "#d1fae5" : "#fee2e2", 
            color: message.type === "success" ? "#047857" : "#b91c1c", 
            padding: "12px", 
            borderRadius: "6px", 
            marginBottom: "24px" 
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "24px" }}>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Employee</label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              >
                <option value="">Select an Employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.employeeCode} - {emp.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Evaluation Week</label>
              <input 
                type="week" 
                name="evaluationPeriod" 
                value={formData.evaluationPeriod} 
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Attendance & Punctuality (0-5)</label>
                <input type="number" name="attendancePunctuality" value={formData.attendancePunctuality} onChange={handleChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Discipline (0-5)</label>
                <input type="number" name="discipline" value={formData.discipline} onChange={handleChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Behaviour & Attitude (0-5)</label>
                <input type="number" name="behaviourAttitude" value={formData.behaviourAttitude} onChange={handleChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Communication (0-5)</label>
                <input type="number" name="communication" value={formData.communication} onChange={handleChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Responsibility & Accountability (0-5)</label>
                <input type="number" name="responsibilityAccountability" value={formData.responsibilityAccountability} onChange={handleChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Work Ethics (0-5)</label>
                <input type="number" name="workEthics" value={formData.workEthics} onChange={handleChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Team Contribution (0-5)</label>
                <input type="number" name="teamContribution" value={formData.teamContribution} onChange={handleChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600", color: "#111827" }}>Overall Score (0-5) - Auto Calculated</label>
              <input 
                type="number" 
                name="score" 
                value={formData.score} 
                readOnly
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", backgroundColor: "#f3f4f6", color: "#4b5563", fontWeight: "bold" }}
              />
            </div>


            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Evaluation Comments</label>
              <textarea 
                name="comments" 
                value={formData.comments} 
                onChange={handleChange}
                required
                rows={5}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                backgroundColor: "#2563eb",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "6px",
                fontWeight: "500",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? "Saving..." : "Submit HR Evaluation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
