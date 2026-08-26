import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

export interface RecipeStepRecord {
  id: string;
  recipe_id: string;
  step_no: number;
  process_material: string | null;
  tool_machine: string | null;
  grit_quantity: string | null;
  drying_time: string | null;
  notes: string | null;
  no_of_coats: string | null;
}

export interface FinishingRecipeRecord {
  id: string;
  item_code: string;
  finish_code: string;
  item_description: string | null;
  created_on: string;
  buyer_code: string | null;
  gloss_level: string | null;
  wood_type: string | null;
  swatch_image?: string | null;
  created_by: string | null;
  user_name?: string | null;
  created_at: Date;
  steps?: RecipeStepRecord[];
}

export class FinishingRecipeRepository {
  async findAll(): Promise<FinishingRecipeRecord[]> {
    const [rows] = await pool.query(
      `SELECT fr.*, u.full_name as user_name 
       FROM finishing_recipes fr 
       LEFT JOIN users u ON fr.created_by = u.id
       ORDER BY fr.created_at DESC`
    );
    return rows as FinishingRecipeRecord[];
  }

  async findById(id: string): Promise<FinishingRecipeRecord | null> {
    const [recipes] = await pool.query(
      `SELECT fr.*, u.full_name as user_name 
       FROM finishing_recipes fr 
       LEFT JOIN users u ON fr.created_by = u.id
       WHERE fr.id = ?`,
      [id]
    );
    const recipe = (recipes as FinishingRecipeRecord[])[0];
    if (!recipe) return null;

    const [steps] = await pool.query(
      `SELECT * FROM finishing_recipe_steps WHERE recipe_id = ? ORDER BY step_no ASC`,
      [id]
    );
    recipe.steps = steps as RecipeStepRecord[];
    return recipe;
  }

  async create(recipe: {
    itemCode: string;
    finishCode: string;
    itemDescription?: string;
    createdOn: string;
    buyerCode?: string;
    glossLevel?: string;
    woodType?: string;
    swatchImage?: string;
    createdBy: string;
  }, steps: {
    stepNo: number;
    processMaterial?: string;
    toolMachine?: string;
    gritQuantity?: string;
    dryingTime?: string;
    notes?: string;
    noOfCoats?: string;
  }[]): Promise<FinishingRecipeRecord> {
    const id = uuid();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO finishing_recipes (id, item_code, finish_code, item_description, created_on, buyer_code, gloss_level, wood_type, swatch_image, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          recipe.itemCode,
          recipe.finishCode,
          recipe.itemDescription || null,
          recipe.createdOn,
          recipe.buyerCode || null,
          recipe.glossLevel || null,
          recipe.woodType || null,
          recipe.swatchImage || null,
          recipe.createdBy,
        ]
      );

      for (const step of steps) {
        const stepId = uuid();
        await conn.query(
          `INSERT INTO finishing_recipe_steps (id, recipe_id, step_no, process_material, tool_machine, grit_quantity, drying_time, notes, no_of_coats)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            stepId,
            id,
            step.stepNo,
            step.processMaterial || null,
            step.toolMachine || null,
            step.gritQuantity || null,
            step.dryingTime || null,
            step.notes || null,
            step.noOfCoats || null,
          ]
        );
      }

      await conn.commit();
      
      const created = await this.findById(id);
      if (!created) throw new Error("Failed to retrieve created recipe");
      return created;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
