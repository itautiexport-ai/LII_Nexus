import { v4 as uuid } from "uuid";
import { IEmployeeRepository } from "../../domain/repositories/IEmployeeRepository";
import { IDepartmentRepository } from "../../domain/repositories/IDepartmentRepository";
import { IDesignationRepository } from "../../domain/repositories/IDesignationRepository";
import { ConflictError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { CreateEmployeeInput, UpdateEmployeeInput } from "./types";

export class EmployeeService {
  constructor(
    private readonly employeeRepo: IEmployeeRepository,
    private readonly departmentRepo: IDepartmentRepository,
    private readonly designationRepo: IDesignationRepository
  ) {}

  list(page: number, pageSize: number, search?: string, departmentId?: string) {
    return this.employeeRepo.list({ page, pageSize, search, departmentId });
  }

  async getById(id: string) {
    const employee = await this.employeeRepo.findById(id);
    if (!employee) throw new NotFoundError("Employee not found.");
    return employee;
  }

  private async assertReferencesExist(departmentId?: string | null, designationId?: string | null, managerId?: string | null, selfId?: string) {
    if (departmentId) {
      const dept = await this.departmentRepo.findById(departmentId);
      if (!dept) throw new ValidationError("The specified department does not exist.");
    }
    if (designationId) {
      const desig = await this.designationRepo.findById(designationId);
      if (!desig) throw new ValidationError("The specified designation does not exist.");
    }
    if (managerId) {
      if (selfId && managerId === selfId) throw new ValidationError("An employee cannot be their own HOD.");
      const hodExists = await this.employeeRepo.checkHodExists(managerId);
      if (!hodExists) throw new ValidationError("The specified HOD does not exist in Master Data.");
    }
  }

  async create(input: CreateEmployeeInput, actorId: string) {
    const existing = await this.employeeRepo.findByEmployeeCode(input.employeeCode);
    if (existing) throw new ConflictError("An employee with this employee code already exists.");
    await this.assertReferencesExist(input.departmentId, input.designationId, input.managerId);

    const employee = await this.employeeRepo.create({ id: uuid(), ...input });
    await AuditService.record({
      actorUserId: actorId,
      action: "EMPLOYEE_CREATED",
      entityType: "employee",
      entityId: employee.id,
      afterState: { employeeCode: employee.employeeCode, fullName: employee.fullName },
    });
    return employee;
  }

  private async assertUserLinkIsValid(userId: string | null | undefined, selfId: string) {
    if (!userId) return;
    const existingLink = await this.employeeRepo.findByUserId(userId);
    if (existingLink && existingLink.id !== selfId) {
      throw new ConflictError("That login account is already linked to a different employee record.");
    }
  }

  async update(id: string, changes: UpdateEmployeeInput, actorId: string) {
    const existing = await this.employeeRepo.findById(id);
    if (!existing) throw new NotFoundError("Employee not found.");
    await this.assertReferencesExist(changes.departmentId, changes.designationId, changes.managerId, id);
    await this.assertUserLinkIsValid(changes.userId, id);

    const updated = await this.employeeRepo.update(id, changes);
    await AuditService.record({
      actorUserId: actorId,
      action: "EMPLOYEE_UPDATED",
      entityType: "employee",
      entityId: id,
      beforeState: { fullName: existing.fullName, status: existing.status },
      afterState: { fullName: updated.fullName, status: updated.status },
    });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.employeeRepo.findById(id);
    if (!existing) throw new NotFoundError("Employee not found.");
    await this.employeeRepo.softDelete(id);
    await AuditService.record({ actorUserId: actorId, action: "EMPLOYEE_DEACTIVATED", entityType: "employee", entityId: id });
  }
}
