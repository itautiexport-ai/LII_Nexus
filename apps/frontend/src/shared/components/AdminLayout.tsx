import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../modules/auth/api/authApi";
import { useAuthStore } from "../../modules/auth/hooks/useAuthStore";
import NotificationBell from "../../modules/notifications/components/NotificationBell";
import { env } from "../../config/env";

export interface NavItem {
  label: string;
  to?: string;
  items?: NavItem[];
  hideChildrenInSidebar?: boolean;
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
    allowedRoles: ["System Admin", "HOD", "CEO", "HR Admin"],
    items: [
      { label: "Users", to: "/admin/users" },
      { label: "Permissions", to: "/admin/permissions" },
      {
        label: "Master Data",
        to: "/admin/master-data",
        hideChildrenInSidebar: true,
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
        ]
      }
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
      {
        label: "Checklist",
        to: "/admin/checklist",
        hideChildrenInSidebar: true,
        items: [
          { label: "MY Checklist", to: "/admin/my-checklists" },
          { label: "List Checklist", to: "/admin/standalone-checklist/list" },
          { label: "Add Checklist", to: "/admin/standalone-checklist/add" },
        ]
      },
      {
        label: "Delegation",
        to: "/admin/delegation",
        hideChildrenInSidebar: true,
        items: [
          { label: "List Delegation", to: "/admin/delegation/list" },
          { label: "Add Delegation", to: "/admin/delegation/new" },
          { label: "My Delegation", to: "/admin/delegation/user" },
        ]
      },
      {
        label: "FMS",
        to: "/admin/fms",
        items: [
          { label: "My FMS", to: "/admin/user-dashboard/fms" },
          { label: "List FMS Manager", to: "/admin/fms/list" },
          { label: "Add FMS Manager", to: "/admin/fms/add" },
          { label: "FMS Grid View", to: "/admin/fms/manager" },
          {
            label: "Forms",
            items: [
              { label: "Form Builder", to: "/admin/fms/forms" },
              { label: "List Form", to: "/admin/fms/list-forms" },
            ]
          },
        ]
      },
    ],
  },
  {
    key: "dpr-management",
    label: "DPR Management",
    allowedRoles: ["System Admin", "DPR Management Access", "DPR Management"],
    items: [
      { label: "DPR Entry", to: "/admin/dpr-entry" },
    ],
  },
  {
    key: "machine-shop",
    label: "Machine Shop",
    allowedRoles: ["System Admin", "Machine Efficiency Access"],
    items: [
      {
        label: "Machine Efficiency",
        to: "/admin/machine-efficiency/hub",
        hideChildrenInSidebar: true,
        items: [
          { label: "Add Efficiency", to: "/admin/machine-efficiency/new" },
          { label: "List Efficiency", to: "/admin/machine-efficiency" },
        ]
      }
    ],
  },
  {
    key: "finishing",
    label: "Finishing",
    allowedRoles: ["System Admin", "Finishing Access"],
    items: [
      { label: "Finishing Recipe", to: "/admin/finishing-recipe" }
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
        to: "/admin/crm/quotations/hub",
        hideChildrenInSidebar: true,
        items: [
          { label: "Add Quotation", to: "/admin/crm/quotations/new" },
          { label: "List Quotations", to: "/admin/crm/quotations" },
        ]
      },
      {
        label: "Complaints",
        to: "/admin/crm/complaints/hub",
        hideChildrenInSidebar: true,
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
    key: "executive-meetings",
    label: "Executive Meetings",
    allowedRoles: ["System Admin", "CEO"],
    items: [
      { label: "Office EM", to: "/admin/reports/office-em" },
      { label: "Production EM", to: "/admin/reports/production-em" },
      { label: "EM List", to: "/admin/reports/office-em-list" }
    ],
  },
 {
    key: "hr-module",
    label: "HR",
    allowedRoles: ["System Admin", "HR", "CEO", "HOD", "HR Admin", "Help Ticket Access"],
    items: [
      { label: "Attendance Calculator", to: "/admin/hr/attendance-calculator" },
      { label: "Weekly Payroll", to: "/admin/hr/weekly-payroll" },
      { label: "Monthly Salary Sheet", to: "/admin/hr/monthly-salary-sheet" },
      { label: "Notices", to: "/admin/hr/notices" },
      { label: "Annual Training Planner", to: "/admin/hr/annual-training-planner" },
      { label: "KRA", to: "/admin/hr/kra" },
      {
        label: "Security",
        to: "/admin/hr/security/night-form",
        items: [
          { label: "Security Night Form", to: "/admin/hr/security/night-form" },
          { label: "Security Night Log History", to: "/admin/hr/security/night-log-history" },
          { label: "Visitor Entry", to: "/admin/hr/security/visitor-entry" },
          { label: "Visitor Entry History", to: "/admin/hr/security/visitor-entry-history" }
        ]
      },
      {
        label: "Vehicle Request Management",
        to: "/admin/hr/vehicle-request/form",
        items: [
          { label: "Vehicle Requirement Form", to: "/admin/hr/vehicle-request/form" },
          { label: "Vehicle Request History", to: "/admin/hr/vehicle-request/history" },
          { label: "Driver Route Planning", to: "/admin/hr/vehicle-request/route-planning" }
        ]
      },
      {
        label: "Recruitment & Induction",
        to: "/admin/hr/recruitment-induction",
        items: [
          { label: "Job Requisitions", to: "/admin/hr/recruitment-induction/jobs" },
          { label: "Job Requisition List", to: "/admin/hr/recruitment-induction/job-list" },
          { label: "Online Assessment Test", to: "/admin/hr/recruitment-induction/assessment" },
          { label: "Employee Induction Completion Form", to: "/admin/hr/recruitment-induction/induction-completion" },
          { label: "Employee Induction Completion Form List", to: "/admin/hr/recruitment-induction/induction-completion-list" },
          { label: "Employee Asset Management", to: "/admin/hr/recruitment-induction/employee-assets" },
          { label: "Employee Separation & F&F Settlement", to: "/admin/hr/recruitment-induction/separation-settlement" },
          { label: "New Hire Induction", to: "/admin/hr/recruitment-induction/onboarding" }
        ]
      },
      {
        label: "Help Ticket",
        to: "/admin/help-tickets/hub",
        hideChildrenInSidebar: true,
        items: [
          { label: "List All Help Ticket", to: "/admin/help-tickets/all" },
          { label: "Add New Ticket", to: "/admin/help-tickets/new" },
          { label: "Assigned to Me", to: "/admin/help-tickets/assigned-to-me" },
          { label: "Assigned by Me", to: "/admin/help-tickets/assigned-by-me" },
        ]
      }
    ],
  },
  {
    key: "maintenance-module",
    label: "Maintenance",
    allowedRoles: ["System Admin", "Maintenance", "Maintenance Access", "CEO", "HOD", "Supervisor"],
    items: [
      { label: "Machine Details", to: "/admin/maintenance/machine-details" },
      { label: "Machine Maintenance Details", to: "/admin/maintenance/machine-maintenance-details" },
      { label: "Machine Breakdown Details", to: "/admin/maintenance/machine-breakdown-details" },
      { label: "AMC Management", to: "/admin/maintenance/amc-management" },
      {
        label: "Preventive Maintenance",
        to: "/admin/maintenance/preventive-maintenance/pmc",
        items: [
          { label: "PMC (Preventive Maintenance Checklist)", to: "/admin/maintenance/preventive-maintenance/pmc" }
        ]
      }
    ],
  },
  {
    key: "order-management",
    label: "Order Management",
    allowedRoles: ["System Admin", "CEO", "HOD"],
    items: [
      { label: "Order Dashboard", to: "/admin/order-management/summary" },
      { label: "Buyer Dashboard", to: "/admin/order-management/buyers" },
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
    key: "maintenance",
    label: "Maintenance",
    allowedRoles: ["System Admin", "CEO", "HOD"],
    items: [
      { label: "Maintenance Dashboard", to: "/admin/maintenance/dashboard" },
      { label: "Equipment Assets", to: "/admin/maintenance/equipment" },
      { label: "Work Orders", to: "/admin/maintenance/work-orders" },
      { label: "Preventive Maintenance", to: "/admin/maintenance/preventive" },
      { label: "Breakdown Logs", to: "/admin/maintenance/breakdowns" },
      { label: "Spare Parts", to: "/admin/maintenance/spare-parts" },
      { label: "AMC Management", to: "/admin/maintenance/amc-management" },
      { label: "Maintenance Checklist", to: "/admin/maintenance/checklist" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    allowedRoles: ["System Admin", "CEO", "HOD", "Supervisor", "HR"],
    items: [
      {
        label: "Production Report",
        to: "/admin/reports/production-hub",
        hideChildrenInSidebar: true,
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
  },
  {
    key: "formats",
    label: "Formats",
    allowedRoles: ["System Admin"],
    items: [
      { label: "Formats Library", to: "/admin/formats" }
    ],
  }
];

function SidebarSubGroup({ item, pathname, userRoles, legacyAccess, sectionRolePrefix }: { item: any; pathname: string; userRoles: string[]; legacyAccess: boolean; sectionRolePrefix: string }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(() => {
    return item.items.some((sub: any) => pathname === sub.to || pathname.startsWith(sub.to + "/"));
  });

  const visibleSubs = item.items.filter((sub: any) => {
    if (legacyAccess) return true;
    
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
        onClick={() => {
          setIsExpanded((e: boolean) => !e);
          if (item.to) {
            navigate(item.to);
          }
        }}
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
    // Refresh user object and roles from server on route change to strictly enforce permissions
    if (accessToken) {
      authApi.getMe().then(({ user: refreshedUser }) => {
        setSession(accessToken, refreshedUser, permissions);
      }).catch((err) => {
        console.error("Failed to refresh user profile:", err);
      });
    }
  }, [location.pathname]);

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
            
            // Check specific item role
            const itemRole = `${sectionRolePrefix} -> ${item.label}`;
            if (userRoles.includes(itemRole)) return true;
            if (item.items) {
              return item.items.some((sub: any) => userRoles.includes(`${itemRole} -> ${sub.label}`));
            }
            return false;
          });

          if (visibleItems.length === 0 && !userRoles.includes(sectionRolePrefix) && !isSystemAdmin) return null;

          return (
            <div className="sidebar-section" key={section.key}>
              <button
                type="button"
                className={"sidebar-section-header" + (isSectionActive ? " active" : "")}
                onClick={() => {
                  toggleSection(section.key);
                  if (section.key === 'task-center') {
                    navigate(`/admin/task-center`);
                  } else if (section.key === 'formats') {
                    navigate(`/admin/formats`);
                  } else {
                    navigate(`/admin/modules/${section.key}`);
                  }
                }}
                aria-expanded={isExpanded}
              >
                <span>{section.label}</span>
                <span className={"chevron" + (isExpanded ? " expanded" : "")}>▶</span>
              </button>
              <div className={"sidebar-submenu" + (isExpanded ? " expanded" : "")}>
                <div className="sidebar-submenu-inner">
                  {visibleItems.map((item: any) => {
                    if (item.items && !item.hideChildrenInSidebar) {
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
          {/* User profile in top-right */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginLeft: "16px",
            paddingLeft: "16px",
            borderLeft: "1px solid #e5e7eb",
          }}>
            {/* Avatar circle */}
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl.startsWith('/') ? new URL(env.apiBaseUrl).origin + user.avatarUrl : user.avatarUrl}
                alt={user?.fullName}
                style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #c7d2fe", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "linear-gradient(135deg, #4338ca, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 16, color: "#fff", flexShrink: 0,
                border: "2px solid #c7d2fe",
              }}>
                {user?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827", lineHeight: 1.2 }}>{user?.fullName}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", lineHeight: 1.4 }}>{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "#fff",
                color: "#374151",
                border: "1px solid #d1d5db",
                padding: "6px 14px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "13px",
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              Logout
            </button>
          </div>
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

    .content-topbar {
      padding: 12px 16px 0;
    }

    .content-inner {
      padding: 12px 16px 24px;
    }
  }
`;
