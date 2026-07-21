import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { pool } from "./connection";
import { env } from "../../../config/env";

/**
 * Idempotent demo/pilot data seeding - safe to run repeatedly (every insert
 * checks existence first, matching the pattern already used for the
 * bootstrap admin in seed.ts). This exists so a brand-new company install
 * isn't an empty shell: it gives a pilot team seven working test logins
 * across every role, and one sample record in each major module so every
 * dashboard has something real to show on day one.
 *
 * Note: manager hierarchy is NOT set during this demo-seeding pass because
 * employees.manager_id now references master_hods.id (not employees.id), and
 * demo data does not create master_hods entries. All managerEmployeeId values
 * are left null intentionally to avoid FK constraint failures.
 */

const DEMO_PASSWORD = "Test@1234";

async function ensureDepartment(name: string): Promise<string> {
  const [rows] = await pool.query<any[]>("SELECT id FROM departments WHERE name = ?", [name]);
  if (rows[0]) return rows[0].id;
  const id = uuid();
  await pool.query("INSERT INTO departments (id, name) VALUES (?, ?)", [id, name]);
  return id;
}

async function ensureDesignation(title: string): Promise<string> {
  const [rows] = await pool.query<any[]>("SELECT id FROM designations WHERE title = ?", [title]);
  if (rows[0]) return rows[0].id;
  const id = uuid();
  await pool.query("INSERT INTO designations (id, title) VALUES (?, ?)", [id, title]);
  return id;
}

async function ensureRoleId(name: string): Promise<string | null> {
  const [rows] = await pool.query<any[]>("SELECT id FROM roles WHERE name = ?", [name]);
  return rows[0]?.id ?? null;
}

/** Creates a user + employee + role assignment if the email doesn't
 *  already exist; returns the employee id either way. */
