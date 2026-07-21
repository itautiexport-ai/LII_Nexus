import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { FlowchartTask, FlowchartTaskWithContext, RunStatus, WorkflowRun } from "../../domain/entities/Flowchart";
import { IFlowchartRepository } from "../../domain/repositories/IFlowchartRepository";

function mapRun(row: any): WorkflowRun {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    reference: row.reference,
    notes: row.notes,
    status: row.status,
    startedBy: row.started_by,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

function mapTask(row: any): FlowchartTask {
  return {
    id: row.id,
    workflowRunId: row.workflow_run_id,
    stageId: row.stage_id,
    assignedTo: row.assigned_to,
    assignedBy: row.assigned_by,
    assignedAt: row.assigned_at,
    dueDate: row.due_date,
    baseStatus: row.base_status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    remarks: row.remarks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TASK_WITH_CONTEXT_SELECT = `
  SELECT ft.*, ws.name AS stage_name, ws.sequence AS stage_sequence,
         w.name AS workflow_name, wr.reference AS run_reference,
         e.full_name AS assignee_name
  FROM flowchart_tasks ft
  JOIN workflow_stages ws ON ws.id = ft.stage_id
  JOIN workflow_runs wr ON wr.id = ft.workflow_run_id
  JOIN workflows w ON w.id = wr.workflow_id
  LEFT JOIN employees e ON e.id = ft.assigned_to
`;

function mapTaskWithContext(row: any): FlowchartTaskWithContext {
  return {
    ...mapTask(row),
    stageName: row.stage_name,
    stageSequence: row.stage_sequence,
    workflowName: row.workflow_name,
    runReference: row.run_reference,
    assigneeName: row.assignee_name,
  };
}

export class MySqlFlowchartRepository implements IFlowchartRepository {
  async createRun(data: { id: string; workflowId: string; reference: string; notes?: string | null; startedBy: string; firstStageId: string }): Promise<WorkflowRun> {
    const runId = data.id || uuid();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        "INSERT INTO workflow_runs (id, workflow_id, reference, notes, started_by) VALUES (?, ?, ?, ?, ?)",
        [runId, data.workflowId, data.reference, data.notes ?? null, data.startedBy]
      );
      await conn.query(
        "INSERT INTO flowchart_tasks (id, workflow_run_id, stage_id, base_status) VALUES (?, ?, ?, 'pending')",
        [uuid(), runId, data.firstStageId]
      );
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return (await this.findRunById(runId))!;
  }

  async listRuns(params: { page: number; pageSize: number; workflowId?: string; status?: RunStatus }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (params.workflowId) { conditions.push("wr.workflow_id = ?"); values.push(params.workflowId); }
    if (params.status) { conditions.push("wr.status = ?"); values.push(params.status); }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query<any[]>(
      `SELECT wr.*, w.name AS workflow_name FROM workflow_runs wr
       JOIN workflows w ON w.id = wr.workflow_id
       ${whereClause} ORDER BY wr.started_at DESC LIMIT ? OFFSET ?`,
      [...values, params.pageSize, offset]
    );
    const [countRows] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM workflow_runs wr ${whereClause}`,
      values
    );
    return { items: rows.map((r) => ({ ...mapRun(r), workflowName: r.workflow_name })), total: countRows[0].total as number };
  }

  async findRunById(id: string): Promise<WorkflowRun | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM workflow_runs WHERE id = ?", [id]);
    return rows[0] ? mapRun(rows[0]) : null;
  }

  async updateRunStatus(id: string, status: RunStatus): Promise<void> {
    const completedAt = status === "completed" ? "NOW()" : "NULL";
    await pool.query(`UPDATE workflow_runs SET status = ?, completed_at = ${completedAt} WHERE id = ?`, [status, id]);
  }

  async findTaskById(id: string): Promise<FlowchartTask | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM flowchart_tasks WHERE id = ?", [id]);
    return rows[0] ? mapTask(rows[0]) : null;
  }

  async listTasksForRun(runId: string): Promise<FlowchartTaskWithContext[]> {
    const [rows] = await pool.query<any[]>(
      `${TASK_WITH_CONTEXT_SELECT} WHERE ft.workflow_run_id = ? ORDER BY ws.sequence ASC`,
      [runId]
    );
    return rows.map(mapTaskWithContext);
  }

  async listTasksForEmployee(employeeId: string, params?: { from?: string; to?: string }): Promise<FlowchartTaskWithContext[]> {
    const conditions = ["ft.assigned_to = ?"];
    const values: unknown[] = [employeeId];
    if (params?.from) { conditions.push("ft.due_date >= ?"); values.push(params.from); }
    if (params?.to) { conditions.push("ft.due_date <= ?"); values.push(params.to); }
    const [rows] = await pool.query<any[]>(
      `${TASK_WITH_CONTEXT_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY ft.due_date ASC`,
      values
    );
    return rows.map(mapTaskWithContext);
  }

  async assignTask(id: string, employeeId: string, assignedBy: string, dueDate: string | null): Promise<FlowchartTask> {
    await pool.query(
      "UPDATE flowchart_tasks SET assigned_to = ?, assigned_by = ?, assigned_at = NOW(), due_date = ? WHERE id = ?",
      [employeeId, assignedBy, dueDate, id]
    );
    return (await this.findTaskById(id))!;
  }

  async updateTaskStatus(id: string, status: "running" | "completed", remarks?: string | null): Promise<FlowchartTask> {
    if (status === "running") {
      await pool.query(
        "UPDATE flowchart_tasks SET base_status = 'running', started_at = COALESCE(started_at, NOW()), remarks = COALESCE(?, remarks) WHERE id = ?",
        [remarks ?? null, id]
      );
    } else {
      await pool.query(
        "UPDATE flowchart_tasks SET base_status = 'completed', completed_at = NOW(), remarks = COALESCE(?, remarks) WHERE id = ?",
        [remarks ?? null, id]
      );
    }
    return (await this.findTaskById(id))!;
  }

  async createNextStageTask(runId: string, stageId: string): Promise<FlowchartTask> {
    const id = uuid();
    await pool.query(
      "INSERT INTO flowchart_tasks (id, workflow_run_id, stage_id, base_status) VALUES (?, ?, ?, 'pending')",
      [id, runId, stageId]
    );
    return (await this.findTaskById(id))!;
  }

  async countCompletedAndTotalDue(employeeId: string, from: string, to: string): Promise<{ completed: number; total: number }> {
    const [rows] = await pool.query<any[]>(
      `SELECT
         SUM(CASE WHEN base_status = 'completed' THEN 1 ELSE 0 END) as completed,
         COUNT(*) as total
       FROM flowchart_tasks
       WHERE assigned_to = ? AND due_date BETWEEN ? AND ?`,
      [employeeId, from, to]
    );
    return { completed: Number(rows[0].completed) || 0, total: Number(rows[0].total) || 0 };
  }
}
