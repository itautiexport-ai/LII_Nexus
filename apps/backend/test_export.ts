import { ReportExportService } from "./src/modules/reports/application/services/ReportExportService";
async function run() {
  const service = new ReportExportService();
  const res = await service.toExcelBuffer({
    reportType: "daily_production_report",
    title: "DAILY PRODUCTION REPORT",
    generatedAt: new Date().toISOString(),
    filters: {},
    summary: [{ label: "Entries", value: 0 }],
    columns: ["A", "B", "C"],
    rows: [["1", "2", "3"]],
    chartSeries: []
  } as any);
  console.log("Success! Buffer size:", res.length);
}
run().catch(console.error);
