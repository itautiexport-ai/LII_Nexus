import React, { useState, useEffect } from "react";
import { standaloneChecklistApi } from "../api/checklistApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { CustomSelect } from "../../../shared/components/CustomSelect";
import * as XLSX from "xlsx";
import "./Checklist.css";

export function AddChecklistPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [formData, setFormData] = useState({
    taskName: "",
    assignBy: "",
    assignTo: "",
    plannedDate: "",
    priority: "Low" as "Low" | "Medium" | "High",
    makeAttachmentMandatory: false,
    makeNoteMandatory: false,
    mode: "Online",
    frequency: "",
    remindBeforeDays: 0,
    skipOnHolidays: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    employeesApi.list().then(setEmployees).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "remindBeforeDays") {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await standaloneChecklistApi.create({
        ...formData,
        plannedDate: new Date(formData.plannedDate).toISOString()
      });
      alert("Checklist created successfully!");
      setFormData({
        taskName: "",
        assignBy: "",
        assignTo: "",
        plannedDate: "",
        priority: "Low",
        makeAttachmentMandatory: false,
        makeNoteMandatory: false,
        mode: "Online",
        frequency: "",
        remindBeforeDays: 0,
        skipOnHolidays: false,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create checklist");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const row of data as any[]) {
          const taskName = row["Task Name"];
          const assignToName = row["Assign To"];
          const assignByName = row["Assign By"];
          const plannedDateRaw = row["Planned Date"];
          const priorityRaw = row["Priority"];
          const attachmentReq = row["Make Attachment Mandatory"];
          const noteReq = row["Make Note Mandatory"];
          const modeRaw = row["Mode"];
          const freqRaw = row["Frequency"];
          const remindRaw = row["Remind Before Days"];
          const skipHolidaysRaw = row["Skip On Holidays"];

          if (!taskName || !assignToName || !assignByName || !plannedDateRaw) {
            failCount++;
            continue;
          }

          const assignToEmp = employees.find(emp => emp.fullName.toLowerCase() === assignToName.toString().toLowerCase());
          const assignByEmp = employees.find(emp => emp.fullName.toLowerCase() === assignByName.toString().toLowerCase());

          if (!assignToEmp || !assignByEmp) {
            failCount++;
            continue;
          }

          let plannedDateStr = plannedDateRaw;
          if (typeof plannedDateRaw === 'number') {
            const date = new Date(Math.round((plannedDateRaw - 25569) * 86400 * 1000));
            plannedDateStr = date.toISOString();
          } else {
            plannedDateStr = new Date(plannedDateRaw).toISOString();
          }

          const priority = (priorityRaw?.toString()) || "Low";
          const mode = (modeRaw?.toString()) || "Online";
          const frequency = (freqRaw?.toString()) || "Daily";
          const remindBeforeDays = parseInt(remindRaw) || 0;

          const makeAttachmentMandatory = (attachmentReq?.toString().toLowerCase() === "yes" || attachmentReq === true);
          const makeNoteMandatory = (noteReq?.toString().toLowerCase() === "yes" || noteReq === true);
          const skipOnHolidays = (skipHolidaysRaw?.toString().toLowerCase() === "yes" || skipHolidaysRaw === true);

          try {
            await standaloneChecklistApi.create({
              taskName,
              assignBy: assignByEmp.id,
              assignTo: assignToEmp.id,
              plannedDate: plannedDateStr,
              priority: priority as any,
              makeAttachmentMandatory,
              makeNoteMandatory,
              mode,
              frequency,
              remindBeforeDays,
              skipOnHolidays
            });
            successCount++;
          } catch (err) {
            failCount++;
          }
        }

        alert(`Bulk Upload Complete.\nSuccess: ${successCount}\nFailed/Skipped: ${failCount}`);
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file.");
      } finally {
        setLoading(false);
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="chk-container">
      <div className="chk-card">
        <div className="chk-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="chk-title" style={{ margin: 0 }}>ADD CHECKLIST</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ background: "#10b981", color: "white", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 600, textTransform: "uppercase" }}>
              Upload Excel
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
            <a href="/formats/Checklist_Upload_Format.xlsx" download style={{ color: "#3B82F6", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Download Template</a>
          </div>
        </div>
        
        <div className="chk-card-content">
          <form onSubmit={handleSubmit}>
            <div className="chk-grid">
              
              <div className="chk-form-group">
                <label className="chk-label">Assign By <span className="chk-required">*</span></label>
                <CustomSelect 
                  name="assignBy" 
                  required 
                  value={formData.assignBy} 
                  onChange={handleChange as any} 
                  className="chk-select"
                  placeholder="Select Employee"
                  options={employees.map(e => ({ value: e.id, label: e.fullName }))}
                />
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Task Name <span className="chk-required">*</span></label>
                <input type="text" name="taskName" required value={formData.taskName} onChange={handleChange} className="chk-input" placeholder="Enter task name" />
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Assign to <span className="chk-required">*</span></label>
                <CustomSelect 
                  name="assignTo" 
                  required 
                  value={formData.assignTo} 
                  onChange={handleChange as any} 
                  className="chk-select"
                  placeholder="Select Employee"
                  options={employees.map(e => ({ value: e.id, label: e.fullName }))}
                />
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Planned Date <span className="chk-required">*</span></label>
                <input type="datetime-local" name="plannedDate" required value={formData.plannedDate} onChange={handleChange} className="chk-input" />
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Priority <span className="chk-required">*</span></label>
                <select name="priority" required value={formData.priority} onChange={handleChange} className="chk-select">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="chk-form-group" style={{ justifyContent: 'center' }}>
                <label className="chk-checkbox-group">
                  <input type="checkbox" name="makeAttachmentMandatory" checked={formData.makeAttachmentMandatory} onChange={handleChange} className="chk-checkbox" />
                  <span className="chk-checkbox-label">Make Attachment Mandatory When Work Done</span>
                </label>
              </div>

              <div className="chk-form-group" style={{ justifyContent: 'center' }}>
                <label className="chk-checkbox-group">
                  <input type="checkbox" name="makeNoteMandatory" checked={formData.makeNoteMandatory} onChange={handleChange} className="chk-checkbox" />
                  <span className="chk-checkbox-label">Make Note Mandatory When Work Done</span>
                </label>
              </div>
            </div>

            <hr className="chk-divider" />

            <div className="chk-grid">
              <div className="chk-form-group">
                <label className="chk-label">Mode <span className="chk-required">*</span></label>
                <select name="mode" required value={formData.mode} onChange={handleChange} className="chk-select">
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Frequency <span className="chk-required">*</span></label>
                <select name="frequency" required value={formData.frequency} onChange={handleChange} className="chk-select">
                  <option value="">Select Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly(M)">Monthly(M)</option>
                  <option value="Quarterly(Q)">Quarterly(Q)</option>
                  <option value="Yearly(Y)">Yearly(Y)</option>
                  <option value="Between week(BW)">Between week(BW)</option>
                  <option value="Between month(BM)">Between month(BM)</option>
                  <option value="As Required">As Required</option>
                  <option value="Alternate">Alternate</option>
                </select>
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Remind Before Days <span className="chk-required">*</span></label>
                <input type="number" name="remindBeforeDays" required min={0} value={formData.remindBeforeDays} onChange={handleChange} className="chk-input" />
              </div>

              <div className="chk-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="chk-checkbox-group">
                  <input type="checkbox" name="skipOnHolidays" checked={formData.skipOnHolidays} onChange={handleChange} className="chk-checkbox" />
                  <span className="chk-checkbox-label">Skip Checklist On Holidays</span>
                </label>
              </div>
            </div>

            <div className="chk-actions">
              <button type="submit" disabled={loading} className="chk-btn-primary">
                {loading ? "Saving..." : "Save Checklist"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
