"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const ScoringEngineService_1 = require("../../../scoring/application/services/ScoringEngineService");
const RankingService_1 = require("../../../scoring/application/services/RankingService");
const MySqlKpiRepository_1 = require("../../../scoring/infrastructure/repositories/MySqlKpiRepository");
const scoringPeriodUtils_1 = require("../../../scoring/application/services/scoringPeriodUtils");
const MerchantMetricsService_1 = require("../../../crm/application/services/MerchantMetricsService");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const kpiRepo = new MySqlKpiRepository_1.MySqlKpiRepository();
const scoringEngine = new ScoringEngineService_1.ScoringEngineService(kpiRepo);
const rankingService = new RankingService_1.RankingService(scoringEngine, kpiRepo);
const merchantMetricsService = new MerchantMetricsService_1.MerchantMetricsService();
function defaultRange(filters) {
    const to = filters.dateTo ?? new Date().toISOString().slice(0, 10);
    const from = filters.dateFrom ?? new Date(new Date(to).getFullYear(), new Date(to).getMonth(), 1).toISOString().slice(0, 10);
    return { from, to };
}
/**
 * Every report builder returns the same ReportResult shape (summary stats +
 * a generic table + a single chart series), regardless of what it's
 * reporting on - that uniformity is what lets one export pipeline and one
 * frontend renderer handle all 12 report types generically, instead of each
 * report needing its own bespoke rendering and export logic.
 */
