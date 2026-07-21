import { FormEvent, useEffect, useState, useRef } from "react";
import { usersApi, UserRecord } from "../api/usersApi";
import { rolesApi, RoleRecord } from "../../roles/api/rolesApi";
import { departmentsApi } from "../../organization/departments/api/departmentsApi";
import { designationsApi } from "../../organization/designations/api/designationsApi";
import { shiftsApi } from "../../factory/shifts/api/shiftsApi";
import PermissionGate from "../../../../shared/guards/PermissionGate";
import { useHasPermission } from "../../../auth/hooks/usePermissions";

function UserRoleDropdown({ u, roles, canAssignRoles, handleToggleRole }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toggleRef.current && !toggleRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const availableRoles = [
    { key: "DPR Management", label: "DPR Management Access", role: roles.find((r: any) => r.name === "DPR Management") },
    { key: "User Dashboard Access", label: "User Dashboard Access", role: roles.find((r: any) => r.name === "User Dashboard Access") },
    { key: "Help Ticket Access", label: "Help Ticket Access", role: roles.find((r: any) => r.name === "Help Ticket Access") },
    { key: "Machine Efficiency Access", label: "Machine Efficiency Access", role: roles.find((r: any) => r.name === "Machine Efficiency Access") },
  ];

  if (!canAssignRoles) {
    return (
      <div className="table-roles-container">
        {availableRoles.map(ar => 
          u.roles.includes(ar.key) ? (
            <span key={ar.key} className="role-tag" style={{ background: "#def7ec", color: "#03543f" }}>{ar.label}</span>
          ) : null
        )}
      </div>
    );
  }

  return (
    <div className="dropdown-container" style={{ position: "relative" }} ref={toggleRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          background: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px"
        }}
      >
        Manage Permissions <span style={{ fontSize: "10px", color: "#6b7280" }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          marginTop: "4px",
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          zIndex: 50,
          minWidth: "220px",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          {availableRoles.map(ar => ar.role && (
            <label key={ar.key} className="table-role-checkbox" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={u.roles.includes(ar.key)} 
                onChange={() => handleToggleRole(u, ar.role)} 
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span style={{ fontWeight: 500, color: "#374151", fontSize: "14px" }}>{ar.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const canAssignRoles = useHasPermission("rbac.userrole.assign");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [designationsList, setDesignationsList] = useState<any[]>([]);
  const [shiftsList, setShiftsList] = useState<any[]>([]);
  
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    whatsappNumber: "",
    designationId: "",
    departmentId: "",
    shiftId: "",
    roles: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    whatsappNumber: "",
    employeeCode: "",
    status: "active",
  });

  function startEdit(u: UserRecord) {
    setEditingUser(u);
    setEditForm({
      fullName: u.fullName,
      whatsappNumber: u.whatsappNumber || "",
      employeeCode: u.employeeCode || "",
      status: u.status,
    });
  }

  function cancelEdit() {
    setEditingUser(null);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await usersApi.update(editingUser.id, {
        fullName: editForm.fullName,
        whatsappNumber: editForm.whatsappNumber || null,
        employeeCode: editForm.employeeCode || null,
        status: editForm.status,
      });
      setSuccess("User updated successfully!");
      setEditingUser(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function load() {
    try {
      const [uList, rList, deps, desigs, shs] = await Promise.all([
        usersApi.list(),
        rolesApi.list(),
        departmentsApi.list(),
        designationsApi.list(),
        shiftsApi.list(),
      ]);
      setUsers(uList);
      setRoles(rList);
      setDepartmentsList(deps);
      setDesignationsList(desigs);
      setShiftsList(shs);
      
      const generalShift = shs.find((s) => s.name.toLowerCase() === "general");
      const defaultShiftId = generalShift ? generalShift.id : (shs[0]?.id ?? "");
      setForm((f) => ({
        ...f,
        shiftId: defaultShiftId,
      }));
    } catch (err) {
      console.error("Failed to load user management details", err);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await usersApi.create({
        email: form.email, // Login ID
        password: form.password,
        fullName: form.fullName,
        whatsappNumber: form.whatsappNumber || null,
        employeeCode: form.email,
        designationId: form.designationId || null,
        departmentId: form.departmentId || null,
        shiftId: form.shiftId || null,
        roles: form.roles,
      });
      setSuccess("User & Employee record created successfully!");
      setShowCreate(false);
      
      const shs = shiftsList;
      const generalShift = shs.find((s) => s.name.toLowerCase() === "general");
      const defaultShiftId = generalShift ? generalShift.id : (shs[0]?.id ?? "");

      setForm({
        email: "",
        password: "",
        fullName: "",
        whatsappNumber: "",
        designationId: "",
        departmentId: "",
        shiftId: defaultShiftId,
        roles: [],
      });
      await load();
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      if (apiError?.details?.fieldErrors) {
        const errorMessages = Object.entries(apiError.details.fieldErrors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join(" | ");
        setError(`Validation Failed: ${errorMessages}`);
      } else {
        setError(apiError?.message ?? "Failed to create user.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this user?")) return;
    await usersApi.deactivate(id);
    await load();
  }

  async function handleToggleRole(user: UserRecord, role: RoleRecord) {
    if (user.roles.includes(role.name)) {
      await rolesApi.removeFromUser(user.id, role.id);
    } else {
      await rolesApi.assignToUser(user.id, role.id);
    }
    await load();
  }

  const handleFormRoleChange = (roleName: string) => {
    setForm((f) => {
      const exists = f.roles.includes(roleName);
      const newRoles = exists
        ? f.roles.filter((r) => r !== roleName)
        : [...f.roles, roleName];
      return { ...f, roles: newRoles };
    });
  };

  return (
    <div style={containerStyle}>
      <style>{PAGE_STYLES}</style>
      
      <div className="users-header">
        <div>
          <h1 className="users-title">User Management</h1>
          <p className="users-subtitle">Create consolidated user profiles, designate shifts, and assign permissions/roles.</p>
        </div>
        <PermissionGate permission="identity.user.create">
          <button 
            onClick={() => setShowCreate((v) => !v)}
            className={`new-user-btn ${showCreate ? "cancel" : ""}`}
          >
            {showCreate ? "✕ Cancel" : "+ New User"}
          </button>
        </PermissionGate>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="create-user-card animate-fade">
          <h2 className="section-title">👤 Create New User & Employee Profile</h2>
          
          <div className="form-grid">
            <div>
              <label className="form-label">User ID / Login ID *</label>
              <input 
                placeholder="e.g. worker01" 
                required 
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                className="form-input" 
              />
            </div>

            <div>
              <label className="form-label">Temporary Password *</label>
              <input 
                placeholder="Password (min 8 chars)" 
                type="text" 
                required 
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                className="form-input" 
              />
            </div>

            <div>
              <label className="form-label">User Name (Full Name) *</label>
              <input 
                placeholder="e.g. John Doe" 
                required 
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                className="form-input" 
              />
            </div>

            <div>
              <label className="form-label">WhatsApp Number</label>
              <input 
                placeholder="e.g. +919876543210" 
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} 
                className="form-input" 
              />
            </div>

            <div>
              <label className="form-label">Designation</label>
              <select
                className="form-select"
                value={form.designationId}
                onChange={(e) => setForm({ ...form, designationId: e.target.value })}
              >
                <option value="">Select Designation...</option>
                {designationsList.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">Select Department...</option>
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Fixed Shift</label>
              <select
                className="form-select"
                value={form.shiftId}
                onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
              >
                <option value="">Select Shift...</option>
                {shiftsList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.startTime?.slice(0, 5) ?? "00:00"} - {s.endTime?.slice(0, 5) ?? "00:00"})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="form-label" style={{ marginBottom: 12 }}>Permissions</label>
            <div className="roles-checkbox-grid">
              <label className="role-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={form.roles.includes("DPR Management")} 
                  onChange={() => handleFormRoleChange("DPR Management")} 
                  className="role-checkbox"
                />
                <div>
                  <span className="role-name">DPR Management Access</span>
                  <span className="role-desc">Grants full permission to record, edit, and view Daily Production Reports (DPR).</span>
                </div>
              </label>

              <label className="role-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={form.roles.includes("User Dashboard Access")} 
                  onChange={() => handleFormRoleChange("User Dashboard Access")} 
                  className="role-checkbox"
                />
                <div>
                  <span className="role-name">User Dashboard Access</span>
                  <span className="role-desc">Grants access to the User Dashboard.</span>
                </div>
              </label>

              <label className="role-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={form.roles.includes("Help Ticket Access")} 
                  onChange={() => handleFormRoleChange("Help Ticket Access")} 
                  className="role-checkbox"
                />
                <div>
                  <span className="role-name">Help Ticket Access</span>
                  <span className="role-desc">Grants access to Help Tickets.</span>
                </div>
              </label>

              <label className="role-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={form.roles.includes("Machine Efficiency Access")} 
                  onChange={() => handleFormRoleChange("Machine Efficiency Access")} 
                  className="role-checkbox"
                />
                <div>
                  <span className="role-name">Machine Efficiency Access</span>
                  <span className="role-desc">Grants access to Machine Efficiency.</span>
                </div>
              </label>
            </div>
          </div>

          {error && <div className="alert-message error">{error}</div>}
          {success && <div className="alert-message success">{success}</div>}

          <div className="form-actions">
            <button 
              type="submit" 
              className="save-user-btn"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "💾 Create User Profile"}
            </button>
          </div>
        </form>
      )}

      {success && !showCreate && <div className="alert-message success" style={{ marginBottom: 16 }}>{success}</div>}

      <div className="users-list-card">
        <h2 className="section-title">📋 Active Users Directory</h2>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Login ID</th>
              <th>Password</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const dprRole = roles.find(r => r.name === "DPR Management");
              const udRole = roles.find(r => r.name === "User Dashboard Access");
              const htRole = roles.find(r => r.name === "Help Ticket Access");
              const meRole = roles.find(r => r.name === "Machine Efficiency Access");
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: "#111827" }}>{u.fullName}</td>
                  <td><code className="login-id-code">{u.email}</code></td>
                  <td><code className="login-id-code">{u.tempPassword || "Not Recorded"}</code></td>
                  <td>
                    <span className={`status-badge ${u.status}`}>
                      {u.status}
                    </span>
                  </td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => startEdit(u)}
                      className="save-user-btn"
                      style={{ padding: "4px 8px", fontSize: "12px", background: "#3b82f6" }}
                    >
                      Edit
                    </button>
                    <PermissionGate permission="identity.user.deactivate">
                      <button 
                        onClick={() => handleDeactivate(u.id)}
                        className="deactivate-btn"
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                      >
                        Deactivate
                      </button>
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <form onSubmit={handleUpdate} className="create-user-card animate-fade" style={{ width: "100%", maxWidth: 600, margin: 0 }}>
            <h2 className="section-title">✏️ Edit User Profile: {editingUser.email}</h2>
            
            <div className="form-grid">
              <div>
                <label className="form-label">Full Name *</label>
                <input 
                  required 
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} 
                  className="form-input" 
                />
              </div>

              <div>
                <label className="form-label">WhatsApp Number</label>
                <input 
                  value={editForm.whatsappNumber}
                  onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })} 
                  className="form-input" 
                />
              </div>

              <div>
                <label className="form-label">Employee Code</label>
                <input 
                  value={editForm.employeeCode}
                  onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value })} 
                  className="form-input" 
                />
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: "24px" }}>
              <button type="button" onClick={cancelEdit} className="new-user-btn cancel">
                Cancel
              </button>
              <button type="submit" className="save-user-btn" disabled={submitting}>
                {submitting ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "16px 8px 40px 8px",
};

