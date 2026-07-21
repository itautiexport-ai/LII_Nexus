import { Goal, GoalProgressEntry } from "../entities/Goal";

export interface CreateGoalData {
  id: string;
  employeeId: string;
  title: string;
  description?: string | null;
  unit?: string | null;
  targetValue?: number | null;
  weight?: number;
  startDate?: string | null;
  targetDate?: string | null;
  createdBy: string;
}

export interface UpdateGoalData {
  title?: string;
  description?: string | null;
  unit?: string | null;
  targetValue?: number | null;
  weight?: number;
  status?: Goal["status"];
  startDate?: string | null;
  targetDate?: string | null;
}

export interface IGoalRepository {
  listForEmployee(employeeId: string): Promise<Goal[]>;
  findById(id: string): Promise<Goal | null>;
  create(data: CreateGoalData): Promise<Goal>;
  update(id: string, changes: UpdateGoalData): Promise<Goal>;
  softDelete(id: string): Promise<void>;

  addProgressEntry(entry: { id: string; goalId: string; value: number; note?: string | null; recordedBy: string }): Promise<GoalProgressEntry>;
  listProgressForGoal(goalId: string): Promise<GoalProgressEntry[]>;
  setCurrentValue(goalId: string, value: number): Promise<void>;
}
