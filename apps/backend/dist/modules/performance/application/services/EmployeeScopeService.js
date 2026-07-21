"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeScopeService = void 0;
const MySqlEmployeeRepository_1 = require("../../../organization/infrastructure/repositories/MySqlEmployeeRepository");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
/**
 * Performance data (goals, reviews) is scoped by employment relationship, not
 * just RBAC permission: an employee can always act on their own record, and a
 * manager can always act on their direct reports, regardless of whether they
 * hold a broader `performance.*` permission. Those broader permissions exist
 * for HR/admin oversight across the whole org, layered on top of - not
 * instead of - the ownership/reporting-line relationship.
 */
class EmployeeScopeService {
    constructor() {
        this.employeeRepo = new MySqlEmployeeRepository_1.MySqlEmployeeRepository();
    }
    async getEmployeeForUser(userId) {
        return this.employeeRepo.findByUserId(userId);
    }
    async requireEmployeeForUser(userId) {
        const employee = await this.employeeRepo.findByUserId(userId);
        if (!employee) {
            throw new DomainError_1.ValidationError("Your account is not linked to an Employee Master record. Ask an admin to link it.");
        }
        return employee;
    }
    async getEmployeeById(employeeId) {
        return this.employeeRepo.findById(employeeId);
    }
    isSelf(actorEmployee, targetEmployeeId) {
        return actorEmployee.id === targetEmployeeId;
    }
    isManagerOf(actorEmployee, targetEmployee) {
        return targetEmployee.managerId === actorEmployee.id;
    }
    /** Throws unless the actor is the target employee themselves, the target's
     *  direct manager, or `hasOverridePermission` is true (HR/admin path). */
    assertCanActOn(actorEmployee, targetEmployee, hasOverridePermission) {
        if (hasOverridePermission)
            return;
        if (this.isSelf(actorEmployee, targetEmployee.id))
            return;
        if (this.isManagerOf(actorEmployee, targetEmployee))
            return;
        throw new DomainError_1.ForbiddenError("You can only act on your own performance data or that of your direct reports.");
    }
    /**
     * Full authorization check for "self, manager, or override" actions
     * (goals, reviews, viewing). Critically, this checks `hasOverride` FIRST,
     * before resolving the actor's own employee record - an HR/admin user
     * exercising an override permission is not required to have an Employee
     * Master record of their own (many back-office admins never appear on the
     * org chart). Resolving the actor unconditionally, as earlier code did,
     * meant an override-permission holder with no employee link got blocked
     * with a confusing "not linked to an employee record" error instead of
     * being let through - that was a real bug, not a stricter security posture.
     * Returns the target employee (callers often need it, e.g. for managerId).
     */
    async authorize(actorUserId, targetEmployeeId, hasOverride) {
        const target = await this.getEmployeeById(targetEmployeeId);
        if (!target)
            throw new DomainError_1.NotFoundError("Employee not found.");
        if (hasOverride)
            return target;
        // No `requireEmployeeForUser` here deliberately: an actor with no employee
        // record at all trivially cannot be "self" or "the manager" of anyone, so
        // that's a plain authorization failure (403), not a "please link your
        // account" data problem (400) - the latter is reserved for genuine
        // self-service entry points like initiating your own review.
        const actor = await this.getEmployeeForUser(actorUserId);
        if (!actor) {
            throw new DomainError_1.ForbiddenError("You can only act on your own performance data or that of your direct reports.");
        }
        if (this.isSelf(actor, targetEmployeeId))
            return target;
        if (this.isManagerOf(actor, target))
            return target;
        throw new DomainError_1.ForbiddenError("You can only act on your own performance data or that of your direct reports.");
    }
    /**
     * Stricter variant for actions that are never self-service (e.g. Factory
     * production entries - a supervisor logs on a worker's behalf, the worker
     * never logs their own). Same override-first ordering as `authorize`.
     */
    async authorizeManagerOnly(actorUserId, targetEmployeeId, hasOverride, deniedMessage) {
        const target = await this.getEmployeeById(targetEmployeeId);
        if (!target)
            throw new DomainError_1.NotFoundError("Employee not found.");
        if (hasOverride)
            return target;
        const actor = await this.getEmployeeForUser(actorUserId);
        if (!actor)
            throw new DomainError_1.ForbiddenError(deniedMessage);
        if (this.isManagerOf(actor, target))
            return target;
        throw new DomainError_1.ForbiddenError(deniedMessage);
    }
}
exports.EmployeeScopeService = EmployeeScopeService;
//# sourceMappingURL=EmployeeScopeService.js.map