async function ensureDemoUser(opts: {
  email: string; fullName: string; employeeCode: string; roleName: string;
  departmentId: string; designationId: string; managerEmployeeId: string | null;
}): Promise<string> {
  const [existingUser] = await pool.query<any[]>("SELECT id FROM users WHERE email = ?", [opts.email]);
  if (existingUser[0]) {
    const [existingEmployee] = await pool.query<any[]>("SELECT id FROM employees WHERE user_id = ?", [existingUser[0].id]);
    if (existingEmployee[0]) return existingEmployee[0].id;
  }

  const userId = existingUser[0]?.id ?? uuid();
  if (!existingUser[0]) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, env.bcryptSaltRounds);
    await pool.query(
      "INSERT INTO users (id, employee_code, email, password_hash, full_name, status) VALUES (?, ?, ?, ?, ?, 'active')",
      [userId, opts.employeeCode, opts.email, passwordHash, opts.fullName]
    );
  }

  const employeeId = uuid();
  await pool.query(
    `INSERT INTO employees (id, employee_code, full_name, email, department_id, designation_id, manager_id, user_id, date_of_joining)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [employeeId, opts.employeeCode, opts.fullName, opts.email, opts.departmentId, opts.designationId, opts.managerEmployeeId, userId]
  );

  const roleId = await ensureRoleId(opts.roleName);
  if (roleId) {
    await pool.query("INSERT IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id) VALUES (?, ?, 'global', '')", [userId, roleId]);
  }

  return employeeId;
}

async function seedDemoUsers() {
  const operationsDeptId = await ensureDepartment("Operations");
  const salesDeptId = await ensureDepartment("Sales");
  const hrDeptId = await ensureDepartment("HR");
  await ensureDepartment("Quality");

  const ceoDesignationId = await ensureDesignation("Chief Executive Officer");
  const hodDesignationId = await ensureDesignation("Head of Department");
  const merchantDesignationId = await ensureDesignation("Merchant Executive");
  const supervisorDesignationId = await ensureDesignation("Supervisor");
  const employeeDesignationId = await ensureDesignation("Employee");
  const hrDesignationId = await ensureDesignation("HR Manager");

  const ceoId = await ensureDemoUser({
    email: "ceo@liinexus.com", fullName: "CEO Test", employeeCode: "EMP-CEO01", roleName: "CEO",
    departmentId: operationsDeptId, designationId: ceoDesignationId, managerEmployeeId: null,
  });

  const hodId = await ensureDemoUser({
    email: "hod@liinexus.com", fullName: "HOD Test", employeeCode: "EMP-HOD01", roleName: "HOD",
    departmentId: operationsDeptId, designationId: hodDesignationId, managerEmployeeId: null,
  });

  await ensureDemoUser({
    email: "merchant@liinexus.com", fullName: "Merchant Test", employeeCode: "EMP-MER01", roleName: "Merchant",
    departmentId: salesDeptId, designationId: merchantDesignationId, managerEmployeeId: null,
  });

  // HR Admin may already exist under a different email from earlier
  // manual testing (hr.admin@liinexus.com); ensureDemoUser() only creates
  // one under hr@liinexus.com if that specific email is free, and is a
  // safe no-op otherwise (an existing hr.admin@liinexus.com login remains
  // valid regardless - both are documented as the HR test account).
  await ensureDemoUser({
    email: "hr@liinexus.com", fullName: "HR Test", employeeCode: "EMP-HR01", roleName: "HR Admin",
    departmentId: hrDeptId, designationId: hrDesignationId, managerEmployeeId: ceoId,
  });

  // Supervisor Test and Worker Test may already exist from earlier manual
  // testing on a long-lived dev database - ensureDemoUser() is idempotent
  // by email either way, so this creates them fresh on a brand-new install
  // and safely no-ops if they're already there.
  const supervisorId = await ensureDemoUser({
    email: "supervisor@liinexus.com", fullName: "Supervisor Test", employeeCode: "EMP-SUP01", roleName: "Supervisor",
    departmentId: operationsDeptId, designationId: supervisorDesignationId, managerEmployeeId: null,
  });

  await ensureDemoUser({
    email: "worker@liinexus.com", fullName: "Worker Test", employeeCode: "EMP-WRK01", roleName: "Employee",
    departmentId: operationsDeptId, designationId: employeeDesignationId, managerEmployeeId: null,
  });

  // On a long-lived dev database, Supervisor Test may already exist without
  // the Supervisor role (added retroactively here) - ensureDemoUser() only
  // sets roles at creation time, so patch it in for accounts that pre-date
  // this seeder. Note: manager_id is intentionally NOT patched here because
  // it now references master_hods.id (not employees.id).
  const [supervisorRows] = await pool.query<any[]>(
    "SELECT e.id, e.user_id FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = ?", ["supervisor@liinexus.com"]
  );
  if (supervisorRows[0]) {
    const supervisorRoleId = await ensureRoleId("Supervisor");
    if (supervisorRoleId) {
      await pool.query("INSERT IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id) VALUES (?, ?, 'global', '')", [supervisorRows[0].user_id, supervisorRoleId]);
    }
  }

  console.log("Demo users ready: ceo@liinexus.com, hod@liinexus.com, merchant@liinexus.com, supervisor@liinexus.com, worker@liinexus.com, hr@liinexus.com (password: Test@1234, unless an account already existed with a different one)");
  console.log("If hr.admin@liinexus.com already existed from earlier testing, that account remains valid as the HR test login too.");
}

async function seedDemoChecklistTemplate() {
  const [rows] = await pool.query<any[]>("SELECT id FROM checklist_templates WHERE title = ?", ["Daily Housekeeping Checklist"]);
  if (rows[0]) return;
  const templateId = uuid();
  await pool.query(
    "INSERT INTO checklist_templates (id, title, description, frequency) VALUES (?, ?, ?, 'daily')",
    [templateId, "Daily Housekeeping Checklist", "Standard end-of-day housekeeping checklist for factory floor supervisors."]
  );
  const items = ["Work area cleaned and organized", "Machines wiped down and covered", "Waste bins emptied", "Safety equipment checked"];
  for (let i = 0; i < items.length; i++) {
    await pool.query("INSERT INTO checklist_template_items (id, template_id, label, sort_order) VALUES (?, ?, ?, ?)", [uuid(), templateId, items[i], i]);
  }
  console.log("Demo checklist template seeded: Daily Housekeeping Checklist");
}

async function seedDemoDelegation() {
  const [rows] = await pool.query<any[]>("SELECT id FROM delegated_tasks WHERE title = ?", ["Prepare weekly production summary"]);
  if (rows[0]) return;

  const [hodRow] = await pool.query<any[]>(
    "SELECT e.id FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'hod@liinexus.com'"
  );
  const [supervisorRow] = await pool.query<any[]>(
    "SELECT e.id FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'supervisor@liinexus.com'"
  );
  if (!hodRow[0] || !supervisorRow[0]) return;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  await pool.query(
    `INSERT INTO delegated_tasks (id, title, description, assigned_by, assigned_to, due_date, priority)
     VALUES (?, 'Prepare weekly production summary', 'Summarize this week''s output and delays for the executive meeting.', ?, ?, ?, 'medium')`,
    [uuid(), hodRow[0].id, supervisorRow[0].id, dueDate.toISOString().slice(0, 10)]
  );
  console.log("Demo delegated task seeded: Prepare weekly production summary");
}

async function seedDemoFactoryEntry() {
  const [rows] = await pool.query<any[]>("SELECT id FROM factory_production_entries WHERE order_reference = ?", ["DEMO-ORD-001"]);
  if (rows[0]) return;

  // Shifts and production lines are core factory master data that this
  // application has no seeder for at all - they've only ever existed on
  // long-lived dev databases because they were created manually through
  // the API during testing. A genuinely fresh install has zero of them,
  // which silently blocks any factory production entry from ever being
  // created. Seed the basics here so a new pilot company isn't stuck.
  const [existingShift] = await pool.query<any[]>("SELECT id FROM shifts WHERE name = ?", ["General"]);
  let shiftId = existingShift[0]?.id;
  if (!shiftId) {
    shiftId = uuid();
    await pool.query("INSERT INTO shifts (id, name, start_time, end_time) VALUES (?, 'General', '09:00:00', '17:00:00')", [shiftId]);
    await pool.query("INSERT INTO shifts (id, name, start_time, end_time) VALUES (?, 'Morning', '08:00:00', '16:00:00')", [uuid()]);
    await pool.query("INSERT INTO shifts (id, name, start_time, end_time) VALUES (?, 'Night', '00:00:00', '08:00:00')", [uuid()]);
    console.log("Demo shifts seeded: General, Morning, Night");
  }

  const [existingLine] = await pool.query<any[]>("SELECT id FROM production_lines WHERE name = ?", ["Line A"]);
  if (!existingLine[0]) {
    await pool.query("INSERT INTO production_lines (id, name, code) VALUES (?, 'Line A', 'LINE-A')", [uuid()]);
    console.log("Demo production line seeded: Line A");
  }

  const [deptRow] = await pool.query<any[]>("SELECT id FROM departments LIMIT 1");
  const [supervisorRow] = await pool.query<any[]>(
    "SELECT e.id FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'supervisor@liinexus.com'"
  );
  if (!deptRow[0] || !supervisorRow[0]) return;

  await pool.query(
    `INSERT INTO factory_production_entries
       (id, entry_date, shift_id, factory_department_id, order_reference, production_method, sku_code,
        target_qty, actual_qty, delay_minutes, delay_reason, supervisor_id, submitted_by, status)
     VALUES (?, CURDATE(), ?, ?, 'DEMO-ORD-001', 'finished_sku', 'DEMO-SKU-001', 100, 92, 15, 'Material delay', ?, ?, 'submitted')`,
    [uuid(), shiftId, deptRow[0].id, supervisorRow[0].id, supervisorRow[0].id]
  );
  console.log("Demo factory production entry seeded: DEMO-ORD-001");
}

async function seedDemoCrmLead() {
  const [rows] = await pool.query<any[]>("SELECT id FROM crm_leads WHERE lead_code = ?", ["LEAD-DEMO01"]);
  if (rows[0]) return;

  const [merchantRow] = await pool.query<any[]>(
    "SELECT e.id FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'merchant@liinexus.com'"
  );
  const forecastAmount = 50000;
  const winProbability = 60;
  await pool.query(
    `INSERT INTO crm_leads
       (id, lead_code, inquiry_date, contact_name, company_name, country, lead_source, lead_category,
        product_category, assigned_merchant_id, sales_stage, forecast_amount, win_probability, weighted_forecast, priority)
     VALUES (?, 'LEAD-DEMO01', CURDATE(), 'James Whitfield', 'Whitfield Home Furnishings', 'United Kingdom', 'trade_fair',
       'export', 'Dining Furniture', ?, 'qualification', ?, ?, ?, 'high')`,
    [uuid(), merchantRow[0]?.id ?? null, forecastAmount, winProbability, (forecastAmount * winProbability) / 100]
  );
  console.log("Demo CRM lead seeded: LEAD-DEMO01");
}

async function seedDemoKpiEntries() {
  const [defs] = await pool.query<any[]>("SELECT id, frequency FROM kpi_engine_definitions WHERE deleted_at IS NULL");
  for (const def of defs) {
    const periodKey = def.frequency === "quarterly"
      ? `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM kpi_engine_entries WHERE kpi_definition_id = ? AND period_key = ?", [def.id, periodKey]
    );
    if (existing[0]) continue;
    await pool.query(
      `INSERT INTO kpi_engine_entries (id, kpi_definition_id, period_key, target, actual, computed_score, traffic_light, weightage_used)
       VALUES (?, ?, ?, 100, 88, 88, 'amber', 15)`,
      [uuid(), def.id, periodKey]
    );
  }
  if (defs.length > 0) console.log(`Demo KPI Engine entries seeded for ${defs.length} definition(s).`);
}

export async function seedDemoData() {
  await seedDemoUsers();
  await seedDemoChecklistTemplate();
  await seedDemoDelegation();
  await seedDemoFactoryEntry();
  await seedDemoCrmLead();
  await seedDemoKpiEntries();
}
