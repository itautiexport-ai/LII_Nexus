import { ReportingService } from "../src/modules/reports/application/services/ReportingService";
import { ReportExportService } from "../src/modules/reports/application/services/ReportExportService";
import * as fs from "fs";

const reporting = new ReportingService();
const exporter = new ReportExportService();

async function run() {
  const today = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const filters = { dateFrom: monthAgo, dateTo: today };
  console.log("Filters:", filters);
  const result = await reporting.run("daily_production_report", filters);
  console.log("Columns:", result.columns);
  console.log("Row count:", result.rows.length);
  if (result.rows.length > 0) console.log("First row:", result.rows[0]);
  
  const buf = exporter.toExcelBuffer(result);
  fs.writeFileSync("/tmp/test_export.xlsx", buf);
  console.log("Excel written to /tmp/test_export.xlsx, size:", buf.length, "bytes");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
