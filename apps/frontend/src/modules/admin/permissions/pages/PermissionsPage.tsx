import { useEffect, useState } from "react";
import { rolesApi, RoleRecord, PermissionRecord, permissionsApi } from "../../roles/api/rolesApi";
import { usersApi, UserRecord } from "../../users/api/usersApi";
import { SECTIONS } from "../../../../shared/components/AdminLayout";
import { CustomSelect } from "../../../../shared/components/CustomSelect";

export default function PermissionsPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [stagedRoles, setStagedRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    rolesApi.list().then(setRoles);
    usersApi.list("").then(res => {
      if (Array.isArray(res)) setUsers(res);
      else if ((res as any).items) setUsers((res as any).items);
    });
  }, []);

  const selectedUser = users.find(u => u.id === selectedUserId);

  useEffect(() => {
    if (selectedUser) {
      setStagedRoles(selectedUser.roles || []);
    } else {
      setStagedRoles([]);
    }
  }, [selectedUserId, selectedUser]); // It's fine if this resets when selectedUser updates after save

  const getOrCreateRole = async (roleName: string) => {
    let existingRole = roles.find(r => r.name === roleName);
    if (existingRole) return existingRole;
    
    // Create it dynamically if it doesn't exist
    const newRole = await rolesApi.create(roleName, `Navigation access to ${roleName}`);
    setRoles(prev => [...prev, newRole]);
    return newRole;
  };

  const handleToggleMenuRole = (roleName: string, isAssigned: boolean) => {
    if (isAssigned) {
      setStagedRoles(prev => prev.filter(r => r !== roleName));
    } else {
      setStagedRoles(prev => [...prev, roleName]);
    }
  };

  const handleSave = async () => {
    if (!selectedUserId || !selectedUser) return;
    setIsSaving(true);
    try {
      const originalRoles = selectedUser.roles || [];
      const rolesToAdd = stagedRoles.filter(r => !originalRoles.includes(r));
      const rolesToRemove = originalRoles.filter(r => !stagedRoles.includes(r));
      
      const allPermissions = await permissionsApi.list();

      for (const roleName of rolesToAdd) {
        const role = await getOrCreateRole(roleName);
        await rolesApi.assignToUser(selectedUserId, role.id);
      }

      // Map backend permissions dynamically for ALL staged roles (ensures backfill)
      for (const roleName of stagedRoles) {
        let role = roles.find(r => r.name === roleName);
        if (!role) {
          role = await getOrCreateRole(roleName); // Just in case it was created in the loop above
        }
        
        const assignedModules = new Set<string>();
        SECTIONS.forEach(section => {
          section.items.forEach(item => {
            if (item.items) {
              item.items.forEach(sub => {
                if (roleName === `Menu: ${section.label} -> ${item.label} -> ${sub.label}` && sub.backendModules) {
                  sub.backendModules.forEach(m => assignedModules.add(m));
                }
              });
            } else {
              if (roleName === `Menu: ${section.label} -> ${item.label}` && item.backendModules) {
                item.backendModules.forEach(m => assignedModules.add(m));
              }
            }
          });
        });

        if (assignedModules.size > 0) {
          const matchingPerms = allPermissions.filter(p => assignedModules.has(p.module));
          if (matchingPerms.length > 0) {
            await rolesApi.setPermissions(role.id, matchingPerms.map(p => p.id));
          }
        }
      }
      
      for (const roleName of rolesToRemove) {
        let role = roles.find(r => r.name === roleName);
        if (role) {
          await rolesApi.removeFromUser(selectedUserId, role.id);
        }
      }
      
      // Update local users array
      setUsers(prevUsers => prevUsers.map(u => 
        u.id === selectedUserId 
          ? { ...u, roles: stagedRoles } 
          : u
      ));
      
      alert("Permissions saved successfully!");
    } catch (err) {
      console.error("Failed to save roles", err);
      alert("Failed to save user permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16, color: "#111827", fontWeight: 700 }}>User Permissions Assignment</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
        Select a user to assign granular access to Main Modules and Sub Modules.
      </p>
      
      <div style={{ background: "#f9fafb", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Select User
          </label>
          <div style={{ width: "100%", maxWidth: 400 }}>
            <CustomSelect
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="-- Select a User --"
              options={users.map(u => ({ value: u.id, label: `${u.fullName} (${u.email})` }))}
            />
          </div>
        </div>

        {selectedUser && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
              Navigation Permissions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SECTIONS.map(section => {
                const sectionRoleName = `Menu: ${section.label}`;
                const isSectionAssigned = stagedRoles.includes(sectionRoleName);
                
                return (
                  <div key={section.key} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                    {/* Main Module Checkbox */}
                    <div style={{ 
                      padding: "12px 16px", background: isSectionAssigned ? "#f0fdf4" : "#f9fafb", 
                      borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 
                    }}>
                      <input 
                        type="checkbox" 
                        checked={isSectionAssigned}
                        onChange={() => {
                          const allRolesForSection = [sectionRoleName];
                          
                          section.items.forEach((item: any) => {
                            if (item.items) {
                              item.items.forEach((sub: any) => {
                                allRolesForSection.push(`${sectionRoleName} -> ${item.label} -> ${sub.label}`);
                              });
                            } else {
                              allRolesForSection.push(`${sectionRoleName} -> ${item.label}`);
                            }
                          });

                          if (isSectionAssigned) {
                            // Deselect main module and all its sub-modules
                            setStagedRoles(prev => prev.filter(r => !allRolesForSection.includes(r)));
                          } else {
                            // Select main module and all its sub-modules
                            setStagedRoles(prev => Array.from(new Set([...prev, ...allRolesForSection])));
                          }
                        }}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#111827", textTransform: "uppercase" }}>{section.label} (Main Module)</span>
                    </div>

                    {/* Sub Modules Checkboxes */}
                    <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                      {section.items.map((item: any) => {
                        const isSubGroup = !!item.items;
                        
                        if (isSubGroup) {
                          return (
                            <div key={item.label} style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: 12 }}>
                              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                                <input 
                                  type="checkbox"
                                  checked={item.items.every((sub: any) => stagedRoles.includes(`${sectionRoleName} -> ${item.label} -> ${sub.label}`))}
                                  onChange={(e) => {
                                    const allRolesForGroup = item.items.map((sub: any) => `${sectionRoleName} -> ${item.label} -> ${sub.label}`);
                                    if (e.target.checked) {
                                      setStagedRoles(prev => Array.from(new Set([...prev, ...allRolesForGroup])));
                                    } else {
                                      setStagedRoles(prev => prev.filter(r => !allRolesForGroup.includes(r)));
                                    }
                                  }}
                                />
                                <strong style={{ fontSize: 13, color: "#4b5563" }}>{item.label} (Group)</strong>
                              </label>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {item.items.map((sub: any) => {
                                  const subRoleName = `${sectionRoleName} -> ${item.label} -> ${sub.label}`;
                                  const isSubAssigned = stagedRoles.includes(subRoleName);
                                  return (
                                    <label key={sub.label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isSubAssigned}
                                        onChange={() => handleToggleMenuRole(subRoleName, isSubAssigned)}
                                      />
                                      <span style={{ fontSize: 14, color: "#374151" }}>{sub.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        // Normal Item
                        const itemRoleName = `${sectionRoleName} -> ${item.label}`;
                        const isItemAssigned = stagedRoles.includes(itemRoleName);
                        return (
                          <label key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <input 
                              type="checkbox" 
                              checked={isItemAssigned}
                              onChange={() => handleToggleMenuRole(itemRoleName, isItemAssigned)}
                            />
                            <span style={{ fontSize: 14, color: "#374151" }}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  background: isSaving ? "#9ca3af" : "#1a7f37",
                  color: "#fff",
                  padding: "10px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                {isSaving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
