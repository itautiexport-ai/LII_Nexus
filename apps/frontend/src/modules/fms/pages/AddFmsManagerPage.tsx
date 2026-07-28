import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fmsApi } from "../api/fmsApi";
import "./Fms.css";

export function AddFmsManagerPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    sopVideoLink: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === "radio") {
      setFormData((prev) => ({ ...prev, [name]: value === "yes" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fms = await fmsApi.create(formData);
      alert("FMS Manager basic details created successfully! Let's add some steps.");
      navigate(`/admin/fms/${fms.id}/steps`);
    } catch (err) {
      console.error(err);
      alert("Failed to create FMS Manager");
    }
  };

  return (
    <div className="fms-container">
      <div className="fms-card">
        <div className="fms-card-header">
          <h2 className="fms-title">FMS BASIC DETAILS</h2>
          <button className="fms-btn-primary" onClick={() => navigate("/admin/fms/list")}>
            BACK TO LIST
          </button>
        </div>
        
        <div className="fms-card-content">
          <form onSubmit={handleSubmit}>
            <div className="fms-grid">
              <div className="fms-form-group">
                <label className="fms-label">Name <span className="fms-required">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="fms-input"
                />
              </div>

              <div className="fms-form-group">
                <label className="fms-label">SOP Video Link</label>
                <input
                  type="url"
                  name="sopVideoLink"
                  value={formData.sopVideoLink}
                  onChange={handleChange}
                  className="fms-input"
                />
              </div>

              <div className="fms-form-group full-width">
                <label className="fms-label">Description <span className="fms-required">*</span></label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="fms-textarea"
                />
              </div>
            </div>

            <div>
              <button type="submit" className="fms-btn-primary">CREATE FMS</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
