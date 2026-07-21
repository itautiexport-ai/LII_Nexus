"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class EmployeeService {
    constructor(employeeRepo, departmentRepo, designationRepo) {
        this.employeeRepo = employeeRepo;
        this.departmentRepo = departmentRepo;
        this.designationRepo = designationRepo;
    }
    list(page, pageSize, search, departmentId) {
        return this.employeeRepo.list({ page, pageSize, search, departmentId });
    }
    async getById(id) {
        const employee = await this.employeeRepo.findById(id);
        if (!employee)
            throw new DomainError_1.NotFoundError("Employee not found.");
        return employee;
    }
    async assertReferencesExist(departmentId, designationId, managerId, selfId) {
        if (departmentId) {
            const dept = await this.departmentRepo.findById(departmentId);
            if (!dept)
                throw new DomainError_1.ValidationError("The specified department does not exist.");
        }
        if (designationId) {
            const desig = await this.designationRepo.findById(designationId);
            if (!desig)
                throw new DomainError_1.ValidationError("The specified designation does not exist.");
        }
        if (managerId) {
            if (selfId && managerId === selfId)
                throw new DomainError_1.ValidationError("An employee cannot be their own HOD.");
            const hodExists = await this.employeeRepo.checkHodExists(managerId);
            if (!hodExists)
                throw new DomainError_1.ValidationError("The specified HOD does not exist in Master Data.");
        }
    }
    async create(input, actorId) {
        const existing = await this.employeeRepo.findByEmployeeCode(input.employeeCode);
        if (existing)
            throw new DomainError_1.ConflictError("An employee with this employee code already exists.");
        await this.assertReferencesExist(input.departmentId, input.designationId, input.managerId);
        const employee = await this.employeeRepo.create({ id: (0, uuid_1.v4)(), ...input });
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "EMPLOYEE_CREATED",
            entityType: "employee",
            entityId: employee.id,
            afterState: { employeeCode: employee.employeeCode, fullName: employee.fullName },
        });
        return employee;
    }
    async assertUserLinkIsValid(userId, selfId) {
        if (!userId)
            return;
        const existingLink = await this.employeeRepo.findByUserId(userId);
        if (existingLink && existingLink.id !== selfId) {
            throw new DomainError_1.ConflictError("That login account is already linked to a different employee record.");
        }
    }
    async update(id, changes, actorId) {
        const existing = await this.employeeRepo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Employee not found.");
        await this.assertReferencesExist(changes.departmentId, changes.designationId, changes.managerId, id);
        await this.assertUserLinkIsValid(changes.userId, id);
        const updated = await this.employeeRepo.update(id, changes);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "EMPLOYEE_UPDATED",
            entityType: "employee",
            entityId: id,
            beforeState: { fullName: existing.fullName, status: existing.status },
            afterState: { fullName: updated.fullName, status: updated.status },
        });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.employeeRepo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Employee not found.");
        await this.employeeRepo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "EMPLOYEE_DEACTIVATED", entityType: "employee", entityId: id });
    }
}
exports.EmployeeService = EmployeeService;
//# sourceMappingURL=EmployeeService.js.map