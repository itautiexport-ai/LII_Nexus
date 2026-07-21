import { Navigate, Route, Routes } from "react-router-dom";
import AttendanceCalculatorPage from "../../modules/hr/pages/AttendanceCalculatorPage";
import AnnualTrainingPlannerPage from "../../modules/hr/pages/AnnualTrainingPlannerPage";
import LoginPage from "../../modules/auth/pages/LoginPage";
import ProtectedRoute from "../../shared/guards/ProtectedRoute";
import AdminLayout from "../../shared/components/AdminLayout";
import UsersPage from "../../modules/admin/users/pages/UsersPage";
import RolesPage from "../../modules/admin/roles/pages/RolesPage";
import PermissionsPage from "../../modules/admin/permissions/pages/PermissionsPage";
import DepartmentsPage from "../../modules/admin/organization/departments/pages/DepartmentsPage";
import KraPage from "../../modules/hr/pages/KraPage";
import DesignationsPage from "../../modules/admin/organization/designations/pages/DesignationsPage";
import EmployeesPage from "../../modules/admin/organization/employees/pages/EmployeesPage";
import GoalsPage from "../../modules/performance/pages/GoalsPage";
import ReviewsPage from "../../modules/performance/pages/ReviewsPage";
import ProductionLinesPage from "../../modules/admin/factory/productionLines/pages/ProductionLinesPage";
import ShiftsPage from "../../modules/admin/factory/shifts/pages/ShiftsPage";
import ProductionEntryPage from "../../modules/factory/pages/ProductionEntryPage";
import WoodTypesPage from "../../modules/admin/masterdata/pages/WoodTypesPage";
import PrioritiesPage from "../../modules/admin/masterdata/pages/PrioritiesPage";
import MachinesProductsPage from "../../modules/documents/pages/MachinesProductsPage";
import MyProductionPage from "../../modules/factory/pages/MyProductionPage";
import WorkflowListPage from "../../modules/workflow/pages/WorkflowListPage";
import WorkflowEditorPage from "../../modules/workflow/pages/WorkflowEditorPage";
import FlowchartRunsPage from "../../modules/officeperf/flowchart/pages/FlowchartRunsPage";
import FlowchartRunDetailPage from "../../modules/officeperf/flowchart/pages/FlowchartRunDetailPage";
import ChecklistTemplatesPage from "../../modules/officeperf/checklist/pages/ChecklistTemplatesPage";
import MyChecklistPage from "../../modules/officeperf/checklist/pages/MyChecklistPage";
import DelegationPage from "../../modules/officeperf/delegation/pages/DelegationPage";
import AddDelegationPage from "../../modules/officeperf/delegation/pages/AddDelegationPage";
import DashboardPage from "../../modules/officeperf/dashboard/pages/DashboardPage";
import ContractorsPage from "../../modules/admin/factory/contractors/pages/ContractorsPage";
import FactoryEntryFormPage from "../../modules/factory/pages/FactoryEntryFormPage";
import FactoryEntriesPage from "../../modules/factory/pages/FactoryEntriesPage";
import KpiDefinitionsPage from "../../modules/scoring/pages/KpiDefinitionsPage";
import MyScorePage from "../../modules/scoring/pages/MyScorePage";
import RankingsPage from "../../modules/scoring/pages/RankingsPage";
import CommandCenterPage from "../../modules/commandcenter/pages/CommandCenterPage";
import LeadsListPage from "../../modules/crm/pages/LeadsListPage";
import LeadFormPage from "../../modules/crm/pages/LeadFormPage";
import LeadDetailPage from "../../modules/crm/pages/LeadDetailPage";
import CrmDashboardsPage from "../../modules/crm/pages/CrmDashboardsPage";
import { UserDelegationPage } from "../../modules/userdashboard/pages/UserDelegationPage";
import { UserChecklistPage } from "../../modules/userdashboard/pages/UserChecklistPage";
import { UserFmsPage } from "../../modules/userdashboard/pages/UserFmsPage";
import QuotationsListPage from "../../modules/crm/pages/QuotationsListPage";
import QuotationFormPage from "../../modules/crm/pages/QuotationFormPage";
import ComplaintsListPage from "../../modules/crm/pages/ComplaintsListPage";
import ComplaintFormPage from "../../modules/crm/pages/ComplaintFormPage";
import ComplaintDetailPage from "../../modules/crm/pages/ComplaintDetailPage";
import InvestigationListPage from "../../modules/crm/pages/InvestigationListPage";
import InvestigationFormPage from "../../modules/crm/pages/InvestigationFormPage";
import CapaListPage from "../../modules/crm/pages/CapaListPage";
import CapaFormPage from "../../modules/crm/pages/CapaFormPage";
import BuyersPage from "../../modules/admin/masterdata/pages/BuyersPage";
import UomsPage from "../../modules/admin/masterdata/pages/UomsPage";
import HodsPage from "../../modules/admin/masterdata/pages/HodsPage";
import MerchantsPage from "../../modules/admin/masterdata/pages/MerchantsPage";
import ModuleWeightsPage from "../../modules/admin/masterdata/pages/ModuleWeightsPage";
import NotificationCenterPage from "../../modules/notifications/pages/NotificationCenterPage";
import NotificationTemplatesPage from "../../modules/notifications/pages/NotificationTemplatesPage";
import EscalationRulesPage from "../../modules/notifications/pages/EscalationRulesPage";
import ReportsHubPage from "../../modules/reports/pages/ReportsHubPage";
import OfficeEmReportPage from "../../modules/reports/pages/OfficeEmReportPage";
import EmListReportPage from "../../modules/reports/pages/EmListReportPage";
import ScheduledReportsPage from "../../modules/reports/pages/ScheduledReportsPage";
import MisScoreReportPage from "../../modules/reports/pages/MisScoreReportPage";
import CumulativeScoreCardsPage from "../../modules/reports/pages/CumulativeScoreCardsPage";
import AppraisalIndexPage from "../../modules/reports/pages/AppraisalIndexPage";
import DashboardWidgetsPage from "../../modules/reports/pages/DashboardWidgetsPage";
import DailyProductionReportPage from "../../modules/reports/pages/DailyProductionReportPage";
import DetailedProductionReportPage from "../../modules/reports/pages/DetailedProductionReportPage";
import MyBehaviourPage from "../../modules/behaviour/pages/MyBehaviourPage";
import BehaviourAnalyticsPage from "../../modules/behaviour/pages/BehaviourAnalyticsPage";
import BehaviourHealthPage from "../../modules/behaviour/pages/BehaviourHealthPage";
import InsightsPage from "../../modules/behaviour/pages/InsightsPage";
import ManagerFeedbackPage from "../../modules/behaviour/pages/ManagerFeedbackPage";
import BehaviourComponentsPage from "../../modules/behaviour/pages/BehaviourComponentsPage";
import MeetingsListPage from "../../modules/meetings/pages/MeetingsListPage";
import MeetingFormPage from "../../modules/meetings/pages/MeetingFormPage";
import MeetingDetailPage from "../../modules/meetings/pages/MeetingDetailPage";
import MeetingDashboardPage from "../../modules/meetings/pages/MeetingDashboardPage";
import DocumentsListPage from "../../modules/documents/pages/DocumentsListPage";
import DocumentFormPage from "../../modules/documents/pages/DocumentFormPage";
import OrdersInHandListPage from "../../modules/ordermanagement/pages/OrdersInHandListPage";
import OrderInHandFormPage from "../../modules/ordermanagement/pages/OrderInHandFormPage";
import DocumentDetailPage from "../../modules/documents/pages/DocumentDetailPage";

