import { Contractor } from "../entities/Contractor";
import { MasterStatus } from "../entities/FactoryDepartment";

export interface IContractorRepository {
  list(status?: MasterStatus): Promise<Contractor[]>;
  findById(id: string): Promise<Contractor | null>;
  create(data: { id: string; name: string; contactPerson?: string | null; phone?: string | null; email?: string | null }): Promise<Contractor>;
  update(id: string, changes: { name?: string; contactPerson?: string | null; phone?: string | null; email?: string | null; status?: MasterStatus }): Promise<Contractor>;
  softDelete(id: string): Promise<void>;
}
