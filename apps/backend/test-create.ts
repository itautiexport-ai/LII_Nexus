import { EmployeeService } from "./src/modules/organization/application/services/EmployeeService";
import { MySqlEmployeeRepository } from "./src/modules/organization/infrastructure/repositories/MySqlEmployeeRepository";
import { MySqlDepartmentRepository } from "./src/modules/organization/infrastructure/repositories/MySqlDepartmentRepository";
import { MySqlDesignationRepository } from "./src/modules/organization/infrastructure/repositories/MySqlDesignationRepository";

async function run() {
  const svc = new EmployeeService(
    new MySqlEmployeeRepository(),
    new MySqlDepartmentRepository(),
    new MySqlDesignationRepository()
  );
  try {
    const res = await svc.create({
      employeeCode: "TEST-CODE-2",
      fullName: "TEST FULLNAME",
      dateOfJoining: "2026-07-01",
      birthday: "2026-07-20",
    }, "actor-id");
    console.log("Success");
  } catch (err) {
    console.log("ERROR:", err);
  } finally {
    process.exit(0);
  }
}
run();