import KpiEngineDefinitionsPage from "../../modules/kpiengine/pages/KpiDefinitionsPage";
import KpiDetailPage from "../../modules/kpiengine/pages/KpiDetailPage";
import KpiEngineDashboardPage from "../../modules/kpiengine/pages/KpiEngineDashboardPage";
import KpiEngineScoresPage from "../../modules/kpiengine/pages/KpiEngineScoresPage";
import DprEntryPage from "../../modules/dpr/pages/DprEntryPage";
import { AddChecklistPage } from "../../modules/checklist/pages/AddChecklistPage";
import { ListChecklistPage } from "../../modules/checklist/pages/ListChecklistPage";
import { AddFmsManagerPage } from "../../modules/fms/pages/AddFmsManagerPage";
import { ListFmsManagerPage } from "../../modules/fms/pages/ListFmsManagerPage";
import { ManageFmsStepsPage } from "../../modules/fms/pages/ManageFmsStepsPage";
import AddHelpTicketPage from "../../modules/admin/helptickets/pages/AddHelpTicketPage";
import HelpTicketsListPage from "../../modules/admin/helptickets/pages/HelpTicketsListPage";
import MachineTargetsPage from "../../modules/admin/masterdata/pages/MachineTargetsPage";
import AddMachineEfficiencyPage from "../../modules/admin/machineefficiency/pages/AddMachineEfficiencyPage";
import ListMachineEfficiencyPage from "../../modules/admin/machineefficiency/pages/ListMachineEfficiencyPage";
import ModuleLandingPage from "../../shared/pages/ModuleLandingPage";

