import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { noticeTemplates, NoticeTemplate } from "../data/noticeTemplates";
import { noticesApi, IssuedNotice } from "../api/noticesApi";
import { departmentsApi, DepartmentRecord, DepartmentDropdownRecord } from "../../admin/organization/departments/api/departmentsApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import "./NoticesPage.css";

export default function NoticesPage() {
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [history, setHistory] = useState<IssuedNotice[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentDropdownRecord[]>([]);
  
  // Form States
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [personType, setPersonType] = useState<"Employee" | "Worker">("Employee");
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dynamicInputs, setDynamicInputs] = useState<Record<string, string>>({});
  
  // Modal State
  const [viewNotice, setViewNotice] = useState<IssuedNotice | null>(null);

  const categories = Array.from(new Set(noticeTemplates.map(t => t.category)));
  const filteredTemplates = noticeTemplates.filter(t => t.category === selectedCategory);
  const selectedTemplate = noticeTemplates.find(t => t.id === selectedTemplateId) || null;

  useEffect(() => {
    departmentsApi.listForDropdown().then(setDepartmentsList).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const data = await noticesApi.getNotices();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const user = useAuthStore(s => s.user);
  const isAdmin = user?.roles.includes("System Admin");

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice? This action cannot be undone.")) return;
    try {
      await noticesApi.deleteNotice(id);
      fetchHistory(); // Refresh the list
    } catch (e) {
      console.error("Failed to delete notice", e);
      alert("Failed to delete notice.");
    }
  };

  const getReplacedContent = (content: string) => {
    let replaced = content;
    if (selectedTemplate) {
      selectedTemplate.dynamicFields.forEach(field => {
        replaced = replaced.replace(new RegExp(`{${field}}`, 'g'), dynamicInputs[field] || `[${field}]`);
      });
    }
    return replaced;
  };

  const handlePrintAndSave = async () => {
    if (!selectedTemplate) return;
    try {
      const compiledBody = getReplacedContent(selectedTemplate.content);
      
      await noticesApi.createNotice({
        employee_name: employeeName || "General",
        person_type: personType,
        department: department || "All",
        notice_type: selectedTemplate.title,
        category: selectedTemplate.category,
        issue_date: issueDate,
        letter_body: compiledBody
      });
      window.print();
    } catch (e) {
      console.error(e);
      alert("Failed to save notice. Printing anyway.");
      window.print();
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById("print-area");
    if (!element) return;
    
    // Temporarily remove scale transform and isolate from parent overflow hiding
    const originalTransform = element.style.transform;
    const originalMarginBottom = element.style.marginBottom;
    const originalPosition = element.style.position;
    const originalZIndex = element.style.zIndex;
    
    element.style.transform = 'none';
    element.style.marginBottom = '0';
    element.style.position = 'absolute';
    element.style.zIndex = '9999';
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      });
      const data = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.href = data;
      link.download = `notice-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export image", err);
      alert("Failed to download image.");
    } finally {
      // Restore styles
      element.style.transform = originalTransform;
      element.style.marginBottom = originalMarginBottom;
      element.style.position = originalPosition;
      element.style.zIndex = originalZIndex;
    }
  };

  return (
    <div className="notices-page">
      
      {/* HEADER */}
      <div className="notices-header no-print">
        <h1 className="notices-title">HR Notice Generator</h1>
        <div className="notices-tabs">
          <button 
            className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Generate Notice
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Issued History
          </button>
        </div>
      </div>

      {/* FORM & PREVIEW TAB */}
      {activeTab === "form" && (
        <div className="notices-layout no-print">
          
          {/* LEFT: FORM BUILDER */}
          <div className="notices-form-container">
            <div className="form-header">
              <h2>Notice Details</h2>
            </div>
            
            <div className="form-body">
              <div className="form-group">
                <label>Notice Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedTemplateId(""); // Reset template when category changes
                  }}
                  className="form-control"
                >
                  <option value="">Select a Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {selectedCategory && (
                <div className="form-group">
                  <label>Notice Title</label>
                  <select 
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select Notice Title</option>
                    {filteredTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTemplate && (
                <>
                  <div className="form-group" style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f1f3f5" }}>
                    <label>Person Type</label>
                    <select 
                      value={personType}
                      onChange={(e) => setPersonType(e.target.value as "Employee" | "Worker")}
                      className="form-control"
                    >
                      <option value="Employee">Employee (Staff)</option>
                      <option value="Worker">Worker</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Name</label>
                    <input 
                      type="text" 
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="e.g. Shravan Lal"
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <select 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="form-control"
                    >
                      <option value="">Select Department</option>
                      {departmentsList.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Issue Date</label>
                    <input 
                      type="date" 
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  {selectedTemplate.dynamicFields.length > 0 && (
                    <div className="dynamic-fields-section">
                      <div className="dynamic-fields-title">Dynamic Fields</div>
                      {selectedTemplate.dynamicFields.map(field => (
                        <div className="form-group" key={field}>
                          <label style={{ textTransform: "capitalize" }}>
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          {field === 'babyGender' ? (
                            <select 
                              value={dynamicInputs[field] || ""}
                              onChange={(e) => setDynamicInputs({...dynamicInputs, [field]: e.target.value})}
                              className="form-control"
                            >
                              <option value="">Select Gender</option>
                              <option value="पुत्र (Baby Boy)">पुत्र (Baby Boy)</option>
                              <option value="पुत्री (Baby Girl)">पुत्री (Baby Girl)</option>
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              value={dynamicInputs[field] || ""}
                              onChange={(e) => setDynamicInputs({...dynamicInputs, [field]: e.target.value})}
                              placeholder={`Enter ${field}`}
                              className="form-control"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedTemplate && (
              <div className="form-footer" style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handlePrintAndSave} className="btn-primary" style={{ flex: 1 }}>
                  Save & Print
                </button>
                <button onClick={handleDownloadImage} className="btn-primary" style={{ flex: 1, backgroundColor: '#10b981' }}>
                  Download Image
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: LIVE PREVIEW */}
          <div className="notices-preview-container">
            {!selectedTemplate ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h2>Select a Notice Template</h2>
                <p>The live A4 preview will appear here.</p>
              </div>
            ) : (
              <div id="print-area" className={`a4-page ${selectedTemplate.id === 'birthday' ? 'birthday-theme' : ''} ${selectedTemplate.id === 'anniversary' ? 'anniversary-theme' : ''} ${selectedTemplate.id === 'marriage_anniversary' ? 'marriage-anniversary-theme' : ''} ${selectedTemplate.id === 'marriage' ? 'marriage-theme' : ''} ${selectedTemplate.id === 'new_baby' ? 'baby-theme' : ''} ${selectedTemplate.id === 'welcome' ? 'welcome-theme' : ''}`}>
                {/* LETTER HEAD */}
                <div className="letter-head">
                  <div className="brand-logo">
                    <img src="/logo.jpg" alt="Laxmi Ideal Interiors" style={{ width: '120px', height: 'auto', objectFit: 'contain' }} />
                  </div>
                  <div className="company-address">
                    <p>PA-012-003-004 Mahindra World City - SEZ,</p>
                    <p>Handicraft Zone, Ajmer Road Jaipur (Raj.) 302037</p>
                    <p>Mobile No.: 9351700999, 9982513333</p>
                    <p>Mail us at: - export@laxmiexport.com</p>
                    <p>www.laxmiidealinteriors.com</p>
                  </div>
                </div>

                {/* CONTENT */}
                <div>
                  
                  {/* TOP META */}
                  <div className="notice-meta">
                    <div>
                      {employeeName && (
                        <p>
                          नाम: {employeeName} <span style={{ fontWeight: "normal", fontSize: "14px", color: "#555" }}>({personType === 'Employee' ? 'कर्मचारी' : 'वर्कर'})</span>
                        </p>
                      )}
                      {department && <p>विभाग: {department}</p>}
                    </div>
                    <div>
                      दिनांक: {new Date(issueDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                    </div>
                  </div>
                  
                  {/* TITLE */}
                  <h2 className="notice-title">{selectedTemplate.title}</h2>
                  
                  {/* SUBJECT */}
                  <p className="notice-subject">विषय: {selectedTemplate.subject}</p>

                  {/* BODY */}
                  <div className="notice-body">
                    {getReplacedContent(selectedTemplate.content)}
                  </div>

                  {/* SIGNATURE */}
                  <div className="notice-signature">
                    <p>धन्यवाद</p>
                    <p className="company">मानव संसाधन विभाग</p>
                    <p className="company">मैसर्स लक्ष्मी आइडियल इंटीरियर्स</p>
                  </div>
                  
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="history-container no-print">
          <table className="history-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Department</th>
                <th>Notice Title</th>
                <th>Category</th>
                <th>Issue Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map(notice => (
                <tr key={notice.id}>
                  <td style={{ fontWeight: 600 }}>{notice.employee_name}</td>
                  <td>
                    <span className={`badge ${notice.person_type === 'Worker' ? 'worker' : 'employee'}`}>
                      {notice.person_type}
                    </span>
                  </td>
                  <td>{notice.department}</td>
                  <td style={{ fontWeight: 500 }}>{notice.notice_type}</td>
                  <td>
                    <span className="badge category">{notice.category}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{new Date(notice.issue_date).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setViewNotice(notice)}
                        style={{ color: '#0d6efd', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}
                        title="View Notice"
                      >
                        👁️
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteNotice(notice.id!)}
                          style={{ color: '#dc3545', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}
                          title="Delete Notice"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                    No notices have been issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW NOTICE MODAL */}
      {viewNotice && (
        <div className="modal-overlay no-print-bg">
          <div className="modal-content">
            <div className="modal-actions no-print">
              <button className="modal-btn" onClick={() => setViewNotice(null)}>Close</button>
              <button className="modal-btn primary" onClick={() => window.print()}>Print</button>
              <button className="modal-btn primary" style={{ backgroundColor: '#10b981' }} onClick={handleDownloadImage}>Download Image</button>
            </div>
            
            <div id="print-area" className={`a4-page ${viewNotice.notice_type === 'जन्मदिन शुभकामना सूचना' ? 'birthday-theme' : ''} ${viewNotice.notice_type === 'कार्य वर्षगांठ शुभकामना सूचना' ? 'anniversary-theme' : ''} ${viewNotice.notice_type === 'विवाह वर्षगांठ शुभकामना सूचना' ? 'marriage-anniversary-theme' : ''} ${viewNotice.notice_type === 'विवाह शुभकामना सूचना' ? 'marriage-theme' : ''} ${viewNotice.notice_type === 'नवजात शिशु शुभकामना' ? 'baby-theme' : ''} ${viewNotice.notice_type === 'स्वागत सूचना' ? 'welcome-theme' : ''}`}>
              {/* LETTER HEAD */}
              <div className="letter-head">
                <div className="brand-logo">
                  <img src="/logo.jpg" alt="Laxmi Ideal Interiors" style={{ width: '120px', height: 'auto', objectFit: 'contain' }} />
                </div>
                <div className="company-address">
                  <p>PA-012-003-004 Mahindra World City - SEZ,</p>
                  <p>Handicraft Zone, Ajmer Road Jaipur (Raj.) 302037</p>
                  <p>Mobile No.: 9351700999, 9982513333</p>
                  <p>Mail us at: - export@laxmiexport.com</p>
                  <p>www.laxmiidealinteriors.com</p>
                </div>
              </div>

              {/* CONTENT */}
              <div>
                {/* TOP META */}
                <div className="notice-meta">
                  <div>
                    {viewNotice.employee_name && (
                      <p>
                        नाम: {viewNotice.employee_name} <span style={{ fontWeight: "normal", fontSize: "14px", color: "#555" }}>({viewNotice.person_type === 'Employee' ? 'कर्मचारी' : 'वर्कर'})</span>
                      </p>
                    )}
                    {viewNotice.department && <p>विभाग: {viewNotice.department}</p>}
                  </div>
                  <div>
                    दिनांक: {new Date(viewNotice.issue_date).toLocaleDateString('en-GB').replace(/\//g, '-')}
                  </div>
                </div>
                
                {/* TITLE */}
                <h2 className="notice-title">{viewNotice.notice_type}</h2>
                
                {/* SUBJECT (We don't have subject saved separately, but since we didn't save it, let's omit or look it up) */}
                {(() => {
                  const tmpl = noticeTemplates.find(t => t.title === viewNotice.notice_type);
                  return tmpl ? <p className="notice-subject">विषय: {tmpl.subject}</p> : null;
                })()}

                {/* BODY */}
                <div className="notice-body">
                  {viewNotice.letter_body || "This notice was generated before letter content tracking was implemented."}
                </div>

                {/* SIGNATURE */}
                <div className="notice-signature">
                  <p>धन्यवाद</p>
                  <p className="company">मानव संसाधन विभाग</p>
                  <p className="company">मैसर्स लक्ष्मी आइडियल इंटीरियर्स</p>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
