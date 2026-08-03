import { useEffect, useState } from "react";
import { myProductionApi } from "../api/myProductionApi";
import { ProductionEntryRecord } from "../api/factoryApi";
import { useMyEmployee } from "../../performance/hooks/useMyEmployee";

export default function MyProductionPage() {
  const { employee, loading: loadingEmployee } = useMyEmployee();
  const [entries, setEntries] = useState<ProductionEntryRecord[]>([]);

  useEffect(() => {
    if (employee) myProductionApi.list(employee.id).then(setEntries);
  }, [employee]);

  if (loadingEmployee) return <p>Loading...</p>;
  if (!employee) {
    return (
      <div>
        <h1 style={{ fontSize: 20 }}>My Production</h1>
        <p style={{ color: "#777" }}>Your login isn't linked to an Employee Master record yet. Ask an admin to link it first.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>My Production</h1>
      {entries.length === 0 ? (
        <p style={{ color: "#777" }}>No production entries recorded for you yet — these are logged by your manager.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}>Line</th>
              <th style={{ padding: 8 }}>Shift</th>
              <th style={{ padding: 8 }}>Produced</th>
              <th style={{ padding: 8 }}>Target</th>
              <th style={{ padding: 8 }}>Achievement</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{e.entryDate}</td>
                <td style={{ padding: 8 }}>{e.lineName}</td>
                <td style={{ padding: 8 }}>{e.shiftName}</td>
                <td style={{ padding: 8 }}>{e.quantityProduced}</td>
                <td style={{ padding: 8 }}>{e.targetQuantity ?? "—"}</td>
                <td style={{ padding: 8 }}>{e.achievementPercentage ?? "—"}{e.achievementPercentage !== null ? "%" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
