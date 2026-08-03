import { v4 as uuid } from "uuid";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IRoleRepository } from "../../../rbac/domain/repositories/IRoleRepository";
import { BcryptService } from "../../../../infrastructure/security/bcrypt.service";
import { ConflictError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { toPublicUser } from "../../domain/entities/User";
import { CreateUserInput, UpdateUserInput } from "../dto/user.dto";
import { AuditService } from "../../../../shared/services/AuditService";
import { pool } from "../../../../infrastructure/database/mysql/connection";

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  async list(page: number, pageSize: number, search?: string) {
    const { items, total } = await this.userRepository.list({ page, pageSize, search });
    const withRoles = await Promise.all(
      items.map(async (u) => {
        const roles = await this.roleRepository.getRolesForUser(u.id);
        const [empRows] = await pool.query<any[]>(
          `SELECT d.name as departmentName, e.department_id as departmentId 
           FROM employees e 
           LEFT JOIN departments d ON e.department_id = d.id 
           WHERE e.user_id = ? 
           ORDER BY e.deleted_at IS NULL DESC, e.created_at DESC 
           LIMIT 1`, 
          [u.id]
        );
        const department = empRows[0]?.departmentName || null;
        const departmentId = empRows[0]?.departmentId || null;
        return { ...toPublicUser(u, roles.map((r) => r.name)), department, departmentId };
      })
    );
    return { items: withRoles, total, page, pageSize };
  }

  async getById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found.");
    const roles = await this.roleRepository.getRolesForUser(id);
    return toPublicUser(user, roles.map((r) => r.name));
  }

  async create(input: any, actorId: string) {
    const existing = await this.userRepository.findByIdentifier(input.email);
    if (existing && existing.email === input.email) {
      throw new ConflictError("A user with this email already exists.");
    }

    const passwordHash = await BcryptService.hash(input.password);
    const userId = uuid();
    const employeeCode = input.employeeCode || input.email;

    // Check if employee code already exists to prevent duplicate entries
    const [existingEmp] = await pool.query<any[]>("SELECT id FROM employees WHERE employee_code = ? AND deleted_at IS NULL", [employeeCode]);
    if (existingEmp[0]) {
      throw new ConflictError("An employee with this Employee Code / Login ID already exists.");
    }

    const user = await this.userRepository.create({
      id: userId,
      employeeCode: employeeCode,
      email: input.email,
      passwordHash,
      tempPassword: input.password,
      fullName: input.fullName,
      whatsappNumber: input.whatsappNumber,
    });

    // Assign roles if provided
    const assignedRoleNames: string[] = [];
    if (Array.isArray(input.roles) && input.roles.length > 0) {
      for (const roleName of input.roles) {
        const role = await this.roleRepository.findByName(roleName);
        if (role) {
          await this.roleRepository.assignRoleToUser(userId, role.id, "global", "");
          assignedRoleNames.push(roleName);
        }
      }
    }

    // Create corresponding Employee record
    const employeeId = uuid();
    await pool.query(
      `INSERT INTO employees (id, employee_code, full_name, email, department_id, designation_id, shift_id, user_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        employeeId,
        employeeCode,
        input.fullName,
        input.email, // login id / email
        input.departmentId || null,
        input.designationId || null,
        input.shiftId || null,
        userId
      ]
    );

    await AuditService.record({
      actorUserId: actorId,
      action: "USER_CREATED",
      entityType: "user",
      entityId: user.id,
      afterState: { email: user.email, fullName: user.fullName },
    });

    await AuditService.record({
      actorUserId: actorId,
      action: "EMPLOYEE_CREATED",
      entityType: "employee",
      entityId: employeeId,
      afterState: { employeeCode, fullName: input.fullName },
    });

    return toPublicUser(user, assignedRoleNames);
  }

  async update(id: string, changes: UpdateUserInput, actorId: string) {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new NotFoundError("User not found.");

    const updatePayload: any = { ...changes };
    if (changes.password) {
      updatePayload.passwordHash = await BcryptService.hash(changes.password);
      delete updatePayload.password;
    }

    const updated = await this.userRepository.update(id, updatePayload);
    
    // Sync email to employee record if changed
    if (changes.email && changes.email !== existing.email) {
      await pool.query("UPDATE employees SET email = ? WHERE user_id = ?", [changes.email, id]);
    }

    // Sync employee code to employee record if changed
    if (changes.employeeCode && changes.employeeCode !== existing.employeeCode) {
      await pool.query("UPDATE employees SET employee_code = ? WHERE user_id = ?", [changes.employeeCode, id]);
    }

    // Sync department to employee record if changed
    if (changes.departmentId !== undefined) {
      await pool.query("UPDATE employees SET department_id = ? WHERE user_id = ?", [changes.departmentId || null, id]);
    }

    const roles = await this.roleRepository.getRolesForUser(id);

    await AuditService.record({
      actorUserId: actorId,
      action: "USER_UPDATED",
      entityType: "user",
      entityId: id,
      beforeState: { fullName: existing.fullName, status: existing.status },
      afterState: { fullName: updated.fullName, status: updated.status },
    });

    return toPublicUser(updated, roles.map((r) => r.name));
  }

  async deactivate(id: string, actorId: string) {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new NotFoundError("User not found.");

    // Find linked employees BEFORE we delete the user (because ON DELETE SET NULL might clear the link)
    const [employees] = await pool.query<any[]>("SELECT id FROM employees WHERE user_id = ? AND deleted_at IS NULL", [id]);

    await this.userRepository.softDelete(id);

    // Delete the linked employees safely
    if (employees && employees.length > 0) {
      const { MySqlEmployeeRepository } = require("../../../organization/infrastructure/repositories/MySqlEmployeeRepository");
      const empRepo = new MySqlEmployeeRepository();
      for (const emp of employees) {
        await empRepo.softDelete(emp.id);
      }
    }

    await AuditService.record({
      actorUserId: actorId,
      action: "USER_DEACTIVATED",
      entityType: "user",
      entityId: id,
    });
  }
}
