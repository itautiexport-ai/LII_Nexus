import { Router } from "express";
import authRoutes from "../../modules/auth/presentation/routes/auth.routes";
import userRoutes from "../../modules/identity/presentation/routes/user.routes";
import rbacRoutes from "../../modules/rbac/presentation/routes/rbac.routes";
import organizationRoutes from "../../modules/organization/presentation/routes/organization.routes";
import performanceRoutes from "../../modules/performance/presentation/routes/performance.routes";
import factoryRoutes from "../../modules/factory/presentation/routes/factory.routes";
import workflowRoutes from "../../modules/workflow/presentation/routes/workflow.routes";
import flowchartRoutes from "../../modules/officeperf/presentation/routes/flowchart.routes";
import checklistRoutes from "../../modules/officeperf/presentation/routes/checklist.routes";
import delegationRoutes from "../../modules/officeperf/presentation/routes/delegation.routes";
import dashboardRoutes from "../../modules/officeperf/presentation/routes/dashboard.routes";
import factoryPerformanceManagementRoutes from "../../modules/factory/presentation/routes/factoryPerformanceManagement.routes";
import scoringRoutes from "../../modules/scoring/presentation/routes/scoring.routes";
import commandCenterRoutes from "../../modules/commandcenter/presentation/routes/commandcenter.routes";
import crmRoutes from "../../modules/crm/presentation/routes/crm.routes";
import notificationRoutes from "../../modules/notifications/presentation/routes/notification.routes";
import reportRoutes from "../../modules/reports/presentation/routes/report.routes";
import behaviourRoutes from "../../modules/behaviour/presentation/routes/behaviour.routes";
import meetingRoutes from "../../modules/meetings/presentation/routes/meeting.routes";
import documentRoutes from "../../modules/documents/presentation/routes/document.routes";
import kpiEngineRoutes from "../../modules/kpiengine/presentation/routes/kpiengine.routes";
import dprRoutes from "../../modules/dpr/presentation/routes/dpr.routes";
import { masterDataRoutes } from "../../modules/masterdata/presentation/routes/masterDataRoutes";
import standaloneChecklistRoutes from "../../modules/checklist/presentation/routes/checklist.routes";
import { FmsManagerController } from "../../modules/fms/presentation/controllers/FmsManagerController";

import fmsRoutes from "../../modules/fms/presentation/routes/fms.routes";
import helpTicketRoutes from "../../modules/helptickets/presentation/routes/helpTicket.routes";
import machineEfficiencyRoutes from "../../modules/machineefficiency/presentation/routes/machineEfficiency.routes";

import manufacturingRoutes from "../../modules/manufacturing/presentation/routes/manufacturing.routes";
import whatsappRoutes from "../../modules/whatsapp/presentation/whatsapp.routes";
import urlRoutes from "../../modules/urls/presentation/routes/url.routes";
import uploadRoutes from "../../modules/upload/presentation/routes/upload.routes";
import formatsRoutes from "../../modules/formats/presentation/routes/formats.routes";
import maintenanceRoutes from "../../modules/maintenance/presentation/routes/maintenance.routes";

import { trainingRoutes } from "../../modules/training/presentation/routes/trainingRoutes";
import { noticeRoutes } from "../../modules/notices/presentation/routes/noticeRoutes";
import { kraRouter } from "../../modules/hr/api/kra.router";
import { attendanceRouter } from "../../modules/hr/api/attendance.router";
import { payrollRouter } from "../../modules/hr/api/payroll.router";
import { orderInHandRoutes } from "../../modules/ordermanagement/presentation/routes/orderInHandRoutes";
import cartonOrderRoutes from "../../modules/ordermanagement/presentation/routes/cartonOrder.routes";
import taskCenterRoutes from "../../modules/taskcenter/presentation/routes/taskcenter.routes";
const router = Router();

router.use("/training", trainingRoutes);
router.use("/notices", noticeRoutes);
router.use("/hr/kras", kraRouter);
router.use("/hr/payroll", payrollRouter);
router.use("/hr", attendanceRouter);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/", masterDataRoutes); // exposes /wood-types, /priorities
router.use("/", rbacRoutes); // exposes /roles, /permissions, /users/:userId/roles, /me/permissions
router.use("/", organizationRoutes); // exposes /departments, /designations, /employees
router.use("/", performanceRoutes); // exposes /goals, /reviews, /employees/:id/goals|reviews
router.use("/", factoryRoutes); // exposes /production-lines, /shifts, /production-entries
router.use("/", workflowRoutes); // exposes /workflows, /workflows/:id/stages
router.use("/", flowchartRoutes); // exposes /flowchart/runs, /flowchart/tasks
router.use("/", checklistRoutes); // exposes /checklists/templates, /checklists/my-checklists
router.use("/", delegationRoutes); // exposes /delegation/tasks
router.use("/", dashboardRoutes); // exposes /dashboard/employee|manager|department|company
router.use("/", factoryPerformanceManagementRoutes); // exposes /factory-departments, /contractors, /factory-entries
router.use("/", scoringRoutes); // exposes /kpi-definitions, /scores/*
router.use("/", commandCenterRoutes); // exposes /command-center/overview
router.use("/", crmRoutes); // exposes /crm/leads, /crm/dashboards/*, /crm/merchant-metrics/*
router.use("/", notificationRoutes); // exposes /notifications, /notification-templates, /escalation-rules
router.use("/", reportRoutes); // exposes /reports/run, /reports/export/*, /reports/saved, /reports/favourites, /reports/scheduled, /reports/widgets
router.use("/", behaviourRoutes); // exposes /behaviour/index/*, /behaviour/health/*, /behaviour/analytics/*, /insight-rules
router.use("/", meetingRoutes); // exposes /meetings, /meetings/:id/mom, /meetings/actions/*
router.use("/", documentRoutes); // exposes /documents, /documents/:id/versions, /machines, /products
router.use("/", kpiEngineRoutes); // exposes /kpi-engine/definitions, /kpi-engine/scores/*, /kpi-engine/dashboard
router.use("/", dprRoutes); // exposes /dpr-entries
router.use("/", standaloneChecklistRoutes); // exposes /standalone-checklists
router.use("/", fmsRoutes); // exposes /fms
router.use("/", helpTicketRoutes); // exposes /help-tickets
router.use("/", machineEfficiencyRoutes); // exposes /machine-targets, /machine-efficiency
router.use("/", manufacturingRoutes); // exposes /manufacturing/production-planning
router.use("/", whatsappRoutes); // exposes /whatsapp/status, /whatsapp/logout
import { performanceEvaluationRouter } from "../../modules/performance-evaluation/interfaces/http/router";
router.use("/performance-evaluation", performanceEvaluationRouter);
router.use("/", urlRoutes);
router.use("/", uploadRoutes);
router.use("/orders-in-hand", orderInHandRoutes);
router.use("/", cartonOrderRoutes);
router.use("/task-center", taskCenterRoutes);
router.use("/formats", formatsRoutes);
router.use("/maintenance", maintenanceRoutes);

export default router;
