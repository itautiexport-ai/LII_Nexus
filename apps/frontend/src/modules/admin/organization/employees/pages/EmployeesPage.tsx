import { FormEvent, useEffect, useState } from "react";
import { employeesApi, EmployeeRecord } from "../api/employeesApi";
import { departmentsApi, DepartmentRecord } from "../../departments/api/departmentsApi";
import { designationsApi, DesignationRecord } from "../../designations/api/designationsApi";
import { usersApi, UserRecord } from "../../../users/api/usersApi";
import { masterDataApi, Hod } from "../../../masterdata/api/masterDataApi";
import PermissionGate from "../../../../../shared/guards/PermissionGate";
import { useAuthStore } from "../../../../auth/hooks/useAuthStore";

const emptyForm = {
  employeeCode: "", fullName: "", email: "", phone: "",
  departmentId: "", designationId: "", managerId: "", 
  dateOfJoining: "", birthday: "", anniversary: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [designations, setDesignations] = useState<DesignationRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [hods, setHods] = useState<Hod[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore(state => state.user);
  const isAdmin = user?.roles?.some(r => r === 'System Admin' || r === 'HR Admin') || false;
  async function load(currentSearch = search) {
    const [emp, deps, desigs, userList, hodList] = await Promise.all([
      employeesApi.list(currentSearch),
      departmentsApi.list(),
      designationsApi.list(),
      usersApi.list(),
      masterDataApi.getHods(),
    ]);
    setEmployees(emp);
    setDepartments(deps);
    setDesignations(desigs);
    setUsers(userList);
    setHods(hodList);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time load on mount; `load` is stable across renders
  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await employeesApi.create({
        employeeCode: form.employeeCode,
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        departmentId: form.departmentId || null,
        designationId: form.designationId || null,
        managerId: form.managerId || null,
        dateOfJoining: form.dateOfJoining || undefined,
        birthday: form.birthday || undefined,
        anniversary: form.anniversary || undefined,
      });
      setShowCreate(false);
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create employee.");
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this employee?")) return;
    await employeesApi.remove(id);
    await load();
  }

  async function handleReassign(emp: EmployeeRecord, field: "employeeCode" | "fullName" | "departmentId" | "designationId" | "managerId" | "userId" | "dateOfJoining" | "birthday" | "anniversary" | "status", value: string) {
    try {
      await employeesApi.update(emp.id, { [field]: value || null });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? "Failed to update employee.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 20 }}>Employee Master</h1>
        {isAdmin && (
          <button onClick={() => setShowCreate((v) => !v)}>{showCreate ? "Cancel" : "+ New Employee"}</button>
        )}
      </div>

      <input
        placeholder="Search by name, code, or email..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
        style={{ padding: 6, marginBottom: 12, width: 320 }}
      />

      {showCreate && (
        <form onSubmit={handleCreate} style={{ margin: "0 0 16px", padding: 16, border: "1px solid #ddd", maxWidth: 480 }}>
          <input placeholder="Employee code" required value={form.employeeCode}
            onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }} />
          <input placeholder="Full name" required value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }} />
          <input placeholder="Email (optional)" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }} />
          <input placeholder="Phone (optional)" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }} />
          <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }}>
            <option value="">— Department (optional) —</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={form.designationId} onChange={(e) => setForm({ ...form, designationId: e.target.value })} style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }}>
            <option value="">— Designation (optional) —</option>
            {designations.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
          <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }}>
            <option value="">— HOD (optional) —</option>
            {hods.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, color: "#666" }}>Date of Joining</label>
              <input type="date" value={form.dateOfJoining}
                onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} style={{ display: "block", width: "100%", padding: 6 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, color: "#666" }}>Birthday</label>
              <input type="date" value={form.birthday}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })} style={{ display: "block", width: "100%", padding: 6 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, color: "#666" }}>Anniversary</label>
              <input type="date" value={form.anniversary}
                onChange={(e) => setForm({ ...form, anniversary: e.target.value })} style={{ display: "block", width: "100%", padding: 6 }} />
            </div>
          </div>
          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <button type="submit">Create Employee</button>
        </form>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
          <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Code</th>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Department</th>
            <th style={{ padding: 8 }}>Designation</th>
            <th style={{ padding: 8 }}>HOD</th>
            <th style={{ padding: 8 }}>Linked login</th>
            <th style={{ padding: 8 }}>Joining</th>
            <th style={{ padding: 8 }}>Birthday</th>
            <th style={{ padding: 8 }}>Anniv.</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                <input defaultValue={emp.employeeCode} onBlur={(e) => {
                  if (e.target.value !== emp.employeeCode) handleReassign(emp, "employeeCode", e.target.value);
                }} style={{ padding: 4, width: 80 }} disabled={!isAdmin} />
              </td>
              <td style={{ padding: 8 }}>
                <input defaultValue={emp.fullName} onBlur={(e) => {
                  if (e.target.value !== emp.fullName) handleReassign(emp, "fullName", e.target.value);
                }} style={{ padding: 4, width: 120 }} disabled={!isAdmin} />
              </td>
              <td style={{ padding: 8 }}>
                  <select value={emp.departmentId || ""} onChange={(e) => handleReassign(emp, "departmentId", e.target.value)} disabled={!isAdmin}>
                    <option value="">-- None --</option>
                    {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
              </td>
              <td style={{ padding: 8 }}>
                  <select value={emp.designationId || ""} onChange={(e) => handleReassign(emp, "designationId", e.target.value)} disabled={!isAdmin}>
                    <option value="">-- None --</option>
                    {designations.map((d) => (<option key={d.id} value={d.id}>{d.title}</option>))}
                  </select>
              </td>
              <td style={{ padding: 8 }}>
                  <select value={emp.managerId || ""} onChange={(e) => handleReassign(emp, "managerId", e.target.value)} disabled={!isAdmin}>
                    <option value="">-- None --</option>
                    {hods.map((h) => (<option key={h.id} value={h.id}>{h.name}</option>))}
                  </select>
              </td>
              <td style={{ padding: 8 }}>
                  <select value={emp.userId || ""} onChange={(e) => handleReassign(emp, "userId", e.target.value)} disabled={!isAdmin}>
                    <option value="">-- Unlinked --</option>
                    {users.map((u) => (<option key={u.id} value={u.id}>{u.email}</option>))}
                  </select>
              </td>
              <td style={{ padding: 8 }}>
                <input type="date" value={emp.dateOfJoining ? emp.dateOfJoining.split("T")[0] : ""} 
                  onChange={(e) => handleReassign(emp, "dateOfJoining", e.target.value)} style={{ padding: 2 }} disabled={!isAdmin} />
              </td>
              <td style={{ padding: 8 }}>
                <input type="date" value={emp.birthday ? emp.birthday.split("T")[0] : ""} 
                  onChange={(e) => handleReassign(emp, "birthday", e.target.value)} style={{ padding: 2 }} disabled={!isAdmin} />
              </td>
              <td style={{ padding: 8 }}>
                <input type="date" value={emp.anniversary ? emp.anniversary.split("T")[0] : ""} 
                  onChange={(e) => handleReassign(emp, "anniversary", e.target.value)} style={{ padding: 2 }} disabled={!isAdmin} />
              </td>
              <td style={{ padding: 8 }}>
                  <select value={emp.status || "active"} onChange={(e) => handleReassign(emp, "status", e.target.value)} disabled={!isAdmin} style={{ padding: 2 }}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
              </td>
              <td style={{ padding: 8 }}>
                  {isAdmin && <button onClick={() => {
                    if (confirm("Are you sure you want to delete this employee?")) {
                      employeesApi.remove(emp.id).then(() => load()).catch(err => alert("Failed to delete."));
                    }
                  }} style={{ color: "white", background: "#dc3545", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
