import React, { useEffect, useState } from "react";
import { recruitmentApi, EmployeeAssetRecord } from "../api/recruitmentApi";

interface AssetItem {
  name: string;
  icon: string;
}

const CATEGORY_ASSETS_MAP: Record<string, { label: string; icon: string; items: AssetItem[] }> = {
  "IT Assets": {
    label: "1. IT Assets",
    icon: "💻",
    items: [
      { name: "Laptop", icon: "💻" },
      { name: "Desktop Computer", icon: "🖥️" },
      { name: "Monitor", icon: "📺" },
      { name: "Keyboard", icon: "⌨️" },
      { name: "Mouse", icon: "🖱️" },
      { name: "Tablet", icon: "📱" },
      { name: "Mobile", icon: "📞" },
      { name: "Sim Card", icon: "📶" },
      { name: "Webcam", icon: "📷" },
      { name: "Pendrive", icon: "💾" },
      { name: "Wi-Fi Dongle", icon: "🌐" },
      { name: "Headset", icon: "🎧" },
    ],
  },
  "Office Assets": {
    label: "2. Office Assets",
    icon: "🪑",
    items: [
      { name: "Server", icon: "🗄️" },
      { name: "Office Table", icon: "🪑" },
      { name: "Drawer Cabinet Key", icon: "🔑" },
      { name: "Locker Key", icon: "🔐" },
      { name: "Office Keys", icon: "🗝️" },
      { name: "Calculator", icon: "🧮" },
      { name: "Whiteboard Marker Kit", icon: "🖊️" },
    ],
  },
  "Uniform & Apparel": {
    label: "3. Uniform & Apparel",
    icon: "👔",
    items: [
      { name: "Company Uniform", icon: "👔" },
      { name: "Company T-Shirt", icon: "👕" },
      { name: "Jacket", icon: "🧥" },
      { name: "Cap", icon: "🧢" },
      { name: "Apron", icon: "🥼" },
      { name: "Raincoat (if applicable)", icon: "🧥" },
    ],
  },
  "Communication": {
    label: "4. Communication & Accounts",
    icon: "📞",
    items: [
      { name: "Company Mobile Number", icon: "📞" },
      { name: "Official Email ID", icon: "📧" },
      { name: "Microsoft 365 / Google Workspace Account", icon: "☁️" },
      { name: "ERP Login Credentials", icon: "🔐" },
    ],
  },
  "Documents Issued": {
    label: "5. Documents Issued",
    icon: "📜",
    items: [
      { name: "Appointment Letter", icon: "📜" },
      { name: "Joining Kit", icon: "🎁" },
      { name: "Employee Handbook", icon: "📖" },
      { name: "HR Policy Manual", icon: "📘" },
      { name: "Safety Manual", icon: "🦺" },
      { name: "SOP Manual", icon: "📋" },
      { name: "Training Manual", icon: "📚" },
    ],
  },
};

const SAMPLE_EMPLOYEES = [
  { id: "LII-2026-089", name: "Ramesh Kumar", dept: "Production / Machine Shop" },
  { id: "LII-2026-090", name: "Pooja Verma", dept: "Finishing & Assembly" },
  { id: "LII-2026-091", name: "Ankit Sharma", dept: "Quality Control & Assurance" },
  { id: "LII-2026-092", name: "Sunita Rao", dept: "HR & Administration" },
  { id: "LII-2026-093", name: "Rajesh Sharma", dept: "Quality Control & Assurance" },
  { id: "LII-2026-094", name: "Amit Verma", dept: "Production / Machine Shop" },
];

