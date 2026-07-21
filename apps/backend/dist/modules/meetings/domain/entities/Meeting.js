"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVIEW_TYPE_REPORT_MAP = void 0;
/** Review types mapped to an existing Reports & BI report type, where one
 *  meaningfully exists. Purchase and HR have no automated data source
 *  anywhere in this system (no Purchasing or dedicated HR/leave module) -
 *  left unmapped deliberately, not filled in with an approximation. */
exports.REVIEW_TYPE_REPORT_MAP = {
    department: "department_performance",
    performance: "employee_performance",
    factory: "factory_performance",
    crm: "crm_reports",
    sales: "sales_pipeline",
    production: "production_reports",
    office_em: "office_performance",
};
//# sourceMappingURL=Meeting.js.map