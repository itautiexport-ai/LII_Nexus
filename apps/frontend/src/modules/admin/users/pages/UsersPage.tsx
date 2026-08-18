import { FormEvent, useEffect, useState, useRef } from "react";
import { usersApi, UserRecord } from "../api/usersApi";
import { rolesApi, RoleRecord } from "../../roles/api/rolesApi";
import { departmentsApi } from "../../organization/departments/api/departmentsApi";
import { designationsApi } from "../../organization/designations/api/designationsApi";
import { shiftsApi } from "../../factory/shifts/api/shiftsApi";
import PermissionGate from "../../../../shared/guards/PermissionGate";
import { useHasPermission } from "../../../auth/hooks/usePermissions";
import { env } from "../../../../config/env";

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
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserRecord, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof UserRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const [searchName, setSearchName] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const filteredUsers = users.filter((u) => {
    const matchName = !searchName || 
      u.fullName.toLowerCase().includes(searchName.toLowerCase()) || 
      u.email.toLowerCase().includes(searchName.toLowerCase());
    const matchDept = !filterDepartment || u.departmentId === filterDepartment;
    return matchName && matchDept;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    whatsappNumber: "",
    employeeCode: "",
    email: "",
    password: "",
    status: "active",
    departmentId: "",
  });

  function startEdit(u: UserRecord) {
    setEditingUser(u);
    setEditForm({
      fullName: u.fullName,
      whatsappNumber: u.whatsappNumber || "",
      employeeCode: u.employeeCode || "",
      email: u.email || "",
      password: "", // empty so it won't update unless typed
      status: u.status,
      departmentId: u.departmentId || "",
    });
    setAvatarUploading(false);
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
        email: editForm.email || undefined,
        ...(editForm.password ? { password: editForm.password } : {}),
        status: editForm.status,
        departmentId: editForm.departmentId || null,
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

  async function load(currentPage = page) {
    try {
      const [uRes, rList, deps, desigs, shs] = await Promise.all([
        usersApi.listPaginated(currentPage, 100000),
        rolesApi.list(),
        departmentsApi.listForDropdown(),
        designationsApi.listForDropdown(),
        shiftsApi.list(),
      ]);
      setUsers(uRes.data);
      setTotalPages(Math.ceil((uRes.meta?.totalItems || 0) / 100000) || 1);
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

  useEffect(() => { load(page); }, [page]);

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editingUser || !e.target.files?.[0]) return;
    setAvatarUploading(true);
    try {
      await usersApi.uploadAvatar(editingUser.id, e.target.files[0]);
      await load();
      // Update editingUser in state to reflect new avatar
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, avatarUrl: URL.createObjectURL(e.target.files![0]) } : u));
      setEditingUser(prev => prev ? { ...prev, avatarUrl: URL.createObjectURL(e.target.files![0]) } : prev);
    } catch {
      alert("Failed to upload image.");
    } finally {
      setAvatarUploading(false);
    }
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>📋 Active Users Directory</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input 
              placeholder="Search Name or Login ID..." 
              className="form-input" 
              style={{ width: 220 }} 
              value={searchName} 
              onChange={(e) => setSearchName(e.target.value)} 
            />
            <select 
              className="form-select" 
              style={{ width: 200 }} 
              value={filterDepartment} 
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departmentsList.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <table className="users-table">
          <thead>
            <tr>
              <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort('fullName')}>
                Name {sortConfig?.key === 'fullName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort('email')}>
                Login ID {sortConfig?.key === 'email' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort('department')}>
                Department {sortConfig?.key === 'department' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort('tempPassword')}>
                Password {sortConfig?.key === 'tempPassword' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort('status')}>
                Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => {
              const dprRole = roles.find(r => r.name === "DPR Management");
              const udRole = roles.find(r => r.name === "User Dashboard Access");
              const htRole = roles.find(r => r.name === "Help Ticket Access");
              const meRole = roles.find(r => r.name === "Machine Efficiency Access");
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: "#111827" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl.startsWith('/') ? new URL(env.apiBaseUrl).origin + u.avatarUrl : u.avatarUrl} alt={u.fullName} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#4338ca", flexShrink: 0 }}>
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {u.fullName}
                    </div>
                  </td>
                  <td><code className="login-id-code">{u.email}</code></td>
                  <td>{u.department || "-"}</td>
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
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderTop: "1px solid #e5e7eb" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: page === 1 ? "#f3f4f6" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: page === totalPages ? "#f3f4f6" : "#fff", cursor: page === totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>


      {editingUser && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <form onSubmit={handleUpdate} className="create-user-card animate-fade" style={{ width: "100%", maxWidth: 620, margin: 0, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 className="section-title">✏️ Edit User Profile: {editingUser.email}</h2>

            {/* Avatar Section */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "16px", background: "#f9fafb", borderRadius: "10px", marginBottom: "20px", border: "1px solid #e5e7eb" }}>
              <div style={{ flexShrink: 0 }}>
                {editingUser.avatarUrl ? (
                  <img src={editingUser.avatarUrl.startsWith('/') ? new URL(env.apiBaseUrl).origin + editingUser.avatarUrl : editingUser.avatarUrl} alt={editingUser.fullName} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid #4338ca" }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28, color: "#4338ca", border: "3px solid #c7d2fe" }}>
                    {editingUser.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#111827" }}>Profile Photo</p>
                <p style={{ margin: "0 0 10px 0", fontSize: 12, color: "#6b7280" }}>Upload JPG, PNG or GIF (max 2MB)</p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  style={{ padding: "6px 16px", background: "#4338ca", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                >
                  {avatarUploading ? "Uploading..." : "📷 Change Photo"}
                </button>
              </div>
            </div>
            
            <div className="form-grid">
              <div>
                <label className="form-label">Login ID (Email) *</label>
                <input 
                  required 
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value, employeeCode: e.target.value })} 
                  className="form-input" 
                />
              </div>

              <div>
                <label className="form-label">Reset Password</label>
                <input 
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                  className="form-input" 
                />
              </div>

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
                  placeholder="e.g. EMP001" 
                  value={editForm.employeeCode}
                  onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value, email: e.target.value })} 
                  className="form-input" 
                />
              </div>

              <div>
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                >
                  <option value="">Select Department...</option>
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
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
