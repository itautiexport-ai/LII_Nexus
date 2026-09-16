import { Response } from "express";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { v4 as uuidv4 } from "uuid";

export const TableFreezeController = {
  async get(req: AuthenticatedRequest, res: Response) {
    const { tableKey } = req.params;
    const userId = req.user?.id || req.user?.sub;

    // 1. Try to find user-specific setting
    if (userId) {
      const [userRows] = await pool.query<any[]>(
        `SELECT * FROM table_freeze_settings WHERE table_key = ? AND user_id = ? LIMIT 1`,
        [tableKey, userId]
      );
      if (userRows.length > 0) {
        const row = userRows[0];
        return ok(res, {
          id: row.id,
          tableKey: row.table_key,
          userId: row.user_id,
          freezeColumns: Number(row.freeze_columns) || 0,
          freezeColumnKey: row.freeze_column_key,
          freezeRows: Number(row.freeze_rows) || 0,
          freezeHeader: Boolean(row.freeze_header),
          tableMaxHeight: row.table_max_height || "72vh",
          isUniversal: false,
          hasCustomSetting: true,
        });
      }
    }

    // 2. Fallback to universal setting (user_id IS NULL)
    const [univRows] = await pool.query<any[]>(
      `SELECT * FROM table_freeze_settings WHERE table_key = ? AND user_id IS NULL LIMIT 1`,
      [tableKey]
    );

    if (univRows.length > 0) {
      const row = univRows[0];
      return ok(res, {
        id: row.id,
        tableKey: row.table_key,
        userId: null,
        freezeColumns: Number(row.freeze_columns) || 0,
        freezeColumnKey: row.freeze_column_key,
        freezeRows: Number(row.freeze_rows) || 0,
        freezeHeader: Boolean(row.freeze_header),
        tableMaxHeight: row.table_max_height || "72vh",
        isUniversal: true,
        hasCustomSetting: false,
      });
    }

    // 3. Default fallback if neither is configured yet
    return ok(res, {
      tableKey,
      userId: null,
      freezeColumns: 0,
      freezeColumnKey: null,
      freezeRows: 0,
      freezeHeader: true,
      tableMaxHeight: "72vh",
      isUniversal: true,
      hasCustomSetting: false,
    });
  },

  async getAll(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id || req.user?.sub;
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM table_freeze_settings WHERE user_id IS NULL OR user_id = ? ORDER BY created_at DESC`,
      [userId || ""]
    );
    return ok(res, rows);
  },

  async save(req: AuthenticatedRequest, res: Response) {
    const { tableKey } = req.params;
    const userId = req.user?.id || req.user?.sub;
    const {
      freezeColumns = 0,
      freezeColumnKey = null,
      freezeRows = 0,
      freezeHeader = true,
      tableMaxHeight = "72vh",
      isUniversal = false,
    } = req.body;

    const targetUserId = isUniversal ? null : userId;

    if (!isUniversal && !targetUserId) {
      return res.status(400).json({ success: false, message: "User not authenticated for personal setting" });
    }

    // Check if entry already exists
    let existingQuery = `SELECT id FROM table_freeze_settings WHERE table_key = ? AND user_id IS NULL LIMIT 1`;
    let queryParams: any[] = [tableKey];

    if (!isUniversal) {
      existingQuery = `SELECT id FROM table_freeze_settings WHERE table_key = ? AND user_id = ? LIMIT 1`;
      queryParams = [tableKey, targetUserId];
    }

    const [existing] = await pool.query<any[]>(existingQuery, queryParams);

    if (isUniversal) {
      // Clear personal overrides so universal takes effect for everyone
      await pool.query(
        `DELETE FROM table_freeze_settings WHERE table_key = ? AND user_id IS NOT NULL`,
        [tableKey]
      );
    }

    if (existing.length > 0) {
      // Update
      const id = existing[0].id;
      await pool.query(
        `UPDATE table_freeze_settings
         SET freeze_columns = ?, freeze_column_key = ?, freeze_rows = ?, freeze_header = ?, table_max_height = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [freezeColumns, freezeColumnKey, freezeRows, freezeHeader ? 1 : 0, tableMaxHeight, id]
      );
      return ok(res, {
        id,
        tableKey,
        userId: targetUserId,
        freezeColumns,
        freezeColumnKey,
        freezeRows,
        freezeHeader,
        tableMaxHeight,
        isUniversal,
      });
    } else {
      // Insert
      const id = uuidv4();
      await pool.query(
        `INSERT INTO table_freeze_settings
         (id, table_key, user_id, freeze_columns, freeze_column_key, freeze_rows, freeze_header, table_max_height)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, tableKey, targetUserId, freezeColumns, freezeColumnKey, freezeRows, freezeHeader ? 1 : 0, tableMaxHeight]
      );
      return created(res, {
        id,
        tableKey,
        userId: targetUserId,
        freezeColumns,
        freezeColumnKey,
        freezeRows,
        freezeHeader,
        tableMaxHeight,
        isUniversal,
      });
    }
  },

  async reset(req: AuthenticatedRequest, res: Response) {
    const { tableKey } = req.params;
    const userId = req.user?.id || req.user?.sub;
    const resetUniversal = req.query.universal === "true" || req.body?.resetUniversal === true;

    if (resetUniversal) {
      await pool.query(`DELETE FROM table_freeze_settings WHERE table_key = ? AND user_id IS NULL`, [tableKey]);
    }

    if (userId) {
      await pool.query(`DELETE FROM table_freeze_settings WHERE table_key = ? AND user_id = ?`, [tableKey, userId]);
    }

    return ok(res, { message: "Freeze settings reset successfully", tableKey });
  },
};
