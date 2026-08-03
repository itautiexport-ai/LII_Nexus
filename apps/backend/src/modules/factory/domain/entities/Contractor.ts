import { MasterStatus } from "./FactoryDepartment";

export interface Contractor {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  status: MasterStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
