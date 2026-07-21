"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const uuid_1 = require("uuid");
const bcrypt_service_1 = require("../../../../infrastructure/security/bcrypt.service");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const User_1 = require("../../domain/entities/User");
const AuditService_1 = require("../../../../shared/services/AuditService");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class UserService {
    constructor(userRepository, roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }
    async list(page, pageSize, search) {
        const { items, total } = await this.userRepository.list({ page, pageSize, search });
        const withRoles = await Promise.all(items.map(async (u) => {
            const roles = await this.roleRepository.getRolesForUser(u.id);
            return (0, User_1.toPublicUser)(u, roles.map((r) => r.name));
        }));
        return { items: withRoles, total, page, pageSize };
    }
    async getById(id) {
        const user = await this.userRepository.findById(id);
        if (!user)
            throw new DomainError_1.NotFoundError("User not found.");
        const roles = await this.roleRepository.getRolesForUser(id);
        return (0, User_1.toPublicUser)(user, roles.map((r) => r.name));
    }
    async create(input, actorId) {
        const existing = await this.userRepository.findByIdentifier(input.email);
        if (existing && existing.email === input.email) {
            throw new DomainError_1.ConflictError("A user with this email already exists.");
        }
        const passwordHash = await bcrypt_service_1.BcryptService.hash(input.password);
        const userId = (0, uuid_1.v4)();
        const employeeCode = input.employeeCode || input.email;
        // Check if employee code already exists to prevent duplicate entries
        const [existingEmp] = await connection_1.pool.query("SELECT id FROM employees WHERE employee_code = ? AND deleted_at IS NULL", [employeeCode]);
        if (existingEmp[0]) {
            throw new DomainError_1.ConflictError("An employee with this Employee Code / Login ID already exists.");
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
        const assignedRoleNames = [];
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
        const employeeId = (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO employees (id, employee_code, full_name, email, department_id, designation_id, shift_id, user_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`, [
            employeeId,
            employeeCode,
            input.fullName,
            input.email, // login id / email
            input.departmentId || null,
            input.designationId || null,
            input.shiftId || null,
            userId
        ]);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "USER_CREATED",
            entityType: "user",
            entityId: user.id,
            afterState: { email: user.email, fullName: user.fullName },
        });
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "EMPLOYEE_CREATED",
            entityType: "employee",
            entityId: employeeId,
            afterState: { employeeCode, fullName: input.fullName },
        });
        return (0, User_1.toPublicUser)(user, assignedRoleNames);
    }
    async update(id, changes, actorId) {
        const existing = await this.userRepository.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("User not found.");
        const updated = await this.userRepository.update(id, changes);
        const roles = await this.roleRepository.getRolesForUser(id);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "USER_UPDATED",
            entityType: "user",
            entityId: id,
            beforeState: { fullName: existing.fullName, status: existing.status },
            afterState: { fullName: updated.fullName, status: updated.status },
        });
        return (0, User_1.toPublicUser)(updated, roles.map((r) => r.name));
    }
    async deactivate(id, actorId) {
        const existing = await this.userRepository.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("User not found.");
        await this.userRepository.softDelete(id);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "USER_DEACTIVATED",
            entityType: "user",
            entityId: id,
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map