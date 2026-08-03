import React, { useState, useEffect } from "react";
import { standaloneChecklistApi } from "../api/checklistApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
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

  return (
    <div className="chk-container">
      <div className="chk-card">
        <div className="chk-card-header">
          <h2 className="chk-title">ADD CHECKLIST</h2>

        </div>
        
        <div className="chk-card-content">
          <form onSubmit={handleSubmit}>
            <div className="chk-grid">
              
              <div className="chk-form-group">
                <label className="chk-label">Assign By <span className="chk-required">*</span></label>
                <select name="assignBy" required value={formData.assignBy} onChange={handleChange} className="chk-select">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                </select>
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Task Name <span className="chk-required">*</span></label>
                <input type="text" name="taskName" required value={formData.taskName} onChange={handleChange} className="chk-input" placeholder="Enter task name" />
              </div>

              <div className="chk-form-group">
                <label className="chk-label">Assign to <span className="chk-required">*</span></label>
                <select name="assignTo" required value={formData.assignTo} onChange={handleChange} className="chk-select">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                </select>
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
                <input type="text" name="frequency" required value={formData.frequency} onChange={handleChange} className="chk-input" placeholder="e.g. Daily, Weekly" />
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
              <button type="submit" className="chk-btn-primary">Save Checklist</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
