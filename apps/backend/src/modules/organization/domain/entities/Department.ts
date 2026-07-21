export interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
