import ExcelJS from "exceljs";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { ValidationError } from "../../../../core/domain/errors/DomainError";

export class ExportService {
  async generateExport(
    moduleType: string,
    startDate?: string,
    endDate?: string
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "LII Performance Nexus";
    workbook.created = new Date();

    const titleDateRange = this.formatDateRangeForTitle(startDate, endDate);

    switch (moduleType) {
      case "Users":
        await this.buildUsersExport(workbook, titleDateRange, startDate, endDate);
        break;
      case "Delegation":
        await this.buildDelegationExport(workbook, titleDateRange, startDate, endDate);
        break;
      case "Checklist":
        await this.buildChecklistExport(workbook, titleDateRange, startDate, endDate);
        break;
      case "DPR":
        await this.buildDprExport(workbook, titleDateRange, startDate, endDate);
        break;
      case "FMS":
        await this.buildFmsExport(workbook, titleDateRange, startDate, endDate);
        break;
      default:
        throw new ValidationError("Invalid module type requested for export");
    }

    return workbook;
  }

  private formatDateRangeForTitle(startDate?: string, endDate?: string): string {
    if (startDate && endDate) return `${startDate} to ${endDate}`;
    if (startDate) return `From ${startDate}`;
    if (endDate) return `Up to ${endDate}`;
    return "All Time";
  }

  private styleSheet(sheet: ExcelJS.Worksheet, title: string) {
    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    const headerRow = sheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" }
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 20;

    sheet.eachRow((row, _rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    });

    sheet.mergeCells(1, 1, 1, sheet.columns.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDCE6F1" }
    };
    sheet.getRow(1).height = 30;
  }

  private getDateCondition(column: string, startDate?: string, endDate?: string) {
    let sql = "";
    const params: any[] = [];
    if (startDate && endDate) {
      sql = ` AND ${column} BETWEEN ? AND ?`;
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    } else if (startDate) {
      sql = ` AND ${column} >= ?`;
      params.push(`${startDate} 00:00:00`);
    } else if (endDate) {
      sql = ` AND ${column} <= ?`;
      params.push(`${endDate} 23:59:59`);
    }
    return { sql, params };
  }

  private async buildUsersExport(workbook: ExcelJS.Workbook, titleDateRange: string, startDate?: string, endDate?: string) {
    const sheet = workbook.addWorksheet("Users");
    const dateCond = this.getDateCondition("u.created_at", startDate, endDate);
    
    const [rows]: any = await pool.query(
      `SELECT u.employee_code as login_id, u.status, u.created_at, e.employee_code as emp_code, e.full_name as employee_name, e.email, g.title as designation, d.name as department
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN designations g ON e.designation_id = g.id
       WHERE 1=1 ${dateCond.sql}
       ORDER BY u.created_at DESC`,
       dateCond.params
    );

    sheet.addRow([]); 
    sheet.addRow(["Login ID", "Status", "Created At", "Emp Code", "Name", "Email", "Designation", "Department"]);
    
    for (const row of rows) {
      sheet.addRow([
        row.login_id,
        row.status === "active" ? "Active" : "Inactive",
        row.created_at,
        row.emp_code,
        row.employee_name,
        row.email,
        row.designation,
        row.department
      ]);
    }
    this.styleSheet(sheet, `Users Export (${titleDateRange})`);
  }

  private async buildDelegationExport(workbook: ExcelJS.Workbook, titleDateRange: string, startDate?: string, endDate?: string) {
    const sheet = workbook.addWorksheet("Delegation");
    const dateCond = this.getDateCondition("dt.created_at", startDate, endDate);

    const [rows]: any = await pool.query(
      `SELECT dt.title, dt.description, dt.priority, dt.base_status as status, dt.due_date as deadline, dt.created_at,
              assigner.full_name as assigner_name, assignee.full_name as assignee_name
       FROM delegated_tasks dt
       LEFT JOIN employees assigner ON dt.assigned_by = assigner.id
       LEFT JOIN employees assignee ON dt.assigned_to = assignee.id
       WHERE 1=1 ${dateCond.sql}
       ORDER BY dt.created_at DESC`,
       dateCond.params
    );

    sheet.addRow([]); 
    sheet.addRow(["Title", "Description", "Priority", "Status", "Deadline", "Created At", "Assigned By", "Assigned To"]);
    
    for (const row of rows) {
      sheet.addRow([
        row.title,
        row.description,
        row.priority,
        row.status,
        row.deadline,
        row.created_at,
        row.assigner_name,
        row.assignee_name
      ]);
    }
    this.styleSheet(sheet, `Delegation Export (${titleDateRange})`);
  }

