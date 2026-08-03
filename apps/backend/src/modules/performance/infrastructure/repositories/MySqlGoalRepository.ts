import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Goal, GoalProgressEntry } from "../../domain/entities/Goal";
import { CreateGoalData, IGoalRepository, UpdateGoalData } from "../../domain/repositories/IGoalRepository";

function mapGoal(row: any): Goal {
  return {
    id: row.id,
    employeeId: row.employee_id,
    title: row.title,
    description: row.description,
    unit: row.unit,
    targetValue: row.target_value === null ? null : Number(row.target_value),
    currentValue: Number(row.current_value),
    weight: Number(row.weight),
    status: row.status,
    startDate: row.start_date,
    targetDate: row.target_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapProgress(row: any): GoalProgressEntry {
  return {
    id: row.id,
    goalId: row.goal_id,
    value: Number(row.value),
    note: row.note,
    recordedBy: row.recorded_by,
    recordedAt: row.recorded_at,
  };
}

export class MySqlGoalRepository implements IGoalRepository {
  async listForEmployee(employeeId: string): Promise<Goal[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM performance_goals WHERE employee_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
      [employeeId]
    );
    return rows.map(mapGoal);
  }

  async findById(id: string): Promise<Goal | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM performance_goals WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapGoal(rows[0]) : null;
  }

  async create(data: CreateGoalData): Promise<Goal> {
    const id = data.id || uuid();
    await pool.query(
      `INSERT INTO performance_goals (id, employee_id, title, description, unit, target_value, weight, start_date, target_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.employeeId, data.title, data.description ?? null, data.unit ?? null,
        data.targetValue ?? null, data.weight ?? 0, data.startDate ?? null, data.targetDate ?? null, data.createdBy,
      ]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, changes: UpdateGoalData): Promise<Goal> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.title !== undefined) { fields.push("title = ?"); values.push(changes.title); }
    if (changes.description !== undefined) { fields.push("description = ?"); values.push(changes.description); }
    if (changes.unit !== undefined) { fields.push("unit = ?"); values.push(changes.unit); }
    if (changes.targetValue !== undefined) { fields.push("target_value = ?"); values.push(changes.targetValue); }
    if (changes.weight !== undefined) { fields.push("weight = ?"); values.push(changes.weight); }
    if (changes.status !== undefined) { fields.push("status = ?"); values.push(changes.status); }
    if (changes.startDate !== undefined) { fields.push("start_date = ?"); values.push(changes.startDate); }
    if (changes.targetDate !== undefined) { fields.push("target_date = ?"); values.push(changes.targetDate); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE performance_goals SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE performance_goals SET deleted_at = NOW(), status = 'cancelled' WHERE id = ?", [id]);
  }

  async addProgressEntry(entry: { id: string; goalId: string; value: number; note?: string | null; recordedBy: string }): Promise<GoalProgressEntry> {
    const id = entry.id || uuid();
    await pool.query(
      "INSERT INTO performance_goal_progress (id, goal_id, value, note, recorded_by) VALUES (?, ?, ?, ?, ?)",
      [id, entry.goalId, entry.value, entry.note ?? null, entry.recordedBy]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM performance_goal_progress WHERE id = ?", [id]);
    return mapProgress(rows[0]);
  }

  async listProgressForGoal(goalId: string): Promise<GoalProgressEntry[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM performance_goal_progress WHERE goal_id = ? ORDER BY recorded_at DESC",
      [goalId]
    );
    return rows.map(mapProgress);
  }

  async setCurrentValue(goalId: string, value: number): Promise<void> {
    await pool.query("UPDATE performance_goals SET current_value = ? WHERE id = ?", [value, goalId]);
  }
}
