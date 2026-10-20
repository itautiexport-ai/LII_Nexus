import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

export interface FinishingLibraryRecord {
  id: string;
  buyer_name: string;
  buyer_code: string | null;
  finish_recipe_code: string;
  recipe_id: string | null;
  photos: string[];
  remarks: string | null;
  created_by: string;
  user_name?: string;
  created_at: Date;
  updated_at: Date;
  item_code?: string;
  item_description?: string;
  gloss_level?: string;
  wood_type?: string;
  recipe_swatch_image?: string;
  recipe_steps?: any[];
}

export class FinishingLibraryRepository {
  async findAll(): Promise<FinishingLibraryRecord[]> {
    const [rows] = await pool.query(
      `SELECT fl.*, u.full_name as user_name,
              fr.item_code, fr.item_description, fr.gloss_level, fr.wood_type, fr.swatch_image as recipe_swatch_image
       FROM finishing_library fl
       LEFT JOIN users u ON fl.created_by = u.id
       LEFT JOIN finishing_recipes fr ON (fl.recipe_id = fr.id OR fl.finish_recipe_code COLLATE utf8mb4_0900_ai_ci = fr.finish_code COLLATE utf8mb4_0900_ai_ci)
       ORDER BY fl.created_at DESC`
    );

    return (rows as any[]).map(row => ({
      ...row,
      photos: typeof row.photos === "string" ? JSON.parse(row.photos) : (row.photos || [])
    }));
  }

  async findById(id: string): Promise<FinishingLibraryRecord | null> {
    const [rows] = await pool.query(
      `SELECT fl.*, u.full_name as user_name,
              fr.id as matched_recipe_id, fr.item_code, fr.item_description, fr.gloss_level, fr.wood_type, fr.swatch_image as recipe_swatch_image
       FROM finishing_library fl
       LEFT JOIN users u ON fl.created_by = u.id
       LEFT JOIN finishing_recipes fr ON (fl.recipe_id = fr.id OR fl.finish_recipe_code COLLATE utf8mb4_0900_ai_ci = fr.finish_code COLLATE utf8mb4_0900_ai_ci)
       WHERE fl.id = ?`,
      [id]
    );

    const record = (rows as any[])[0];
    if (!record) return null;

    record.photos = typeof record.photos === "string" ? JSON.parse(record.photos) : (record.photos || []);

    const actualRecipeId = record.recipe_id || record.matched_recipe_id;
    if (actualRecipeId) {
      const [steps] = await pool.query(
        `SELECT * FROM finishing_recipe_steps WHERE recipe_id = ? ORDER BY step_no ASC`,
        [actualRecipeId]
      );
      record.recipe_steps = steps as any[];
    } else {
      record.recipe_steps = [];
    }

    return record as FinishingLibraryRecord;
  }

  async create(data: {
    buyerName: string;
    buyerCode?: string;
    finishRecipeCode: string;
    recipeId?: string;
    photos: string[];
    remarks?: string;
    createdBy: string;
  }): Promise<FinishingLibraryRecord> {
    const id = uuid();

    let recipeId = data.recipeId || null;
    if (!recipeId && data.finishRecipeCode) {
      const [matched] = await pool.query(
        `SELECT id FROM finishing_recipes WHERE finish_code = ? LIMIT 1`,
        [data.finishRecipeCode]
      );
      if ((matched as any[]).length > 0) {
        recipeId = (matched as any[])[0].id;
      }
    }

    await pool.query(
      `INSERT INTO finishing_library (id, buyer_name, buyer_code, finish_recipe_code, recipe_id, photos, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.buyerName,
        data.buyerCode || null,
        data.finishRecipeCode,
        recipeId,
        JSON.stringify(data.photos || []),
        data.remarks || null,
        data.createdBy
      ]
    );

    const created = await this.findById(id);
    return created!;
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await pool.query(`DELETE FROM finishing_library WHERE id = ?`, [id]);
    return (result as any).affectedRows > 0;
  }
}