  private async buildChecklistExport(workbook: ExcelJS.Workbook, titleDateRange: string, startDate?: string, endDate?: string) {
    const sheet = workbook.addWorksheet("Checklist");
    const dateCond = this.getDateCondition("ci.created_at", startDate, endDate);

    const [rows]: any = await pool.query(
      `SELECT ci.period_key, ci.created_at,
              ct.title as template_title, ct.frequency,
              assignee.full_name as assignee_name
       FROM checklist_instances ci
       JOIN checklist_templates ct ON ci.template_id = ct.id
       LEFT JOIN employees assignee ON ci.employee_id = assignee.id
       WHERE 1=1 ${dateCond.sql}
       ORDER BY ci.created_at DESC`,
       dateCond.params
    );

    sheet.addRow([]); 
    sheet.addRow(["Template Title", "Frequency", "Period", "Created At", "Assigned To"]);
    
    for (const row of rows) {
      sheet.addRow([
        row.template_title,
        row.frequency,
        row.period_key,
        row.created_at,
        row.assignee_name
      ]);
    }
    this.styleSheet(sheet, `Checklist Export (${titleDateRange})`);
  }

  private async buildDprExport(workbook: ExcelJS.Workbook, titleDateRange: string, startDate?: string, endDate?: string) {
    const sheet = workbook.addWorksheet("DPR");
    const dateCond = this.getDateCondition("fpe.entry_date", startDate, endDate);

    const [rows]: any = await pool.query(
      `SELECT fpe.entry_date, fpe.production_method as production_type, s.name as shift_name, fpe.status, 
              fpe.actual_labour_hours as operator_hours, fpe.actual_qty as total_output_qty,
              dept.name as department_name,
              sub.full_name as submitted_by_name
       FROM factory_production_entries fpe
       LEFT JOIN departments dept ON fpe.factory_department_id = dept.id
       LEFT JOIN shifts s ON fpe.shift_id = s.id
       LEFT JOIN employees sub ON fpe.submitted_by = sub.id
       WHERE 1=1 ${dateCond.sql}
       ORDER BY fpe.entry_date DESC`,
       dateCond.params
    );

    sheet.addRow([]); 
    sheet.addRow(["Entry Date", "Type", "Shift", "Status", "Department", "Line", "Machine Hrs", "Operator Hrs", "Helper Hrs", "Total Qty", "Submitted By"]);
    
    for (const row of rows) {
      sheet.addRow([
        row.entry_date,
        row.production_type,
        row.shift_name,
        row.status,
        row.department_name,
        "", // Line
        "", // Machine Hrs
        row.operator_hours,
        "", // Helper Hrs
        row.total_output_qty,
        row.submitted_by_name
      ]);
    }
    this.styleSheet(sheet, `DPR Export (${titleDateRange})`);
  }

  private async buildFmsExport(workbook: ExcelJS.Workbook, titleDateRange: string, startDate?: string, endDate?: string) {
    const sheet = workbook.addWorksheet("FMS");
    const dateCond = this.getDateCondition("fi.created_at", startDate, endDate);

    const [rows]: any = await pool.query(
      `SELECT fi.id as instance_id, fi.status as instance_status, fi.created_at,
              fm.name as manager_name,
              assignee.full_name as assignee_name
       FROM fms_instances fi
       JOIN fms_managers fm ON fi.fms_manager_id = fm.id
       LEFT JOIN employees assignee ON fi.creator_id = assignee.id
       WHERE 1=1 ${dateCond.sql}
       ORDER BY fi.created_at DESC`,
       dateCond.params
    );

    sheet.addRow([]); 
    sheet.addRow(["Instance ID", "Manager Name", "Status", "Created At", "Assigned To"]);
    
    for (const row of rows) {
      sheet.addRow([
        row.instance_id,
        row.manager_name,
        row.instance_status,
        row.created_at,
        row.assignee_name
      ]);
    }
    this.styleSheet(sheet, `FMS Export (${titleDateRange})`);
  }
}
