import { pool } from "./src/infrastructure/database/mysql/connection";

async function run() {
  try {
    const [employees] = await pool.query<any[]>(`
      SELECT e.id, e.employee_code, e.full_name, e.status, g.title as designation_title, e.user_id
      FROM employees e
      LEFT JOIN designations g ON g.id = e.designation_id
    `);
    console.log("=== All Employees in DB ===");
    console.log(employees);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}
run();



