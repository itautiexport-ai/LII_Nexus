import { Response } from "express";
import { EmployeeService } from "../../application/services/EmployeeService";
import { MySqlEmployeeRepository } from "../../infrastructure/repositories/MySqlEmployeeRepository";
import { MySqlDepartmentRepository } from "../../infrastructure/repositories/MySqlDepartmentRepository";
import { MySqlDesignationRepository } from "../../infrastructure/repositories/MySqlDesignationRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const service = new EmployeeService(
  new MySqlEmployeeRepository(),
  new MySqlDepartmentRepository(),
  new MySqlDesignationRepository()
);

export const EmployeeController = {
  async me(req: AuthenticatedRequest, res: Response) {
    const repo = new MySqlEmployeeRepository();
    const employee = await repo.findByUserId(req.user!.sub);
    return ok(res, employee);
  },

  async myDirectReports(req: AuthenticatedRequest, res: Response) {
    const repo = new MySqlEmployeeRepository();
    const me = await repo.findByUserId(req.user!.sub);
    if (!me) return ok(res, []);
    return ok(res, await repo.listDirectReports(me.id));
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const search = req.query.search as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const { items, total } = await service.list(page, pageSize, search, departmentId);
    return ok(res, items, { page, pageSize, totalItems: total });
  },

  async lookup(req: AuthenticatedRequest, res: Response) {
    const search = req.query.search as string | undefined;
    const { items } = await service.list(1, 10000, search);
    const lookupData = items.map(emp => ({
      id: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      departmentName: emp.departmentName,
      designationTitle: emp.designationTitle
    }));
    return ok(res, lookupData);
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getById(req.params.id));
  },
  async create(req: AuthenticatedRequest, res: Response) {
    return created(res, await service.create(req.body, req.user!.sub));
  },
  async update(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.update(req.params.id, req.body, req.user!.sub));
  },
  async remove(req: AuthenticatedRequest, res: Response) {
    await service.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "Employee deactivated." });
  },
};
