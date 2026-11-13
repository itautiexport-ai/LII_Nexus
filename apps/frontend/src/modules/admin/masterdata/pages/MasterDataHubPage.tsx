import { Link } from "react-router-dom";
import { useAuthStore } from "../../../auth/hooks/useAuthStore";

interface MasterHubEntry {
  label: string;
  to: string;
  desc: string;
  isSubModule?: boolean;
  childrenLabels?: string[];
}

export function MasterDataHubPage() {
  const user = useAuthStore((state: any) => state.user);
  const userRoles: string[] = user?.roles || [];
  const isSystemAdmin = userRoles.includes("System Admin");

  const allItems: MasterHubEntry[] = [
    {
      label: "Administrative Master",
      to: "/admin/master-data/administrative",
      desc: "Manage administrative master data configurations",
      isSubModule: true,
    },
    {
      label: "Human Resource Master",
      to: "/admin/master-data/human-resource",
      desc: "Manage human resource master data configurations",
      isSubModule: true,
    },
    {
      label: "Costing Master",
      to: "/admin/master-data/costing",
      desc: "Manage Metal Prices, Wood Thickness Prices, Hardware And Accessories, Wood Part Name, Additional Cost, MDF Prices, and Currency Conversion Rates",
      isSubModule: true,
      childrenLabels: [
        "Metal Prices",
        "Wood Thickness Prices",
        "Hardware And Accessories",
        "Wood Part Name",
        "Additional Cost",
        "MDF Prices",
        "Currency Conversion Rates",
      ],
    },
    { label: "Departments", to: "/admin/departments", desc: "Manage company departments" },
    { label: "Designations", to: "/admin/designations", desc: "Manage employee roles and titles" },
    { label: "Shifts", to: "/admin/shifts", desc: "Manage work shifts" },
    { label: "Wood Types", to: "/admin/wood-types", desc: "Manage wood types" },
    { label: "Priorities", to: "/admin/priorities", desc: "Manage priority levels" },
    { label: "UOMs", to: "/admin/uoms", desc: "Manage units of measurement" },
    { label: "HOD Names", to: "/admin/hods", desc: "Manage heads of departments" },
    { label: "Merchants", to: "/admin/merchants", desc: "Manage merchant accounts" },
    { label: "Module Weights", to: "/admin/module-weights", desc: "Manage scoring weights" },
    { label: "Machine Targets", to: "/admin/machine-targets", desc: "Manage production targets" },
    { label: "Machine Names", to: "/admin/machines-products", desc: "Manage machine and product configurations" },
    { label: "Employees", to: "/admin/employees", desc: "Manage employee records" },
    { label: "Buyers", to: "/admin/buyers", desc: "Manage buyers" },
    { label: "Finish Codes", to: "/admin/finish-codes", desc: "Manage finish codes" },
    { label: "QC Names", to: "/admin/qc-names", desc: "Manage Quality Controller (QC) inspectors" },
    { label: "PPT Themes & Front Pages", to: "/admin/ppt-themes", desc: "Manage PPT presentation themes and cover page templates" },
  ];

  const items = allItems.filter((item) => {
    if (isSystemAdmin) return true;
    const itemRole = `Menu: Administration -> Master Data -> ${item.label}`;
    if (userRoles.includes(itemRole)) return true;
    if (item.childrenLabels?.length) {
      return item.childrenLabels.some(
        (child) =>
          userRoles.includes(`Menu: Administration -> Master Data -> ${item.label} -> ${child}`) ||
          userRoles.includes(`Menu: Administration -> Master Data -> ${child}`)
      );
    }
    return false;
  });

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Master Data Module
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, lineHeight: 1.5 }}>
          Access all master data configuration modules below.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              border: item.isSubModule ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              textDecoration: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                {item.label}
              </h3>
              {item.isSubModule && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "#eff6ff",
                    color: "#2563eb",
                    whiteSpace: "nowrap",
                  }}
                >
                  Sub-Module
                </span>
              )}
            </div>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px 0", flex: 1 }}>
              {item.desc}
            </p>
            <div
              style={{
                color: "#3b82f6",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {item.isSubModule ? "Open Sub-Module" : "Open Module"} <span>&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
