import { ReportingService } from "../src/modules/reports/application/services/ReportingService";
const s = new ReportingService();
const today = new Date().toISOString().split("T")[0];
const monthAgo = new Date(Date.now() - 30*86400000).toISOString().split("T")[0];
s.run("dpr_detailed_report", { dateFrom: monthAgo, dateTo: today })
  .then(r => { console.log("OK — rows:", r.rows.length, "cols:", r.columns); process.exit(0); })
  .catch(e => { console.error("ERROR:", e.message, e.sql ?? ""); process.exit(1); });