const PAGE_STYLES = `
  .users-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 16px;
  }
  .users-title {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
  .users-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 4px 0 0;
  }
  .new-user-btn {
    background: #1a7f37;
    color: #ffffff;
    border: none;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .new-user-btn:hover {
    background: #15652c;
  }
  .new-user-btn.cancel {
    background: #d93025;
  }
  .new-user-btn.cancel:hover {
    background: #b8251b;
  }

  .create-user-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #374151;
    margin-top: 0;
    margin-bottom: 20px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .form-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #4b5563;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .form-input, .form-select {
    display: block;
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    box-sizing: border-box;
    background: #ffffff;
    color: #111827;
    transition: border-color 0.15s ease;
  }
  .form-input:focus, .form-select:focus {
    border-color: #1a7f37;
    outline: none;
    box-shadow: 0 0 0 3px rgba(26, 127, 55, 0.1);
  }

  .roles-checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    background: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  .role-checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: background-color 0.15s ease;
  }
  .role-checkbox-label:hover {
    background: #f3f4f6;
  }
  .role-checkbox {
    margin-top: 3px;
    cursor: pointer;
  }
  .role-name {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }
  .role-desc {
    display: block;
    font-size: 11px;
    color: #6b7280;
    margin-top: 2px;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }
  .save-user-btn {
    background: #1a7f37;
    color: #ffffff;
    border: none;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .save-user-btn:hover:not(:disabled) {
    background: #15652c;
  }
  .save-user-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .alert-message {
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    margin-top: 16px;
    font-weight: 500;
  }
  .alert-message.error {
    background: #fde8e8;
    color: #9b1c1c;
    border: 1px solid #f8b4b4;
  }
  .alert-message.success {
    background: #def7ec;
    color: #03543f;
    border: 1px solid #84e1bc;
  }

  .users-list-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .users-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
    margin-top: 16px;
  }
  .users-table th {
    background: #f9fafb;
    color: #4b5563;
    padding: 12px 16px;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
  }
  .users-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    color: #374151;
    vertical-align: middle;
  }
  .users-table tr:hover {
    background: #f9fafb;
  }

  .login-id-code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    color: #1f2937;
  }
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 12px;
    text-transform: capitalize;
  }
  .status-badge.active {
    background: #def7ec;
    color: #03543f;
  }
  .status-badge.suspended {
    background: #fde8e8;
    color: #9b1c1c;
  }
  .status-badge.inactive {
    background: #f3f4f6;
    color: #4b5563;
  }

  .table-roles-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  .table-role-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  .role-tag {
    background: #edf2f7;
    color: #4a5568;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .deactivate-btn {
    background: transparent;
    color: #d93025;
    border: none;
    font-weight: 600;
    cursor: pointer;
    font-size: 13px;
  }
  .deactivate-btn:hover {
    text-decoration: underline;
  }

  .animate-fade {
    animation: fadeIn 0.2s ease-in-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
