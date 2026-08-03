export type ProductionMethod = "finished_sku" | "component_level";
export type MasterStatus = "active" | "inactive";

export interface FactoryDepartment {
  id: string;
  name: string;
  productionMethod: ProductionMethod;
  status: MasterStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
