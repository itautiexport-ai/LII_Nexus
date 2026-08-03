import { MySqlEmployeeRepository } from "../../../organization/infrastructure/repositories/MySqlEmployeeRepository";
import { Employee } from "../../../organization/domain/entities/Employee";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";

/**
 * Performance data (goals, reviews) is scoped by employment relationship, not
 * just RBAC permission: an employee can always act on their own record, and a
 * manager can always act on their direct reports, regardless of whether they
 * hold a broader `performance.*` permission. Those broader permissions exist
 * for HR/admin oversight across the whole org, layered on top of - not
 * instead of - the ownership/reporting-line relationship.
 */
export class EmployeeScopeService {
  private readonly employeeRepo = new MySqlEmployeeRepository();

  async getEmployeeForUser(userId: string): Promise<Employee | null> {
    return this.employeeRepo.findByUserId(userId);
  }

  async requireEmployeeForUser(userId: string): Promise<Employee> {
    const employee = await this.employeeRepo.findByUserId(userId);
    if (!employee) {
      throw new ValidationError("Your account is not linked to an Employee Master record. Ask an admin to link it.");
    }
    return employee;
  }

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    return this.employeeRepo.findById(employeeId);
  }

  isSelf(actorEmployee: Employee, targetEmployeeId: string): boolean {
    return actorEmployee.id === targetEmployeeId;
  }

  isManagerOf(actorEmployee: Employee, targetEmployee: Employee): boolean {
    return targetEmployee.managerId === actorEmployee.id;
  }

  /** Throws unless the actor is the target employee themselves, the target's
   *  direct manager, or `hasOverridePermission` is true (HR/admin path). */
  assertCanActOn(actorEmployee: Employee, targetEmployee: Employee, hasOverridePermission: boolean) {
    if (hasOverridePermission) return;
    if (this.isSelf(actorEmployee, targetEmployee.id)) return;
    if (this.isManagerOf(actorEmployee, targetEmployee)) return;
    throw new ForbiddenError("You can only act on your own performance data or that of your direct reports.");
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
  async authorize(actorUserId: string, targetEmployeeId: string, hasOverride: boolean): Promise<Employee> {
    const target = await this.getEmployeeById(targetEmployeeId);
    if (!target) throw new NotFoundError("Employee not found.");
    if (hasOverride) return target;

    // No `requireEmployeeForUser` here deliberately: an actor with no employee
    // record at all trivially cannot be "self" or "the manager" of anyone, so
    // that's a plain authorization failure (403), not a "please link your
    // account" data problem (400) - the latter is reserved for genuine
    // self-service entry points like initiating your own review.
    const actor = await this.getEmployeeForUser(actorUserId);
    if (!actor) {
      throw new ForbiddenError("You can only act on your own performance data or that of your direct reports.");
    }
    if (this.isSelf(actor, targetEmployeeId)) return target;
    if (this.isManagerOf(actor, target)) return target;
    throw new ForbiddenError("You can only act on your own performance data or that of your direct reports.");
  }

  /**
   * Stricter variant for actions that are never self-service (e.g. Factory
   * production entries - a supervisor logs on a worker's behalf, the worker
   * never logs their own). Same override-first ordering as `authorize`.
   */
  async authorizeManagerOnly(actorUserId: string, targetEmployeeId: string, hasOverride: boolean, deniedMessage: string): Promise<Employee> {
    const target = await this.getEmployeeById(targetEmployeeId);
    if (!target) throw new NotFoundError("Employee not found.");
    if (hasOverride) return target;

    const actor = await this.getEmployeeForUser(actorUserId);
    if (!actor) throw new ForbiddenError(deniedMessage);
    if (this.isManagerOf(actor, target)) return target;
    throw new ForbiddenError(deniedMessage);
  }
}
