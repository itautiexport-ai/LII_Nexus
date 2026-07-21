import { FactoryDepartment, MasterStatus, ProductionMethod } from "../entities/FactoryDepartment";

export interface IFactoryDepartmentRepository {
  list(status?: MasterStatus): Promise<FactoryDepartment[]>;
  findById(id: string): Promise<FactoryDepartment | null>;
  findByName(name: string): Promise<FactoryDepartment | null>;
  create(data: { id: string; name: string; productionMethod: ProductionMethod }): Promise<FactoryDepartment>;
  update(id: string, changes: { name?: string; productionMethod?: ProductionMethod; status?: MasterStatus }): Promise<FactoryDepartment>;
  softDelete(id: string): Promise<void>;
}
