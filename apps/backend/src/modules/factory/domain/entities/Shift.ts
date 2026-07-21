export interface Shift {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