class ReportingService {
    async run(reportType, filters) {
        switch (reportType) {
            case "employee_performance": return this.employeePerformance(filters);
            case "department_performance": return this.departmentPerformance(filters);
            case "office_performance": return this.officePerformance(filters);
            case "factory_performance": return this.factoryPerformance(filters);
            case "workflow_reports": return this.workflowReports(filters);
            case "checklist_reports": return this.checklistReports(filters);
            case "delegation_reports": return this.delegationReports(filters);
            case "crm_reports": return this.crmReports(filters);
            case "sales_pipeline": return this.salesPipeline(filters);
            case "merchant_performance": return this.merchantPerformance(filters);
            case "production_reports": return this.productionReports(filters);
            case "executive_reports": return this.executiveReports(filters);
            case "daily_production_report": return this.dailyProductionReport(filters);
            case "dpr_product_report": return this.dprProductReport(filters);
            case "dpr_detailed_report": return this.dprDetailedReport(filters);
            default:
                throw new DomainError_1.ValidationError(`Unknown report type: ${reportType}`);
        }
    }
    async employeePerformance(filters) {
        const periodKey = (0, scoringPeriodUtils_1.periodKeyForNow)("monthly");
        const ranked = await rankingService.topPerformers("monthly", periodKey, 100000);
        const filtered = ranked.filter((r) => !filters.employeeId || r.employeeId === filters.employeeId);
        // Note: departmentId filtering isn't applied here - the ranking service
        // exposes department names, not IDs, for this report. Use the
        // Department Performance report for department-scoped analysis.
        const rows = filtered.map((r) => [r.employeeName, r.departmentName ?? "—", r.overallScore, r.rank]);
        const scored = filtered.filter((r) => r.overallScore !== null);
        const avg = scored.length > 0 ? Math.round((scored.reduce((s, r) => s + r.overallScore, 0) / scored.length) * 100) / 100 : null;
        return {
            reportType: "employee_performance", title: "Employee Performance Report", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Employees Scored", value: scored.length }, { label: "Average Score", value: avg ?? "—" }],
            columns: ["Employee", "Department", "Score", "Rank"], rows,
            chartSeries: filtered.slice(0, 15).map((r) => ({ name: r.employeeName, value: r.overallScore ?? 0 })),
        };
    }
    async departmentPerformance(filters) {
        const periodKey = (0, scoringPeriodUtils_1.periodKeyForNow)("monthly");
        const departments = await rankingService.departmentRanking("monthly", periodKey);
        const rows = departments.map((d) => [d.departmentName, d.averageScore, d.employeeCount, d.rank]);
        return {
            reportType: "department_performance", title: "Department Performance Report", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Departments", value: departments.length }],
            columns: ["Department", "Average Score", "Employees", "Rank"], rows,
            chartSeries: departments.map((d) => ({ name: d.departmentName, value: d.averageScore })),
        };
    }
    async officePerformance(filters) {
        const { from, to } = defaultRange(filters);
        const [rows] = await connection_1.pool.query(`SELECT
         (SELECT COUNT(*) FROM flowchart_tasks WHERE due_date BETWEEN ? AND ?) as flowchartTotal,
         (SELECT COUNT(*) FROM flowchart_tasks WHERE due_date BETWEEN ? AND ? AND base_status = 'completed') as flowchartDone,
         (SELECT COUNT(*) FROM delegated_tasks WHERE deleted_at IS NULL AND due_date BETWEEN ? AND ?) as delegationTotal,
         (SELECT COUNT(*) FROM delegated_tasks WHERE deleted_at IS NULL AND due_date BETWEEN ? AND ? AND base_status = 'completed') as delegationDone,
         (SELECT COUNT(*) FROM checklist_instances WHERE period_start >= ? AND period_end <= ?) as checklistTotal`, [from, to, from, to, from, to, from, to, from, to]);
        const r = rows[0];
        const flowchartRate = r.flowchartTotal > 0 ? Math.round((r.flowchartDone / r.flowchartTotal) * 10000) / 100 : null;
        const delegationRate = r.delegationTotal > 0 ? Math.round((r.delegationDone / r.delegationTotal) * 10000) / 100 : null;
        return {
            reportType: "office_performance", title: "Office Performance Report", generatedAt: new Date().toISOString(), filters,
            summary: [
                { label: "Flowchart Completion", value: flowchartRate !== null ? `${flowchartRate}%` : "—" },
                { label: "Delegation Completion", value: delegationRate !== null ? `${delegationRate}%` : "—" },
                { label: "Checklist Instances", value: r.checklistTotal },
            ],
            columns: ["Category", "Total", "Completed", "Rate %"],
            rows: [
                ["Flowchart", r.flowchartTotal, r.flowchartDone, flowchartRate],
                ["Delegation", r.delegationTotal, r.delegationDone, delegationRate],
            ],
            chartSeries: [{ name: "Flowchart", value: flowchartRate ?? 0 }, { name: "Delegation", value: delegationRate ?? 0 }],
        };
    }
    async factoryPerformance(filters) {
        const { from, to } = defaultRange(filters);
        const conditions = ["deleted_at IS NULL", "entry_date BETWEEN ? AND ?"];
        const values = [from, to];
        if (filters.departmentId) {
            conditions.push("factory_department_id = ?");
            values.push(filters.departmentId);
        }
        const [rows] = await connection_1.pool.query(`SELECT fd.name, SUM(fpe.actual_qty) as actual, SUM(fpe.target_qty) as target, SUM(fpe.rejection_qty + fpe.rework_qty) as defects
       FROM factory_production_entries fpe JOIN departments fd ON fd.id = fpe.factory_department_id
       WHERE ${conditions.join(" AND ")} GROUP BY fd.name`, values);
        const totalActual = rows.reduce((s, r) => s + (Number(r.actual) || 0), 0);
        const totalTarget = rows.reduce((s, r) => s + (Number(r.target) || 0), 0);
        const rowsOut = rows.map((r) => {
            const achievement = Number(r.target) > 0 ? Math.round(Math.min(100, (Number(r.actual) / Number(r.target)) * 100) * 100) / 100 : null;
            return [r.name, Number(r.actual) || 0, Number(r.target) || 0, achievement, Number(r.defects) || 0];
        });
        return {
            reportType: "factory_performance", title: "Factory Performance Report", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Overall Achievement", value: totalTarget > 0 ? `${Math.round(Math.min(100, (totalActual / totalTarget) * 100) * 100) / 100}%` : "—" }],
            columns: ["Department", "Actual", "Target", "Achievement %", "Defects"], rows: rowsOut,
            chartSeries: rowsOut.map((r) => ({ name: r[0], value: r[3] ?? 0 })),
        };
    }
    async workflowReports(filters) {
        const [rows] = await connection_1.pool.query(`SELECT w.name, wr.status, COUNT(*) as count FROM workflow_runs wr JOIN workflows w ON w.id = wr.workflow_id GROUP BY w.name, wr.status`);
        return {
            reportType: "workflow_reports", title: "Workflow Reports", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Total Runs", value: rows.reduce((s, r) => s + Number(r.count), 0) }],
            columns: ["Workflow", "Status", "Count"], rows: rows.map((r) => [r.name, r.status, Number(r.count)]),
            chartSeries: rows.map((r) => ({ name: `${r.name} (${r.status})`, value: Number(r.count) })),
        };
    }
    async checklistReports(filters) {
        const { from, to } = defaultRange(filters);
        const [rows] = await connection_1.pool.query(`SELECT ct.title, COUNT(DISTINCT ci.id) as instances,
         SUM(CASE WHEN cii.is_checked THEN 1 ELSE 0 END) as checkedItems, COUNT(cii.id) as totalItems
       FROM checklist_instances ci JOIN checklist_templates ct ON ct.id = ci.template_id
       LEFT JOIN checklist_instance_items cii ON cii.instance_id = ci.id
       WHERE ci.period_start >= ? AND ci.period_end <= ? GROUP BY ct.title`, [from, to]);
        const rowsOut = rows.map((r) => {
            const rate = Number(r.totalItems) > 0 ? Math.round((Number(r.checkedItems) / Number(r.totalItems)) * 10000) / 100 : null;
            return [r.title, Number(r.instances), rate];
        });
        return {
            reportType: "checklist_reports", title: "Checklist Reports", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Templates", value: rows.length }],
            columns: ["Template", "Instances", "Completion %"], rows: rowsOut,
            chartSeries: rowsOut.map((r) => ({ name: r[0], value: r[2] ?? 0 })),
        };
    }
    async delegationReports(filters) {
        const { from, to } = defaultRange(filters);
        const conditions = ["dt.deleted_at IS NULL", "dt.due_date BETWEEN ? AND ?"];
        const values = [from, to];
        if (filters.employeeId) {
            conditions.push("dt.assigned_to = ?");
            values.push(filters.employeeId);
        }
        const [rows] = await connection_1.pool.query(`SELECT e.full_name, COUNT(*) as total, SUM(CASE WHEN dt.base_status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM delegated_tasks dt JOIN employees e ON e.id = dt.assigned_to
       WHERE ${conditions.join(" AND ")} GROUP BY e.full_name`, values);
        const rowsOut = rows.map((r) => {
            const rate = Number(r.total) > 0 ? Math.round((Number(r.completed) / Number(r.total)) * 10000) / 100 : null;
            return [r.full_name, Number(r.total), Number(r.completed), rate];
        });
        return {
            reportType: "delegation_reports", title: "Delegation Reports", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Employees with Delegated Tasks", value: rows.length }],
            columns: ["Employee", "Total", "Completed", "Rate %"], rows: rowsOut,
            chartSeries: rowsOut.map((r) => ({ name: r[0], value: r[3] ?? 0 })),
        };
    }
    async crmReports(filters) {
        const { from, to } = defaultRange(filters);
        const conditions = ["deleted_at IS NULL", "inquiry_date BETWEEN ? AND ?"];
        const values = [from, to];
        if (filters.customerName) {
            conditions.push("contact_name LIKE ?");
            values.push(`%${filters.customerName}%`);
        }
        if (filters.buyerCompany) {
            conditions.push("company_name LIKE ?");
            values.push(`%${filters.buyerCompany}%`);
        }
        if (filters.status) {
            conditions.push("status = ?");
            values.push(filters.status);
        }
        const [rows] = await connection_1.pool.query(`SELECT status, COUNT(*) as count, SUM(forecast_amount) as forecast FROM crm_leads WHERE ${conditions.join(" AND ")} GROUP BY status`, values);
        return {
            reportType: "crm_reports", title: "CRM Reports", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Total Leads", value: rows.reduce((s, r) => s + Number(r.count), 0) }],
            columns: ["Status", "Count", "Forecast"], rows: rows.map((r) => [r.status, Number(r.count), Number(r.forecast) || 0]),
            chartSeries: rows.map((r) => ({ name: r.status, value: Number(r.count) })),
        };
    }
    async salesPipeline(filters) {
        const conditions = ["deleted_at IS NULL", "status = 'active'"];
        const values = [];
        if (filters.merchantId) {
            conditions.push("assigned_merchant_id = ?");
            values.push(filters.merchantId);
        }
        const [rows] = await connection_1.pool.query(`SELECT sales_stage, COUNT(*) as count, SUM(forecast_amount) as forecast, SUM(weighted_forecast) as weighted
       FROM crm_leads WHERE ${conditions.join(" AND ")} GROUP BY sales_stage`, values);
        return {
            reportType: "sales_pipeline", title: "Sales Pipeline Report", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Total Weighted Forecast", value: rows.reduce((s, r) => s + (Number(r.weighted) || 0), 0) }],
            columns: ["Stage", "Count", "Forecast", "Weighted"], rows: rows.map((r) => [r.sales_stage, Number(r.count), Number(r.forecast) || 0, Number(r.weighted) || 0]),
            chartSeries: rows.map((r) => ({ name: r.sales_stage, value: Number(r.weighted) || 0 })),
        };
    }
    async merchantPerformance(filters) {
        const [merchantRows] = await connection_1.pool.query("SELECT DISTINCT assigned_merchant_id, (SELECT full_name FROM employees WHERE id = assigned_merchant_id) as name FROM crm_leads WHERE assigned_merchant_id IS NOT NULL AND deleted_at IS NULL" +
            (filters.merchantId ? " AND assigned_merchant_id = ?" : ""), filters.merchantId ? [filters.merchantId] : []);
        const rowsOut = [];
        for (const m of merchantRows) {
            const metrics = await merchantMetricsService.getMetrics(m.assigned_merchant_id);
            rowsOut.push([m.name, metrics.leadsAssigned, metrics.wonLeads, metrics.lostLeads, metrics.conversionPercent, metrics.merchantScore]);
        }
        return {
            reportType: "merchant_performance", title: "Merchant Performance Report", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Merchants", value: rowsOut.length }],
            columns: ["Merchant", "Assigned", "Won", "Lost", "Conversion %", "Score"], rows: rowsOut,
            chartSeries: rowsOut.map((r) => ({ name: r[0], value: r[5] ?? 0 })),
        };
    }
    async productionReports(filters) {
        const { from, to } = defaultRange(filters);
        const conditions = ["fpe.deleted_at IS NULL", "fpe.entry_date BETWEEN ? AND ?"];
        const values = [from, to];
        if (filters.departmentId) {
            conditions.push("fpe.factory_department_id = ?");
            values.push(filters.departmentId);
        }
        if (filters.status) {
            conditions.push("fpe.status = ?");
            values.push(filters.status);
        }
        const [rows] = await connection_1.pool.query(`SELECT fpe.entry_date, fd.name as dept, fpe.actual_qty, fpe.target_qty, fpe.status
       FROM factory_production_entries fpe JOIN departments fd ON fd.id = fpe.factory_department_id
       WHERE ${conditions.join(" AND ")} ORDER BY fpe.entry_date DESC LIMIT 500`, values);
        return {
            reportType: "production_reports", title: "Production Reports", generatedAt: new Date().toISOString(), filters,
            summary: [{ label: "Entries", value: rows.length }],
            columns: ["Date", "Department", "Actual", "Target", "Status"],
            rows: rows.map((r) => [r.entry_date, r.dept, Number(r.actual_qty) || 0, Number(r.target_qty) || 0, r.status]),
            chartSeries: [],
        };
    }
    async executiveReports(filters) {
        const periodKey = (0, scoringPeriodUtils_1.periodKeyForNow)("monthly");
        const departments = await rankingService.departmentRanking("monthly", periodKey);
        const top = await rankingService.topPerformers("monthly", periodKey, 5);
        return {
            reportType: "executive_reports", title: "Executive Report", generatedAt: new Date().toISOString(), filters,
            summary: [
                { label: "Departments Scored", value: departments.length },
                { label: "Top Performer", value: top[0]?.employeeName ?? "—" },
            ],
            columns: ["Department", "Average Score", "Employees"], rows: departments.map((d) => [d.departmentName, d.averageScore, d.employeeCount]),
            chartSeries: departments.map((d) => ({ name: d.departmentName, value: d.averageScore })),
        };
    }
    async dailyProductionReport(filters) {
        const { from, to } = defaultRange(filters);
        const conditions = ["de.deleted_at IS NULL", "de.entry_date BETWEEN ? AND ?"];
        const values = [from, to];
        if (filters.departmentId) {
            conditions.push("de.factory_department_id = ?");
            values.push(filters.departmentId);
        }
        const [rows] = await connection_1.pool.query(`SELECT de.entry_date, fd.name as dept, MAX(e.full_name) as supervisor,
        MAX(h.name) as hod_name,
        SUM(COALESCE(de.total_operator, 0) + COALESCE(de.total_helper, 0) + COALESCE(de.total_contractor, 0)) as total_manpower,
        de.uom,
        SUM(de.total_achievement) as total_achievement,
        SUM(de.total_rework) as total_rework,
        MAX(de.id) as id
       FROM dpr_entries de
       JOIN departments fd ON fd.id = de.factory_department_id
       LEFT JOIN employees e ON e.id = de.supervisor_id
       LEFT JOIN master_hods h ON h.id = de.hod_id
       WHERE ${conditions.join(" AND ")}
       GROUP BY de.entry_date, fd.name, de.uom
       ORDER BY de.entry_date DESC, fd.name ASC
       LIMIT 1000`, values);
        const chartData = new Map();
        for (const r of rows) {
            const current = chartData.get(r.dept) || 0;
            chartData.set(r.dept, current + Number(r.total_achievement));
        }
        const chartSeries = Array.from(chartData.entries()).map(([name, value]) => ({ name, value }));
        return {
            reportType: "daily_production_report",
            title: "Daily Production Report",
            generatedAt: new Date().toISOString(),
            filters,
            summary: [{ label: "Entries", value: rows.length }],
            columns: ["Date", "Department Name", "Supervisor Name", "HOD Name", "Total Manpower", "UOM", "Total Achievement", "Total Re-work", "_id"],
            rows: rows.map((r) => [
                r.entry_date,
                r.dept,
                r.supervisor || "—",
                r.hod_name || "—",
                Number(r.total_manpower) || 0,
                r.uom || "—",
                Number(r.total_achievement) || 0,
                Number(r.total_rework) || 0,
                r.id
            ]),
            chartSeries,
        };
    }
    async dprProductReport(filters) {
        const { from, to } = defaultRange(filters);
        const conditions = ["de.deleted_at IS NULL", "de.entry_date BETWEEN ? AND ?"];
        const values = [from, to];
        if (filters.departmentId) {
            conditions.push("de.factory_department_id = ?");
            values.push(filters.departmentId);
        }
        const [rows] = await connection_1.pool.query(`SELECT de.entry_date, fd.name as dept, u.full_name as supervisor,
              di.product_code, di.alias_name, di.wood_type,
              di.order_qty, di.ok_qty, di.rework_qty, di.uom, di.qty_as_per_uom
       FROM dpr_entries de
       JOIN dpr_entry_items di ON di.dpr_entry_id = de.id
       JOIN departments fd ON fd.id = de.factory_department_id
       LEFT JOIN users u ON u.id = de.supervisor_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY de.entry_date DESC, fd.name ASC
       LIMIT 1000`, values);
        const chartData = new Map();
        for (const r of rows) {
            const current = chartData.get(r.dept) || 0;
            chartData.set(r.dept, current + Number(r.ok_qty));
        }
        const chartSeries = Array.from(chartData.entries()).map(([name, value]) => ({ name, value }));
        return {
            reportType: "dpr_product_report",
            title: "Daily Production Report",
            generatedAt: new Date().toISOString(),
            filters,
            summary: [{ label: "Product Entries", value: rows.length }],
            columns: ["Date", "Department", "Supervisor", "Product Code", "Alias Name", "Wood Type", "Order Qty", "OK Qty", "Rework Qty", "UOM", "Qty per UOM"],
            rows: rows.map((r) => [
                r.entry_date, r.dept, r.supervisor || "—",
                r.product_code || "—", r.alias_name || "—", r.wood_type || "—",
                Number(r.order_qty) || 0,
                Number(r.ok_qty) || 0,
                Number(r.rework_qty) || 0,
                r.uom,
                r.qty_as_per_uom !== null ? Number(r.qty_as_per_uom) : "—"
            ]),
            chartSeries,
        };
    }
    async dprDetailedReport(filters) {
        const { from, to } = defaultRange(filters);
        const conditions = ["de.deleted_at IS NULL", "de.entry_date BETWEEN ? AND ?"];
        const values = [from, to];
        if (filters.departmentId) {
            conditions.push("de.factory_department_id = ?");
            values.push(filters.departmentId);
        }
        const [rows] = await connection_1.pool.query(`SELECT
        de.entry_date,
        fd.name as dept,
        MAX(sup.full_name) as supervisor,
        MAX(h.name) as hod_name,
        de.shift_id,
        sh.name as shift_name,
        SUM(COALESCE(de.total_operator,0) + COALESCE(de.total_helper,0) + COALESCE(de.total_contractor,0)) as total_manpower,
        de.uom,
        SUM(de.total_achievement) as total_achievement,
        SUM(de.total_rework) as total_rework,
        di.product_code,
        di.alias_name,
        di.wood_type,
        di.order_qty,
        di.ok_qty,
        di.rework_qty as item_rework_qty,
        di.qty_as_per_uom
       FROM dpr_entries de
       JOIN dpr_entry_items di ON di.dpr_entry_id = de.id
       JOIN departments fd ON fd.id = de.factory_department_id
       LEFT JOIN employees sup ON sup.id = de.supervisor_id
       LEFT JOIN master_hods h ON h.id = de.hod_id
       LEFT JOIN shifts sh ON sh.id = de.shift_id
       WHERE ${conditions.join(" AND ")}
       GROUP BY de.entry_date, fd.name, de.shift_id, sh.name, de.uom,
                di.product_code, di.alias_name, di.wood_type, di.order_qty, di.ok_qty, di.rework_qty, di.qty_as_per_uom
       ORDER BY de.entry_date DESC, fd.name ASC, di.product_code ASC
       LIMIT 2000`, values);
        const chartData = new Map();
        for (const r of rows) {
            const current = chartData.get(r.dept) || 0;
            chartData.set(r.dept, current + Number(r.ok_qty || 0));
        }
        const chartSeries = Array.from(chartData.entries()).map(([name, value]) => ({ name, value }));
        return {
            reportType: "dpr_detailed_report",
            title: "Detailed DPR",
            generatedAt: new Date().toISOString(),
            filters,
            summary: [{ label: "Total Item Lines", value: rows.length }],
            columns: [
                "Date", "Department", "Shift", "Supervisor", "HOD",
                "Total Manpower",
                "Alias Name", "Product Code", "Wood Type",
                "Order Quantity", "OK Quantity", "UOM", "Qty as per UOM", "Re-work"
            ],
            rows: rows.map((r) => [
                r.entry_date,
                r.dept,
                r.shift_name || "\u2014",
                r.supervisor || "\u2014",
                r.hod_name || "\u2014",
                Number(r.total_manpower) || 0,
                r.alias_name || "\u2014",
                r.product_code || "\u2014",
                r.wood_type || "\u2014",
                Number(r.order_qty) || 0,
                Number(r.ok_qty) || 0,
                r.uom || "\u2014",
                r.qty_as_per_uom !== null ? Number(r.qty_as_per_uom) : "\u2014",
                Number(r.item_rework_qty) || 0,
            ]),
            chartSeries,
        };
    }
}
exports.ReportingService = ReportingService;
//# sourceMappingURL=ReportingService.js.map