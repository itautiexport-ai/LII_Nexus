"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../../modules/auth/presentation/routes/auth.routes"));
const user_routes_1 = __importDefault(require("../../modules/identity/presentation/routes/user.routes"));
const rbac_routes_1 = __importDefault(require("../../modules/rbac/presentation/routes/rbac.routes"));
const organization_routes_1 = __importDefault(require("../../modules/organization/presentation/routes/organization.routes"));
const performance_routes_1 = __importDefault(require("../../modules/performance/presentation/routes/performance.routes"));
const factory_routes_1 = __importDefault(require("../../modules/factory/presentation/routes/factory.routes"));
const workflow_routes_1 = __importDefault(require("../../modules/workflow/presentation/routes/workflow.routes"));
const flowchart_routes_1 = __importDefault(require("../../modules/officeperf/presentation/routes/flowchart.routes"));
const checklist_routes_1 = __importDefault(require("../../modules/officeperf/presentation/routes/checklist.routes"));
const delegation_routes_1 = __importDefault(require("../../modules/officeperf/presentation/routes/delegation.routes"));
const dashboard_routes_1 = __importDefault(require("../../modules/officeperf/presentation/routes/dashboard.routes"));
const factoryPerformanceManagement_routes_1 = __importDefault(require("../../modules/factory/presentation/routes/factoryPerformanceManagement.routes"));
const scoring_routes_1 = __importDefault(require("../../modules/scoring/presentation/routes/scoring.routes"));
const commandcenter_routes_1 = __importDefault(require("../../modules/commandcenter/presentation/routes/commandcenter.routes"));
const crm_routes_1 = __importDefault(require("../../modules/crm/presentation/routes/crm.routes"));
const notification_routes_1 = __importDefault(require("../../modules/notifications/presentation/routes/notification.routes"));
const report_routes_1 = __importDefault(require("../../modules/reports/presentation/routes/report.routes"));
const behaviour_routes_1 = __importDefault(require("../../modules/behaviour/presentation/routes/behaviour.routes"));
const meeting_routes_1 = __importDefault(require("../../modules/meetings/presentation/routes/meeting.routes"));
const document_routes_1 = __importDefault(require("../../modules/documents/presentation/routes/document.routes"));
const kpiengine_routes_1 = __importDefault(require("../../modules/kpiengine/presentation/routes/kpiengine.routes"));
const dpr_routes_1 = __importDefault(require("../../modules/dpr/presentation/routes/dpr.routes"));
const masterDataRoutes_1 = require("../../modules/masterdata/presentation/routes/masterDataRoutes");
const checklist_routes_2 = __importDefault(require("../../modules/checklist/presentation/routes/checklist.routes"));
const fms_routes_1 = __importDefault(require("../../modules/fms/presentation/routes/fms.routes"));
const helpTicket_routes_1 = __importDefault(require("../../modules/helptickets/presentation/routes/helpTicket.routes"));
const machineEfficiency_routes_1 = __importDefault(require("../../modules/machineefficiency/presentation/routes/machineEfficiency.routes"));
const manufacturing_routes_1 = __importDefault(require("../../modules/manufacturing/presentation/routes/manufacturing.routes"));
const whatsapp_routes_1 = __importDefault(require("../../modules/whatsapp/presentation/whatsapp.routes"));
const url_routes_1 = __importDefault(require("../../modules/urls/presentation/routes/url.routes"));
const upload_routes_1 = __importDefault(require("../../modules/upload/presentation/routes/upload.routes"));
const trainingRoutes_1 = require("../../modules/training/presentation/routes/trainingRoutes");
const noticeRoutes_1 = require("../../modules/notices/presentation/routes/noticeRoutes");
const kra_router_1 = require("../../modules/hr/api/kra.router");
const attendance_router_1 = require("../../modules/hr/api/attendance.router");
const payroll_router_1 = require("../../modules/hr/api/payroll.router");
const orderInHandRoutes_1 = require("../../modules/ordermanagement/presentation/routes/orderInHandRoutes");
const cartonOrder_routes_1 = __importDefault(require("../../modules/ordermanagement/presentation/routes/cartonOrder.routes"));
const taskcenter_routes_1 = __importDefault(require("../../modules/taskcenter/presentation/routes/taskcenter.routes"));
const router = (0, express_1.Router)();
router.use("/training", trainingRoutes_1.trainingRoutes);
router.use("/notices", noticeRoutes_1.noticeRoutes);
router.use("/hr/kras", kra_router_1.kraRouter);
router.use("/hr/payroll", payroll_router_1.payrollRouter);
router.use("/hr", attendance_router_1.attendanceRouter);
router.use("/auth", auth_routes_1.default);
router.use("/users", user_routes_1.default);
router.use("/", masterDataRoutes_1.masterDataRoutes); // exposes /wood-types, /priorities
router.use("/", rbac_routes_1.default); // exposes /roles, /permissions, /users/:userId/roles, /me/permissions
router.use("/", organization_routes_1.default); // exposes /departments, /designations, /employees
router.use("/", performance_routes_1.default); // exposes /goals, /reviews, /employees/:id/goals|reviews
router.use("/", factory_routes_1.default); // exposes /production-lines, /shifts, /production-entries
router.use("/", workflow_routes_1.default); // exposes /workflows, /workflows/:id/stages
router.use("/", flowchart_routes_1.default); // exposes /flowchart/runs, /flowchart/tasks
router.use("/", checklist_routes_1.default); // exposes /checklists/templates, /checklists/my-checklists
router.use("/", delegation_routes_1.default); // exposes /delegation/tasks
router.use("/", dashboard_routes_1.default); // exposes /dashboard/employee|manager|department|company
router.use("/", factoryPerformanceManagement_routes_1.default); // exposes /factory-departments, /contractors, /factory-entries
router.use("/", scoring_routes_1.default); // exposes /kpi-definitions, /scores/*
router.use("/", commandcenter_routes_1.default); // exposes /command-center/overview
router.use("/", crm_routes_1.default); // exposes /crm/leads, /crm/dashboards/*, /crm/merchant-metrics/*
router.use("/", notification_routes_1.default); // exposes /notifications, /notification-templates, /escalation-rules
router.use("/", report_routes_1.default); // exposes /reports/run, /reports/export/*, /reports/saved, /reports/favourites, /reports/scheduled, /reports/widgets
router.use("/", behaviour_routes_1.default); // exposes /behaviour/index/*, /behaviour/health/*, /behaviour/analytics/*, /insight-rules
router.use("/", meeting_routes_1.default); // exposes /meetings, /meetings/:id/mom, /meetings/actions/*
router.use("/", document_routes_1.default); // exposes /documents, /documents/:id/versions, /machines, /products
router.use("/", kpiengine_routes_1.default); // exposes /kpi-engine/definitions, /kpi-engine/scores/*, /kpi-engine/dashboard
router.use("/", dpr_routes_1.default); // exposes /dpr-entries
router.use("/", checklist_routes_2.default); // exposes /standalone-checklists
router.use("/", fms_routes_1.default); // exposes /fms
router.use("/", helpTicket_routes_1.default); // exposes /help-tickets
router.use("/", machineEfficiency_routes_1.default); // exposes /machine-targets, /machine-efficiency
router.use("/", manufacturing_routes_1.default); // exposes /manufacturing/production-planning
router.use("/", whatsapp_routes_1.default); // exposes /whatsapp/status, /whatsapp/logout
const router_1 = require("../../modules/performance-evaluation/interfaces/http/router");
router.use("/performance-evaluation", router_1.performanceEvaluationRouter);
router.use("/", url_routes_1.default);
router.use("/", upload_routes_1.default);
router.use("/orders-in-hand", orderInHandRoutes_1.orderInHandRoutes);
router.use("/", cartonOrder_routes_1.default);
router.use("/task-center", taskcenter_routes_1.default);
exports.default = router;
//# sourceMappingURL=router.js.map