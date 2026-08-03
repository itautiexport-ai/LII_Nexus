import { MySqlEmployeeRepository } from "./src/modules/organization/infrastructure/repositories/MySqlEmployeeRepository";
import { v4 as uuid } from "uuid";

async function run() {
  const repo = new MySqlEmployeeRepository();
  try {
    const res = await repo.create({
      id: uuid(),
      employeeCode: "TEST9998",
      fullName: "TEST NAME",
      email: null,
      phone: null,
      departmentId: "invalid-uuid", // Wait! In DB this is char(36).
      designationId: null,
      managerId: null,
      userId: null,
      shiftId: null,
      dateOfJoining: "2026-07-01",
      birthday: "2026-07-20",
      anniversary: null
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();
