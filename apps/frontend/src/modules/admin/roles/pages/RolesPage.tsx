import { FormEvent, useEffect, useState } from "react";
import { rolesApi, permissionsApi, RoleRecord, PermissionRecord } from "../api/rolesApi";
import PermissionGate from "../../../../shared/guards/PermissionGate";
import { useHasPermission } from "../../../auth/hooks/usePermissions";

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionRecord[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);
  const [rolePermissionIds, setRolePermissionIds] = useState<Set<string>>(new Set());
  const [newRoleName, setNewRoleName] = useState("");
  const canUpdate = useHasPermission("rbac.role.update");

  async function load() {
    const [roleList, permissionList] = await Promise.all([rolesApi.list(), permissionsApi.list()]);
    setRoles(roleList);
    setAllPermissions(permissionList);
  }

  useEffect(() => { load(); }, []);

  async function selectRole(role: RoleRecord) {
    setSelectedRole(role);
    const perms = await rolesApi.getPermissions(role.id);
    setRolePermissionIds(new Set(perms.map((p) => p.id)));
  }

  async function handleCreateRole(e: FormEvent) {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    await rolesApi.create(newRoleName.trim());
    setNewRoleName("");
    await load();
  }

  async function handleDeleteRole(role: RoleRecord) {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    await rolesApi.remove(role.id);
    if (selectedRole?.id === role.id) setSelectedRole(null);
    await load();
  }

  function togglePermission(permissionId: string) {
    setRolePermissionIds((prev) => {
      const next = new Set(prev);
      next.has(permissionId) ? next.delete(permissionId) : next.add(permissionId);
      return next;
    });
  }

  async function handleSavePermissions() {
    if (!selectedRole) return;
    await rolesApi.setPermissions(selectedRole.id, Array.from(rolePermissionIds));
    alert("Permissions saved.");
  }

  return (
    <div style={{ display: "flex", gap: 32 }}>
      <div style={{ minWidth: 260 }}>
        <h1 style={{ fontSize: 20 }}>Roles</h1>
        <PermissionGate permission="rbac.role.create">
          <form onSubmit={handleCreateRole} style={{ margin: "12px 0", display: "flex", gap: 8 }}>
            <input placeholder="New role name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} style={{ padding: 6, flex: 1 }} />
            <button type="submit">Add</button>
          </form>
        </PermissionGate>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {roles.map((r) => (
            <li key={r.id} style={{ padding: 8, borderBottom: "1px solid #eee", background: selectedRole?.id === r.id ? "#f2f2f2" : "transparent", cursor: "pointer" }}>
              <span onClick={() => selectRole(r)}>{r.name} {r.isSystemRole && <em style={{ fontSize: 11 }}>(system)</em>}</span>
              <PermissionGate permission="rbac.role.delete">
                {!r.isSystemRole && (
                  <button style={{ float: "right" }} onClick={() => handleDeleteRole(r)}>Delete</button>
                )}
              </PermissionGate>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1 }}>
        {selectedRole ? (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Permissions for "{selectedRole.name}"</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4 }}>
              {allPermissions.map((p) => (
                <label key={p.id} style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    disabled={!canUpdate}
                    checked={rolePermissionIds.has(p.id)}
                    onChange={() => togglePermission(p.id)}
                  />{" "}
                  {p.key}
                </label>
              ))}
            </div>
            <PermissionGate permission="rbac.role.update">
              <button style={{ marginTop: 16 }} onClick={handleSavePermissions}>Save permissions</button>
            </PermissionGate>
          </>
        ) : (
          <p style={{ color: "#777" }}>Select a role to view/edit its permissions.</p>
        )}
      </div>
    </div>
  );
}