export default function EmployeeAssetManagementPage() {
  const [assets, setAssets] = useState<EmployeeAssetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Global Employee Selection State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [customEmployeeName, setCustomEmployeeName] = useState("");
  const [customEmployeeId, setCustomEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [conditionOnIssue, setConditionOnIssue] = useState("New");

  // Category 1: IT Assets
  const [selectedItAsset, setSelectedItAsset] = useState("");
  const [itSerial, setItSerial] = useState("");

  // Category 2: Office Assets
  const [selectedOfficeAsset, setSelectedOfficeAsset] = useState("");
  const [officeSerial, setOfficeSerial] = useState("");

  // Category 3: Uniform & Apparel
  const [selectedUniform, setSelectedUniform] = useState("");
  const [uniformDetails, setUniformDetails] = useState("");

  // Category 4: Communication & Accounts (Dedicated inputs so HR can provide BOTH Mobile & Email simultaneously!)
  const [mobileNumber, setMobileNumber] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [m365Account, setM365Account] = useState("");
  const [erpLogin, setErpLogin] = useState("");

  // Category 5: Documents Issued
  const [selectedDocument, setSelectedDocument] = useState("");
  const [documentDetails, setDocumentDetails] = useState("");

  // Modal View Handover Receipt
  const [selectedBundleModal, setSelectedBundleModal] = useState<{
    employee_name: string;
    employee_id: string;
    department: string | null;
    items: EmployeeAssetRecord[];
  } | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const data = await recruitmentApi.getAssets();
      setAssets(data || []);
    } catch (err) {
      console.error("Failed to load employee assets", err);
    } finally {
      setLoading(false);
    }
  }

  function handleEmployeeSelectChange(val: string) {
    setSelectedEmployeeId(val);
    if (val === "CUSTOM") {
      setCustomEmployeeName("");
      setCustomEmployeeId("");
      setDepartment("");
    } else {
      const emp = SAMPLE_EMPLOYEES.find((e) => e.id === val);
      if (emp) {
        setCustomEmployeeName(emp.name);
        setCustomEmployeeId(emp.id);
        setDepartment(emp.dept);
      }
    }
  }

  async function handleMultiAllocateSubmit(e: React.FormEvent) {
    e.preventDefault();

    const empName = selectedEmployeeId === "CUSTOM" ? customEmployeeName : customEmployeeName || "Employee";
    const empId = selectedEmployeeId === "CUSTOM" ? customEmployeeId : selectedEmployeeId;

    if (!empName.trim() || !empId.trim()) {
      alert("Please select or enter Employee Name and ID.");
      return;
    }

    const allocationsToSubmit: { category: string; name: string; serial: string }[] = [];

    // Category 1
    if (selectedItAsset) {
      allocationsToSubmit.push({ category: "IT Assets", name: selectedItAsset, serial: itSerial });
    }
    // Category 2
    if (selectedOfficeAsset) {
      allocationsToSubmit.push({ category: "Office Assets", name: selectedOfficeAsset, serial: officeSerial });
    }
    // Category 3
    if (selectedUniform) {
      allocationsToSubmit.push({ category: "Uniform & Apparel", name: selectedUniform, serial: uniformDetails });
    }

    // Category 4: Dedicated Mobile & Email Inputs
    if (mobileNumber.trim()) {
      allocationsToSubmit.push({ category: "Communication", name: "Company Mobile Number", serial: mobileNumber.trim() });
    }
    if (officialEmail.trim()) {
      allocationsToSubmit.push({ category: "Communication", name: "Official Email ID", serial: officialEmail.trim() });
    }
    if (m365Account.trim()) {
      allocationsToSubmit.push({ category: "Communication", name: "Microsoft 365 / Google Workspace Account", serial: m365Account.trim() });
    }
    if (erpLogin.trim()) {
      allocationsToSubmit.push({ category: "Communication", name: "ERP Login Credentials", serial: erpLogin.trim() });
    }

    // Category 5
    if (selectedDocument) {
      allocationsToSubmit.push({ category: "Documents Issued", name: selectedDocument, serial: documentDetails });
    }

    if (allocationsToSubmit.length === 0) {
      alert("Please enter or select at least ONE item (Mobile No, Email ID, IT Asset, Office Asset, Uniform, or Document) to allocate.");
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(
        allocationsToSubmit.map((item) =>
          recruitmentApi.allocateAsset({
            employeeId: empId,
            employeeName: empName,
            department,
            assetCategory: item.category,
            assetName: item.name,
            serialNumber: item.serial || null,
            issueDate,
            conditionOnIssue,
            remarks: item.serial ? `${item.name}: ${item.serial}` : `Issued on ${issueDate}`,
            status: "Allocated",
          })
        )
      );

      const itemsSummary = allocationsToSubmit.map((i) => `${i.name}${i.serial ? ` (${i.serial})` : ''}`).join(", ");
      setSuccessMsg(`🎉 Successfully allocated ${allocationsToSubmit.length} items (${itemsSummary}) to ${empName}!`);
      setTimeout(() => setSuccessMsg(""), 6000);

      // Reset selection inputs
      setSelectedItAsset("");
      setItSerial("");
      setSelectedOfficeAsset("");
      setOfficeSerial("");
      setSelectedUniform("");
      setUniformDetails("");
      setMobileNumber("");
      setOfficialEmail("");
      setM365Account("");
      setErpLogin("");
      setSelectedDocument("");
      setDocumentDetails("");

      loadAssets();
    } catch (err) {
      console.error("Failed to allocate assets", err);
      alert("Failed to allocate assets.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEmployeeBundle(employeeId: string, employeeName: string) {
    if (!window.confirm(`Are you sure you want to delete all allocated asset records for ${employeeName}?`)) return;
    const employeeItems = assets.filter((a) => a.employee_id === employeeId || a.employee_name === employeeName);
    try {
      await Promise.all(employeeItems.map((item) => recruitmentApi.deleteAsset(item.id)));
      loadAssets();
    } catch (err) {
      console.error("Failed to delete employee asset bundle", err);
    }
  }

  // Group assets by Employee for one-line display
  const groupedEmployeeMap: Record<string, { employee_id: string; employee_name: string; department: string | null; items: EmployeeAssetRecord[] }> = {};

  assets.forEach((item) => {
    const key = `${item.employee_name}_${item.employee_id || 'ID'}`;
    if (!groupedEmployeeMap[key]) {
      groupedEmployeeMap[key] = {
        employee_id: item.employee_id,
        employee_name: item.employee_name,
        department: item.department,
        items: [],
      };
    }
    groupedEmployeeMap[key].items.push(item);
  });

  const groupedEmployeeList = Object.values(groupedEmployeeMap);

  // Filter logic
  const filteredGroupedList = groupedEmployeeList.filter((g) => {
    const matchesSearch =
      !searchQuery.trim() ||
      g.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.employee_id && g.employee_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.department && g.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      g.items.some((i) =>
        i.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.serial_number && i.serial_number.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchesCat = catFilter === "ALL" || g.items.some((i) => i.asset_category === catFilter);
    const matchesStatus = statusFilter === "ALL" || g.items.some((i) => i.status === statusFilter);

    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            LII Nexus – HR Asset & Communication Control
          </span>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "2px 0 4px 0" }}>
            Employee Asset Management
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Issue BOTH Mobile Numbers and Email Addresses along with IT, Office, Uniform & Document Assets to an employee in <strong>one single line</strong>.
          </p>
        </div>

        <button
          onClick={loadAssets}
          style={{
            padding: "9px 16px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          🔄 Refresh List
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", fontWeight: "700", fontSize: "14px", marginBottom: "20px" }}>
          {successMsg}
        </div>
      )}

      {/* MULTI-CATEGORY ALLOCATION FORM CARD WITH DEDICATED MOBILE & EMAIL INPUTS */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
          📦 Multi-Category Asset, Email & Mobile Issue Form
        </h2>

        <form onSubmit={handleMultiAllocateSubmit}>
          {/* STEP 1: Select Employee */}
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                  👤 Select Target Employee *
                </label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeSelectChange(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", fontWeight: "600", color: selectedEmployeeId ? "#0f172a" : "#64748b", background: "#ffffff" }}
                >
                  <option value="" disabled>-- Select Employee --</option>
                  {SAMPLE_EMPLOYEES.map((e) => (
                    <option key={e.id} value={e.id}>
                      👤 {e.name} ({e.id} – {e.dept})
                    </option>
                  ))}
                  <option value="CUSTOM">➕ Enter Custom / Other Employee</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                  📅 Date of Issue *
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", background: "#ffffff" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                  🌟 Condition on Issue
                </label>
                <select
                  value={conditionOnIssue}
                  onChange={(e) => setConditionOnIssue(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", background: "#ffffff" }}
                >
                  <option value="New">🌟 Brand New</option>
                  <option value="Good">👍 Good Condition</option>
                  <option value="Fair">⚡ Shared / Active</option>
                </select>
              </div>
            </div>

            {selectedEmployeeId === "CUSTOM" && (
              <div style={{ marginTop: "14px", background: "#ffffff", border: "1px solid #7dd3fc", padding: "14px", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0369a1", marginBottom: "4px" }}>Employee Name *</label>
                  <input
                    type="text"
                    required
                    value={customEmployeeName}
                    onChange={(e) => setCustomEmployeeName(e.target.value)}
                    placeholder="Full Name"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0369a1", marginBottom: "4px" }}>Employee ID / Code *</label>
                  <input
                    type="text"
                    required
                    value={customEmployeeId}
                    onChange={(e) => setCustomEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-2026-102"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0369a1", marginBottom: "4px" }}>Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Department"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>
              </div>
            )}
          </div>

          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0284c7", margin: "0 0 16px 0" }}>
            ⚡ Select & Issue Items (Mobile Number, Email Address, IT & Office Assets, Uniform, Documents):
          </h3>

          {/* GRID OF ALL 5 CATEGORIES SIMULTANEOUSLY */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
            
            {/* Category 1: IT Assets */}
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0369a1", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>💻</span> 1. IT Assets
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Select IT Asset
                </label>
                <select
                  value={selectedItAsset}
                  onChange={(e) => setSelectedItAsset(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #7dd3fc", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                >
                  <option value="">-- None (Skip IT Asset) --</option>
                  {CATEGORY_ASSETS_MAP["IT Assets"].items.map((item) => (
                    <option key={item.name} value={item.name}>{item.icon} {item.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Write Serial / Tag No / Model
                </label>
                <input
                  type="text"
                  value={itSerial}
                  onChange={(e) => setItSerial(e.target.value)}
                  placeholder="e.g. SN-884920 or Dell XPS 15"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #7dd3fc", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                />
              </div>
            </div>

            {/* Category 2: Office Assets */}
            <div style={{ background: "#fffbebf5", border: "1px solid #fde68a", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#92400e", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🪑</span> 2. Office Assets
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Select Office Asset
                </label>
                <select
                  value={selectedOfficeAsset}
                  onChange={(e) => setSelectedOfficeAsset(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #fcd34d", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                >
                  <option value="">-- None (Skip Office Asset) --</option>
                  {CATEGORY_ASSETS_MAP["Office Assets"].items.map((item) => (
                    <option key={item.name} value={item.name}>{item.icon} {item.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Write Key No / Tag / Location
                </label>
                <input
                  type="text"
                  value={officeSerial}
                  onChange={(e) => setOfficeSerial(e.target.value)}
                  placeholder="e.g. KEY-CAB-04 or Locker #12"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #fcd34d", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                />
              </div>
            </div>

            {/* Category 3: Uniform & Apparel */}
            <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#7e22ce", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>👔</span> 3. Uniform & Apparel
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Select Apparel Item
                </label>
                <select
                  value={selectedUniform}
                  onChange={(e) => setSelectedUniform(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #c084fc", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                >
                  <option value="">-- None (Skip Uniform) --</option>
                  {CATEGORY_ASSETS_MAP["Uniform & Apparel"].items.map((item) => (
                    <option key={item.name} value={item.name}>{item.icon} {item.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Write Size / Quantity
                </label>
                <input
                  type="text"
                  value={uniformDetails}
                  onChange={(e) => setUniformDetails(e.target.value)}
                  placeholder="e.g. Size L, 2 Pairs"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #c084fc", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                />
              </div>
            </div>

            {/* Category 4: Communication & Accounts (DEDICATED SEPARATE INPUTS FOR BOTH MOBILE & EMAIL!) */}
            <div style={{ background: "#f0fdf4", border: "2px solid #22c55e", borderRadius: "10px", padding: "16px", boxShadow: "0 2px 6px rgba(34, 197, 94, 0.15)" }}>
              <div style={{ fontWeight: "800", fontSize: "14px", color: "#15803d", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📞</span> 4. Communication & Accounts
              </div>

              {/* Dedicated Mobile Number Field */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#166534", marginBottom: "3px" }}>
                  📱 Company Mobile Number
                </label>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #86efac", borderRadius: "6px", fontSize: "13px", fontWeight: "600", background: "#ffffff" }}
                />
              </div>

              {/* Dedicated Official Email Field */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#166534", marginBottom: "3px" }}>
                  📧 Official Email Address
                </label>
                <input
                  type="text"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  placeholder="e.g. ramesh.kumar@liinexus.com"
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #86efac", borderRadius: "6px", fontSize: "13px", fontWeight: "600", background: "#ffffff" }}
                />
              </div>

              {/* Dedicated M365 Account Field */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#166534", marginBottom: "3px" }}>
                  ☁️ Microsoft 365 / Workspace Account
                </label>
                <input
                  type="text"
                  value={m365Account}
                  onChange={(e) => setM365Account(e.target.value)}
                  placeholder="e.g. ramesh@company.com"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #86efac", borderRadius: "6px", fontSize: "12px", background: "#ffffff" }}
                />
              </div>

              {/* Dedicated ERP Login Field */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#166534", marginBottom: "3px" }}>
                  🔐 ERP Login ID & Access Role
                </label>
                <input
                  type="text"
                  value={erpLogin}
                  onChange={(e) => setErpLogin(e.target.value)}
                  placeholder="e.g. ERP-EMP-089 (Production Admin)"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #86efac", borderRadius: "6px", fontSize: "12px", background: "#ffffff" }}
                />
              </div>
            </div>

            {/* Category 5: Documents Issued */}
            <div style={{ background: "#fdf4ff", border: "1px solid #f5d0fe", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#86198f", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📜</span> 5. Documents Issued
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Select Document Issued
                </label>
                <select
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #f0abfc", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                >
                  <option value="">-- None (Skip Document) --</option>
                  {CATEGORY_ASSETS_MAP["Documents Issued"].items.map((item) => (
                    <option key={item.name} value={item.name}>{item.icon} {item.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Write Ref No / Signed Copy Notes
                </label>
                <input
                  type="text"
                  value={documentDetails}
                  onChange={(e) => setDocumentDetails(e.target.value)}
                  placeholder="e.g. Ref #DOC-2026-089 (Signed)"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #f0abfc", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                />
              </div>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 28px",
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
              }}
            >
              {submitting ? "Allocating Selected Items..." : "💾 Allocate Selected Assets, Mobile & Email to Employee"}
            </button>
          </div>
        </form>
      </div>

      {/* FILTER BAR & LIST VIEW TABLE */}
      <div style={{ background: "#ffffff", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
            <input
              type="text"
              placeholder="Search employee, ID, department, mobile, email, serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: "260px", flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
            />

            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="ALL">All Categories</option>
              {Object.keys(CATEGORY_ASSETS_MAP).map((k) => (
                <option key={k} value={k}>{CATEGORY_ASSETS_MAP[k].label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Allocated">Allocated</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
            Showing <strong>{filteredGroupedList.length}</strong> employee records ({assets.length} total issued items)
          </div>
        </div>
      </div>

      {/* ASSET ALLOCATION RECORDS TABLE – ONE LINE PER EMPLOYEE WITH EXACT DETAILS! */}
      <div style={{ background: "#ffffff", borderRadius: "10px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading employee assets & documents list...</p>
        ) : filteredGroupedList.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No employee asset / document allocations found matching your criteria.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Employee Name & ID</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Department</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Allocated Items, Mobile & Email Details (One-Line Bundle)</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Total Items</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Issue Date</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroupedList.map((g) => {
                  const firstIssueDate = g.items[0]?.issue_date;

                  return (
                    <tr key={`${g.employee_name}_${g.employee_id}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                        {g.employee_name} <br />
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#0284c7" }}>{g.employee_id}</span>
                      </td>

                      <td style={{ padding: "12px", fontSize: "13px", color: "#334155" }}>
                        {g.department || "-"}
                      </td>

                      {/* ALL ISSUED ITEMS RENDERED IN ONE LINE HORIZONTALLY WITH WRITTEN DETAILS */}
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                          {g.items.map((item) => {
                            let icon = "📦";
                            const catObj = CATEGORY_ASSETS_MAP[item.asset_category];
                            if (catObj) {
                              const matchItem = catObj.items.find((i) => i.name === item.asset_name);
                              if (matchItem) icon = matchItem.icon;
                            }

                            const detailText = item.serial_number ? `: ${item.serial_number}` : "";

                            return (
                              <span
                                key={item.id}
                                title={`Asset Code: ${item.asset_code}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "5px 12px",
                                  borderRadius: "16px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  background:
                                    item.asset_category === "IT Assets"
                                      ? "#e0f2fe"
                                      : item.asset_category === "Office Assets"
                                      ? "#fef3c7"
                                      : item.asset_category === "Uniform & Apparel"
                                      ? "#f3e8ff"
                                      : item.asset_category === "Communication"
                                      ? "#dcfce7"
                                      : "#fdf4ff",
                                  color:
                                    item.asset_category === "IT Assets"
                                      ? "#0369a1"
                                      : item.asset_category === "Office Assets"
                                      ? "#92400e"
                                      : item.asset_category === "Uniform & Apparel"
                                      ? "#7e22ce"
                                      : item.asset_category === "Communication"
                                      ? "#166534"
                                      : "#86198f",
                                  border: item.asset_category === "Communication" ? "1.5px solid #86efac" : "1px solid rgba(0,0,0,0.06)",
                                }}
                              >
                                <span>{icon}</span>
                                <span>
                                  {item.asset_name}
                                  {detailText && <strong style={{ color: "#0f172a", marginLeft: "4px" }}>({item.serial_number})</strong>}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td style={{ padding: "12px", fontSize: "13px", fontWeight: "800", color: "#0284c7" }}>
                        {g.items.length} Items
                      </td>

                      <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                        {firstIssueDate ? new Date(firstIssueDate).toLocaleDateString() : "-"}
                      </td>

                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedBundleModal(g)}
                            style={{
                              padding: "6px 12px",
                              background: "#0284c7",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              boxShadow: "0 1px 3px rgba(2, 132, 199, 0.25)",
                            }}
                          >
                            👁️ View Handover Receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployeeBundle(g.employee_id, g.employee_name)}
                            style={{
                              padding: "6px 10px",
                              background: "#fff1f2",
                              border: "1px solid #fecdd3",
                              color: "#e11d48",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- HANDOVER RECEIPT BUNDLE MODAL --- */}
      {selectedBundleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "750px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#0284c7", textTransform: "uppercase" }}>
                  LII Nexus – Official Handover Receipt
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  Employee Asset & Document Sign-Off Record
                </h2>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={() => window.print()}
                  style={{ padding: "6px 14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  onClick={() => setSelectedBundleModal(null)}
                  style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Employee Details Header Card */}
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                <div><strong>Employee Name:</strong> {selectedBundleModal.employee_name}</div>
                <div><strong>Employee Code / ID:</strong> {selectedBundleModal.employee_id}</div>
                <div><strong>Department:</strong> {selectedBundleModal.department || "-"}</div>
                <div><strong>Total Items Issued:</strong> <span style={{ fontWeight: "800", color: "#0284c7" }}>{selectedBundleModal.items.length} Items</span></div>
              </div>
            </div>

            {/* Detailed Items List */}
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>
              Issued Items & Communication Details Breakdown
            </h3>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "10px" }}>Category</th>
                    <th style={{ padding: "10px" }}>Item Issued</th>
                    <th style={{ padding: "10px" }}>Mobile No / Email / Serial / Value Written</th>
                    <th style={{ padding: "10px" }}>Issue Date</th>
                    <th style={{ padding: "10px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBundleModal.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px", fontWeight: "600", color: "#334155" }}>{item.asset_category}</td>
                      <td style={{ padding: "10px", fontWeight: "700", color: "#0f172a" }}>{item.asset_name}</td>
                      <td style={{ padding: "10px", fontWeight: "700", color: "#0284c7" }}>
                        {item.serial_number || item.remarks || "-"}
                      </td>
                      <td style={{ padding: "10px", color: "#475569" }}>{item.issue_date ? new Date(item.issue_date).toLocaleDateString() : "-"}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ fontWeight: "700", color: item.status === "Allocated" ? "#166534" : "#991b1b" }}>
                          {item.status === "Allocated" ? "🟢 Issued" : "🔴 Returned"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedBundleModal(null)}
                style={{ padding: "8px 20px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700" }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
