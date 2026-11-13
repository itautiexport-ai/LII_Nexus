import { Link } from "react-router-dom";
import { useAuthStore } from "../../../auth/hooks/useAuthStore";

interface SubHubItem {
  label: string;
  to: string;
  desc: string;
}

interface SubHubProps {
  title: string;
  subtitle: string;
  subModuleLabel: string;
  allItems: SubHubItem[];
}

function MasterDataSubHub({ title, subtitle, subModuleLabel, allItems }: SubHubProps) {
  const user = useAuthStore((state: any) => state.user);
  const userRoles: string[] = user?.roles || [];
  const isSystemAdmin = userRoles.includes("System Admin");

  const parentGroupRole = `Menu: Administration -> Master Data -> ${subModuleLabel}`;
  const hasGroupAccess = isSystemAdmin || userRoles.includes(parentGroupRole);

  const items = allItems.filter((item) => {
    if (hasGroupAccess) return true;
    const nestedRole = `Menu: Administration -> Master Data -> ${subModuleLabel} -> ${item.label}`;
    const legacyRole = `Menu: Administration -> Master Data -> ${item.label}`;
    return userRoles.includes(nestedRole) || userRoles.includes(legacyRole);
  });

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 12 }}>
          <Link
            to="/admin/master-data"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            &larr; Back to Master Data
          </Link>
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, maxWidth: 640, lineHeight: 1.5, margin: 0 }}>
          {subtitle}
        </p>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: 40,
            borderRadius: 16,
            textAlign: "center",
            border: "1px dashed #cbd5e1",
          }}
        >
          <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>
            No sub-modules configured under {title} yet.
          </p>
        </div>
      ) : (
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
                border: "1px solid #e2e8f0",
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
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 8px 0" }}>
                {item.label}
              </h3>
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
                Open Module <span>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdministrativeMasterHubPage() {
  return (
    <MasterDataSubHub
      title="Administrative Master"
      subtitle="Access all administrative master data configuration modules below."
      subModuleLabel="Administrative Master"
      allItems={[]}
    />
  );
}

export function HumanResourceMasterHubPage() {
  return (
    <MasterDataSubHub
      title="Human Resource Master"
      subtitle="Access all human resource master data configuration modules below."
      subModuleLabel="Human Resource Master"
      allItems={[]}
    />
  );
}

export function CostingMasterHubPage() {
  return (
    <MasterDataSubHub
      title="Costing Master"
      subtitle="Access costing master data configurations for Metal Prices, Wood Thickness Prices, Hardware And Accessories, Wood Part Name, Additional Cost, and MDF Prices."
      subModuleLabel="Costing Master"
      allItems={[
        {
          label: "Metal Prices",
          to: "/admin/metal-prices",
          desc: "Manage standard metal pricing rates by type, profile, and gauge",
        },
        {
          label: "Wood Thickness Prices",
          to: "/admin/wood-thickness-prices",
          desc: "Manage wood thickness pricing rates per CFT",
        },
        {
          label: "Hardware And Accessories",
          to: "/admin/hardware-accessories",
          desc: "Manage hardware and accessory items, specifications, UOMs, and rates",
        },
        {
          label: "Wood Part Name",
          to: "/admin/wood-part-names",
          desc: "Manage standard wood part names for wood costing sheets",
        },
        {
          label: "Additional Cost",
          to: "/admin/additional-costs",
          desc: "Manage additional cost items, codes, standard prices, and UOMs",
        },
        {
          label: "MDF Prices",
          to: "/admin/mdf-prices",
          desc: "Manage MDF pricing by MDF type, sheet size, thickness (mm), and UOM",
        },
        {
          label: "Currency Conversion Rates",
          to: "/admin/currency-rates",
          desc: "Manage USD ($) conversion rate and global currency exchange rates against INR (₹)",
        },
      ]}
    />
  );
}