import ProductionProgressPage from "../../modules/manufacturing/pages/ProductionProgressPage";
import ProductionPlanningSheetPage from "../../modules/manufacturing/pages/ProductionPlanningSheetPage";
import NewProductionPlanningSheetPage from "../../modules/manufacturing/pages/NewProductionPlanningSheetPage";
import WhatsAppIntegrationPage from "../../modules/admin/whatsapp/pages/WhatsAppIntegrationPage";

import HodEvaluationPage from "../../modules/performance-evaluation/pages/HodEvaluationPage";
import HrEvaluationPage from "../../modules/performance-evaluation/pages/HrEvaluationPage";
import EmployeeScorePage from "../../modules/performance-evaluation/pages/EmployeeScorePage";
import HomePage from "../../modules/dashboard/pages/HomePage";
import DocumentLibraryPage from "../../modules/resourcescenter/pages/DocumentLibraryPage";
import ImportantUrlsPage from "../../modules/resourcescenter/pages/ImportantUrlsPage";
import SopsPage from "../../modules/resourcescenter/pages/SopsPage";
import PoliciesPage from "../../modules/resourcescenter/pages/PoliciesPage";
import FormsPage from "../../modules/resourcescenter/pages/FormsPage";
import TemplatesPage from "../../modules/resourcescenter/pages/TemplatesPage";
import ManualsPage from "../../modules/resourcescenter/pages/ManualsPage";
import NoticesPage from "../../modules/hr/pages/NoticesPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<HomePage />} />
          <Route path="resource-center/document-library" element={<DocumentLibraryPage />} />
          <Route path="resource-center/important-urls" element={<ImportantUrlsPage />} />
          <Route path="resource-center/sops" element={<SopsPage />} />
          <Route path="resource-center/policies" element={<PoliciesPage />} />
          <Route path="resource-center/forms" element={<FormsPage />} />
          <Route path="resource-center/templates" element={<TemplatesPage />} />
          <Route path="resource-center/manuals" element={<ManualsPage />} />
          <Route path="modules/:moduleKey" element={<ModuleLandingPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="whatsapp" element={<WhatsAppIntegrationPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="designations" element={<DesignationsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="my-goals" element={<GoalsPage />} />
          <Route path="my-reviews" element={<ReviewsPage />} />
          {/* Master Data */}
          <Route path="wood-types" element={<WoodTypesPage />} />
          <Route path="priorities" element={<PrioritiesPage />} />
          <Route path="buyers" element={<BuyersPage />} />
          <Route path="uoms" element={<UomsPage />} />
          <Route path="hods" element={<HodsPage />} />
          <Route path="merchants" element={<MerchantsPage />} />
          <Route path="module-weights" element={<ModuleWeightsPage />} />
          <Route path="machine-targets" element={<MachineTargetsPage />} />
          <Route path="machines-products" element={<MachinesProductsPage />} />
          <Route path="production-lines" element={<ProductionLinesPage />} />
          <Route path="shifts" element={<ShiftsPage />} />
          <Route path="production-entry" element={<ProductionEntryPage />} />
          <Route path="my-production" element={<MyProductionPage />} />
          <Route path="workflows" element={<WorkflowListPage />} />
          <Route path="workflows/:id" element={<WorkflowEditorPage />} />
          <Route path="flowchart" element={<FlowchartRunsPage />} />
          <Route path="flowchart/runs/:id" element={<FlowchartRunDetailPage />} />
          <Route path="checklist-templates" element={<ChecklistTemplatesPage />} />
          <Route path="my-checklists" element={<MyChecklistPage />} />
          <Route path="standalone-checklist/add" element={<AddChecklistPage />} />
          <Route path="standalone-checklist/list" element={<ListChecklistPage />} />
          <Route path="fms/add" element={<AddFmsManagerPage />} />
          <Route path="fms/list" element={<ListFmsManagerPage />} />
          <Route path="fms/:fmsId/steps" element={<ManageFmsStepsPage />} />
          <Route path="delegation/new" element={<AddDelegationPage />} />
          <Route path="delegation" element={<DelegationPage />} />
          <Route path="performance-dashboard" element={<DashboardPage />} />
          <Route path="contractors" element={<ContractorsPage />} />
          <Route path="factory-entries" element={<FactoryEntriesPage />} />
          <Route path="factory-entries/new" element={<FactoryEntryFormPage />} />
          <Route path="dpr-entry" element={<DprEntryPage />} />
          <Route path="machine-efficiency/new" element={<AddMachineEfficiencyPage />} />
          <Route path="machine-efficiency" element={<ListMachineEfficiencyPage />} />
          <Route path="manufacturing/production-progress" element={<ProductionProgressPage />} />
          <Route path="manufacturing/production-planning-sheet" element={<ProductionPlanningSheetPage />} />
          <Route path="manufacturing/production-insight" element={<NewProductionPlanningSheetPage />} />
          <Route path="performance-evaluation/hod" element={<HodEvaluationPage />} />
          <Route path="performance-evaluation/hr" element={<HrEvaluationPage />} />
          <Route path="performance-evaluation/employee-score" element={<EmployeeScorePage />} />
          <Route path="kpi-definitions" element={<KpiDefinitionsPage />} />
          <Route path="my-score" element={<MyScorePage />} />
          <Route path="rankings" element={<RankingsPage />} />
          <Route path="command-center" element={<CommandCenterPage />} />
          <Route path="order-management/list" element={<OrdersInHandListPage />} />
          <Route path="order-management/:id" element={<OrderInHandFormPage />} />
          <Route path="crm/leads" element={<LeadsListPage />} />
          <Route path="crm/leads/new" element={<LeadFormPage />} />
          <Route path="crm/leads/:id" element={<LeadDetailPage />} />
          <Route path="crm/dashboards" element={<CrmDashboardsPage />} />
          <Route path="user-dashboard/delegation" element={<UserDelegationPage />} />
          <Route path="user-dashboard/checklist" element={<UserChecklistPage />} />
          <Route path="user-dashboard/fms" element={<UserFmsPage />} />
          <Route path="crm/quotations" element={<QuotationsListPage />} />
          <Route path="crm/quotations/new" element={<QuotationFormPage />} />
          <Route path="crm/complaints" element={<ComplaintsListPage />} />
          <Route path="crm/complaints/new" element={<ComplaintFormPage />} />
          <Route path="crm/complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="crm/investigation" element={<InvestigationListPage />} />
          <Route path="crm/investigation/new" element={<InvestigationFormPage />} />
          <Route path="crm/capa" element={<CapaListPage />} />
          <Route path="crm/capa/new" element={<CapaFormPage />} />
          <Route path="buyers" element={<BuyersPage />} />
          <Route path="notifications" element={<NotificationCenterPage />} />
          <Route path="notification-templates" element={<NotificationTemplatesPage />} />
          <Route path="escalation-rules" element={<EscalationRulesPage />} />
          <Route path="reports" element={<ReportsHubPage />} />
          <Route path="reports/dashboard" element={<DashboardWidgetsPage />} />
          <Route path="reports/daily-production" element={<DailyProductionReportPage />} />
          <Route path="reports/detailed-production" element={<DetailedProductionReportPage />} />
          <Route path="reports/office-em" element={<OfficeEmReportPage />} />
          <Route path="reports/office-em-list" element={<EmListReportPage />} />

          <Route path="hr/attendance-calculator" element={<AttendanceCalculatorPage />} />
          <Route path="hr/notices" element={<NoticesPage />} />
          <Route path="hr/annual-training-planner" element={<AnnualTrainingPlannerPage />} />
          <Route path="hr/kra" element={<KraPage />} />
          <Route path="reports/appraisal-index" element={<AppraisalIndexPage />} />
          <Route path="scheduled-reports" element={<ScheduledReportsPage />} />
          <Route path="my-dashboard" element={<DashboardWidgetsPage />} />
          <Route path="my-behaviour" element={<MyBehaviourPage />} />
          <Route path="behaviour-analytics" element={<BehaviourAnalyticsPage />} />
          <Route path="behaviour-health" element={<BehaviourHealthPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="manager-feedback" element={<ManagerFeedbackPage />} />
          <Route path="behaviour-components" element={<BehaviourComponentsPage />} />
          <Route path="meetings" element={<MeetingsListPage />} />
          <Route path="meetings/new" element={<MeetingFormPage />} />
          <Route path="meetings/:id" element={<MeetingDetailPage />} />
          <Route path="meetings-dashboard" element={<MeetingDashboardPage />} />
          <Route path="documents" element={<DocumentsListPage />} />
          <Route path="documents/new" element={<DocumentFormPage />} />
          <Route path="documents/:id" element={<DocumentDetailPage />} />

          <Route path="kpi-engine" element={<KpiEngineDefinitionsPage />} />
          <Route path="kpi-engine/:id" element={<KpiDetailPage />} />
          <Route path="kpi-engine-dashboard" element={<KpiEngineDashboardPage />} />
          <Route path="kpi-engine-scores" element={<KpiEngineScoresPage />} />
          <Route path="standalone-checklist/add" element={<AddChecklistPage />} />
          <Route path="standalone-checklist/list" element={<ListChecklistPage />} />
          <Route path="help-tickets/new" element={<AddHelpTicketPage />} />
          <Route path="help-tickets/all" element={<HelpTicketsListPage mode="all" />} />
          <Route path="help-tickets/assigned-to-me" element={<HelpTicketsListPage mode="assigned-to-me" />} />
          <Route path="help-tickets/assigned-by-me" element={<HelpTicketsListPage mode="assigned-by-me" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
