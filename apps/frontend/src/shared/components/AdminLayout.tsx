import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../modules/auth/api/authApi";
import { useAuthStore } from "../../modules/auth/hooks/useAuthStore";
import NotificationBell from "../../modules/notifications/components/NotificationBell";

export interface NavItem {
  label: string;
  to?: string;
  items?: NavItem[];
}

export interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
  allowedRoles?: string[];
}

export const SECTIONS: NavSection[] = [
  {
    key: "administration",
    label: "Administration",
    allowedRoles: ["System Admin"],
    items: [
      { label: "Users", to: "/admin/users" },
      { label: "Permissions", to: "/admin/permissions" },
    ],
  },
  {
    key: "master-data",
    label: "Master Data",
    allowedRoles: ["System Admin", "HOD", "CEO", "HR Admin"],
    items: [
      { label: "Departments", to: "/admin/departments" },
      { label: "Designations", to: "/admin/designations" },
      { label: "Shifts", to: "/admin/shifts" },
      { label: "Wood Types", to: "/admin/wood-types" },
      { label: "Priorities", to: "/admin/priorities" },
      { label: "UOMs", to: "/admin/uoms" },
      { label: "HOD Names", to: "/admin/hods" },
      { label: "Merchants", to: "/admin/merchants" },
      { label: "Module Weights", to: "/admin/module-weights" },
      { label: "Machine Targets", to: "/admin/machine-targets" },
      { label: "Machine Names", to: "/admin/machines-products" },
      { label: "Employees", to: "/admin/employees" },
      { label: "Buyers", to: "/admin/buyers" },
      { label: "Weights", to: "/admin/module-weights" },
    ],
  },
  {
    key: "resource-center",
    label: "Resource Center",
    allowedRoles: ["System Admin", "HOD", "CEO", "HR Admin", "HR", "Supervisor"],
    items: [
      { label: "Document Library", to: "/admin/resource-center/document-library" },
      { label: "Important URLs",   to: "/admin/resource-center/important-urls" },
      { label: "SOPs",             to: "/admin/resource-center/sops" },
      { label: "Policies",         to: "/admin/resource-center/policies" },
      { label: "Forms",            to: "/admin/resource-center/forms" },
      { label: "Templates",        to: "/admin/resource-center/templates" },
      { label: "Manuals",          to: "/admin/resource-center/manuals" },
    ],
  },
  {
    key: "task-center",
    label: "Task Center",
    allowedRoles: ["System Admin", "HOD", "CEO", "Supervisor"],
    items: [
      { label: "List Delegation", to: "/admin/delegation" },
      { label: "Add Delegation", to: "/admin/delegation/new" },
      { label: "List Checklist", to: "/admin/standalone-checklist/list" },
      { label: "Add Checklist", to: "/admin/standalone-checklist/add" },
      { label: "List FMS Manager", to: "/admin/fms/list" },
      { label: "Add FMS Manager", to: "/admin/fms/add" },
    ],
  },
  {
    key: "machine-shop",
    label: "Machine Shop",
    allowedRoles: ["System Admin", "DPR Management Access", "DPR Management", "Machine Efficiency Access"],
    items: [
      {
        label: "DPR Management",
        items: [
          { label: "DPR Entry", to: "/admin/dpr-entry" },
        ]
      },
      {
        label: "Machine Efficiency",
        items: [
          { label: "Add Efficiency", to: "/admin/machine-efficiency/new" },
          { label: "List Efficiency", to: "/admin/machine-efficiency" },
        ]
      }
    ],
  },
  {
    key: "user-dashboard",
    label: "User Dashboard",
    allowedRoles: ["System Admin", "User Dashboard Access"],
    items: [
      { label: "Delegation", to: "/admin/user-dashboard/delegation" },
      { label: "Checklist", to: "/admin/user-dashboard/checklist" },
      { label: "FMS", to: "/admin/user-dashboard/fms" },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    allowedRoles: ["System Admin", "Merchant", "CEO"],
    items: [
      { label: "Add Lead", to: "/admin/crm/leads/new" },
      { label: "List Leads", to: "/admin/crm/leads" },
      { 
        label: "Quotations", 
        items: [
          { label: "Add Quotation", to: "/admin/crm/quotations/new" },
          { label: "List Quotations", to: "/admin/crm/quotations" },
        ]
      },
      {
        label: "Complaints",
        items: [
          { label: "New Complaint", to: "/admin/crm/complaints/new" },
          { label: "List Complaints", to: "/admin/crm/complaints" },
          { label: "Investigation", to: "/admin/crm/investigation" },
          { label: "CAPA", to: "/admin/crm/capa" },
        ]
      }
    ],
  },
  {
    key: "manufacturing",
    label: "Manufacturing Insight",
    allowedRoles: ["System Admin", "Manufacturing Access", "HOD", "CEO"],
    items: [
      { label: "Production Progress", to: "/admin/manufacturing/production-progress" },
      { label: "Production Planning Sheet", to: "/admin/manufacturing/production-planning-sheet" },
      { label: "Production Insight", to: "/admin/manufacturing/production-insight" }
    ],
  },
  {
    key: "help-ticket",
    label: "Help Ticket",
    allowedRoles: ["System Admin", "Help Ticket Access"],
    items: [
      { label: "List All Help Ticket", to: "/admin/help-tickets/all" },
      { label: "Add New Ticket", to: "/admin/help-tickets/new" },
      { label: "Assigned to Me", to: "/admin/help-tickets/assigned-to-me" },
      { label: "Assigned by Me", to: "/admin/help-tickets/assigned-by-me" },
    ],
  },
  {
    key: "executive-meetings",
    label: "Executive Meetings",
    allowedRoles: ["System Admin", "CEO"],
    items: [
      { label: "Office EM", to: "/admin/reports/office-em" },
      { label: "EM List", to: "/admin/reports/office-em-list" }
    ],
  },
  {
    key: "hr-module",
    label: "HR",
    allowedRoles: ["System Admin", "HR", "CEO", "HOD", "HR Admin"],
    items: [
      { label: "Attendance Calculator", to: "/admin/hr/attendance-calculator" },
      { label: "Notices", to: "/admin/hr/notices" },
      { label: "Annual Training Planner", to: "/admin/hr/annual-training-planner" },
      { label: "KRA", to: "/admin/hr/kra" },
    ],
  },
  {
    key: "order-management",
    label: "Order Management",
    allowedRoles: ["System Admin", "CEO", "HOD"],
    items: [
      { label: "Add Order", to: "/admin/order-management/new" },
      { label: "List Order In Hand", to: "/admin/order-management/list" },
    ],
  },
  {
    key: "performance-evaluation",
    label: "Performance Evaluation",
    allowedRoles: ["System Admin", "HOD", "HR", "CEO"],
    items: [
      { label: "HOD Evaluation", to: "/admin/performance-evaluation/hod" },
      { label: "HR Evaluation", to: "/admin/performance-evaluation/hr" },
      { label: "Employee Score", to: "/admin/performance-evaluation/employee-score" }
    ],
  },
  {
    key: "reports",
    label: "Reports",
    allowedRoles: ["System Admin", "CEO", "HOD", "Supervisor", "HR"],
    items: [
      {
        label: "Production Report",
        items: [
          { label: "Daily Production Report", to: "/admin/reports/daily-production" },
          { label: "Detailed DPR", to: "/admin/reports/detailed-production" },
        ]
      },
      {
        label: "Performance Management",
        items: [
          { label: "Appraisal Index", to: "/admin/reports/appraisal-index" },
        ]
      }
    ],
  }
];

function SidebarSubGroup({ item, pathname, userRoles, legacyAccess, sectionRolePrefix }: { item: any; pathname: string; userRoles: string[]; legacyAccess: boolean; sectionRolePrefix: string }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return item.items.some((sub: any) => pathname === sub.to || pathname.startsWith(sub.to + "/"));
  });

  const visibleSubs = item.items.filter((sub: any) => {
    if (legacyAccess) return true;
    if (userRoles.includes(sectionRolePrefix)) return true;
    
    // Check specific sub-item role
    const subItemRole = `${sectionRolePrefix} -> ${item.label} -> ${sub.label}`;
    return userRoles.includes(subItemRole);
  });

  if (visibleSubs.length === 0 && !userRoles.includes(sectionRolePrefix) && !legacyAccess) return null;

  return (
    <div className="sidebar-subgroup">
      <button 
        type="button"
        className={"sidebar-subgroup-title" + (isExpanded ? " active" : "")}
        onClick={() => setIsExpanded((e: boolean) => !e)}
      >
        <span>{item.label}</span>
        <span className={"chevron" + (isExpanded ? " expanded" : "")}>▶</span>
      </button>
      <div className={"sidebar-submenu" + (isExpanded ? " expanded" : "")}>
        <div className="sidebar-submenu-inner" style={{ paddingTop: 4, paddingBottom: 4 }}>
          {visibleSubs.map((sub: any) => (
            <NavLink
              key={sub.to}
              to={sub.to}
              className={({ isActive }) => "sidebar-sublink nested" + (isActive ? " active" : "")}
            >
              {sub.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "lii-nexus-sidebar-expanded-section";

function findActiveSectionKey(pathname: string): string | null {
  for (const section of SECTIONS) {
    if (section.items.some((item: any) => {
      if (item.items) {
        return item.items.some((sub: any) => pathname === sub.to || pathname.startsWith(sub.to + "/"));
      }
      return pathname === item.to || pathname.startsWith(item.to + "/");
    })) {
      return section.key;
    }
  }
  return null;
}

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const permissions = useAuthStore((s) => s.permissions);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Refresh user object and roles from server when AdminLayout mounts
    if (accessToken) {
      authApi.getMe().then(({ user: refreshedUser }) => {
        setSession(accessToken, refreshedUser, permissions);
      }).catch((err) => {
        console.error("Failed to refresh user profile:", err);
      });
    }
  }, []);

  const activeSectionKey = useMemo(() => findActiveSectionKey(location.pathname), [location.pathname]);

  const [expandedKey, setExpandedKey] = useState<string | null>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return stored ?? null;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-expand the section containing the active route (e.g. on refresh
  // or direct navigation), without overriding a user's manual choice to
  // collapse a different, non-active section.
  useEffect(() => {
    if (activeSectionKey) {
      setExpandedKey(activeSectionKey);
    }
  }, [activeSectionKey]);

  useEffect(() => {
    if (expandedKey) window.localStorage.setItem(STORAGE_KEY, expandedKey);
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [expandedKey]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await authApi.logout();
    clear();
    navigate("/login");
  }

  function toggleSection(key: string) {
    setExpandedKey((current) => (current === key ? null : key));
  }

  const sidebarContent = (
    <>
      <div className="sidebar-header" style={{ cursor: "pointer", padding: "16px", display: "flex", justifyContent: "center" }} onClick={() => navigate("/admin")}>
        <img src="/logo.jpg" alt="Laxmi Ideal Interiors" style={{ width: "100%", maxHeight: "80px", objectFit: "contain", borderRadius: "8px" }} />
      </div>

      <nav className="sidebar-nav">
        {(user?.roles.includes("System Admin") || user?.roles.includes("CEO")) && (
          <NavLink
            to="/admin/command-center"
            className={({ isActive }) => "sidebar-toplink" + (isActive ? " active" : "")}
          >
            🎯 Command Center
          </NavLink>
        )}

        {SECTIONS.filter(section => {
          if (!user) return false;
          const userRoles = user.roles || [];
          
          // System Admin bypasses all checks
          if (userRoles.includes("System Admin")) {
            return true;
          }
          
          // Granular check: Check if user has "Menu: Section" OR ANY "Menu: Section -> Item"
          const sectionRolePrefix = `Menu: ${section.label}`;
          return userRoles.some(r => r === sectionRolePrefix || r.startsWith(`${sectionRolePrefix} -> `));
        }).map((section) => {
          const isExpanded = expandedKey === section.key;
          const isSectionActive = activeSectionKey === section.key;

          // Filter section.items based on user roles
          const userRoles = user?.roles || [];
          const isSystemAdmin = userRoles.includes("System Admin");
          const sectionRolePrefix = `Menu: ${section.label}`;
          
          const visibleItems = section.items.filter((item: any) => {
            if (isSystemAdmin) return true; // System Admin sees all
            if (userRoles.includes(sectionRolePrefix)) return true; // Top-level Menu role grants all access
            
            // Check specific item role
            const itemRole = `${sectionRolePrefix} -> ${item.label}`;
            return userRoles.includes(itemRole);
          });

          if (visibleItems.length === 0 && !userRoles.includes(sectionRolePrefix) && !isSystemAdmin) return null;

          return (
            <div className="sidebar-section" key={section.key}>
              <button
                type="button"
                className={"sidebar-section-header" + (isSectionActive ? " active" : "")}
                onClick={() => {
                  toggleSection(section.key);
                  navigate(`/admin/modules/${section.key}`);
                }}
                aria-expanded={isExpanded}
              >
                <span>{section.label}</span>
                <span className={"chevron" + (isExpanded ? " expanded" : "")}>▶</span>
              </button>
              <div className={"sidebar-submenu" + (isExpanded ? " expanded" : "")}>
                <div className="sidebar-submenu-inner">
                  {visibleItems.map((item: any) => {
                    if (item.items) {
                      return (
                        <SidebarSubGroup 
                          key={item.label} 
                          item={item} 
                          pathname={location.pathname} 
                          userRoles={userRoles}
                          legacyAccess={isSystemAdmin}
                          sectionRolePrefix={sectionRolePrefix}
                        />
                      );
                    }
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => "sidebar-sublink" + (isActive ? " active" : "")}
                      >
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-user-name">{user?.fullName}</p>
        <p className="sidebar-user-email">{user?.email}</p>
        <button className="sidebar-logout" onClick={handleLogout}>Logout</button>
      </div>
    </>
  );

  return (
    <div className="admin-shell">
      <style>{SIDEBAR_STYLES}</style>

      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">☰</button>
        <span className="mobile-title">LII Nexus Admin</span>
      </div>

      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={"admin-sidebar" + (mobileOpen ? " open" : "")}>
        {sidebarContent}
      </aside>

      <main className="admin-content">
        <div className="content-topbar">
          <NotificationBell />
        </div>
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const SIDEBAR_STYLES = `
  * { box-sizing: border-box; }

  .admin-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .admin-sidebar {
    width: 248px;
    flex-shrink: 0;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    border-right: 1px solid #e5e7eb;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .admin-sidebar::-webkit-scrollbar { width: 6px; }
  .admin-sidebar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
  .admin-sidebar::-webkit-scrollbar-track { background: transparent; }

  .sidebar-header {
    padding: 18px 16px 14px;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;
  }
  .sidebar-header h2 {
    font-size: 15px;
    font-weight: 700;
    margin: 0;
    color: #111827;
    letter-spacing: -0.01em;
  }

  .sidebar-nav {
    flex: 1;
    padding: 10px 8px;
  }

  .sidebar-toplink {
    display: block;
    padding: 9px 12px;
    margin-bottom: 6px;
    border-radius: 6px;
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 600;
    color: #374151;
    transition: background-color 0.15s ease, color 0.15s ease;
  }
  .sidebar-toplink:hover { background: #eef0f3; }
  .sidebar-toplink.active { background: #e8edff; color: #3457d5; }

  .sidebar-section {
    margin-bottom: 2px;
  }

  .sidebar-section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 9px 12px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6b7280;
    transition: background-color 0.15s ease, color 0.15s ease;
  }
  .sidebar-section-header:hover { background: #eef0f3; color: #374151; }
  .sidebar-section-header.active { color: #3457d5; }

  .chevron {
    display: inline-block;
    font-size: 9px;
    transition: transform 0.25s ease;
    color: inherit;
  }
  .chevron.expanded { transform: rotate(90deg); }

  .sidebar-submenu {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.25s ease;
  }
  .sidebar-submenu.expanded {
    max-height: 600px;
    transition: max-height 0.3s ease;
  }

  .sidebar-submenu-inner {
    padding: 2px 8px 6px 14px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .sidebar-sublink {
    display: block;
    padding: 7px 12px;
    border-radius: 6px;
    text-decoration: none;
    font-size: 13px;
    color: #4b5563;
    border-left: 2px solid transparent;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .sidebar-sublink:hover { background: #f3f4f6; color: #111827; }
  .sidebar-sublink.active { background: #e0e7ff; color: #4338ca; font-weight: 500; }
  
  .sidebar-subgroup {
    margin: 0;
  }
  .sidebar-subgroup-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: none;
    padding: 7px 12px;
    border-radius: 6px;
    font-size: 13px;
    color: #4b5563;
    border: none;
    border-left: 2px solid transparent;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease, color 0.15s ease;
  }
  .sidebar-subgroup-title:hover { background: #f3f4f6; color: #111827; }
  .sidebar-subgroup-title.active { color: #111827; font-weight: 500; }
  .sidebar-subgroup-title .chevron { font-size: 8px; color: #9ca3af; transition: transform 0.2s ease; }
  .sidebar-subgroup-title .chevron.expanded { transform: rotate(90deg); }
  .sidebar-sublink.nested {
    padding-left: 28px;
  }

  .sidebar-footer {
    flex-shrink: 0;
    padding: 14px 16px;
    border-top: 1px solid #eee;
    font-size: 12.5px;
    color: #6b7280;
  }
  .sidebar-user-name { margin: 0; font-weight: 600; color: #111827; }
  .sidebar-user-email { margin: 2px 0 10px; word-break: break-all; }
  .sidebar-logout {
    padding: 6px 12px;
    font-size: 12.5px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .sidebar-logout:hover { background: #f3f4f6; }

  .admin-content {
    flex: 1;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    background: #fff;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .content-topbar {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px 0;
  }
  .content-inner {
    padding: 16px 24px 32px;
  }

  .mobile-topbar { display: none; }
  .sidebar-backdrop { display: none; }

  @media (max-width: 860px) {
    .mobile-topbar {
      display: flex;
      align-items: center;
      gap: 12px;
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 52px;
      padding: 0 12px;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      z-index: 30;
    }
    .mobile-menu-btn {
      border: none;
      background: transparent;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
    }
    .mobile-title { font-size: 14px; font-weight: 700; color: #111827; }

    .admin-shell { flex-direction: column; }

    .admin-sidebar {
      position: fixed;
      top: 0;
      left: -280px;
      width: 260px;
      z-index: 50;
      box-shadow: 2px 0 12px rgba(0,0,0,0.08);
      transition: left 0.25s ease;
    }
    .admin-sidebar.open { left: 0; }

    .sidebar-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      z-index: 40;
    }

    .admin-content {
      margin-top: 52px;
      height: calc(100vh - 52px);
    }
  }
`;
