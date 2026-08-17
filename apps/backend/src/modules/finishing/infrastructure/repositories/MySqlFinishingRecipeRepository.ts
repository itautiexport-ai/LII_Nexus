import { pool } from "../../../../infrastructure/database/mysql/connection";
import { FinishingRecipe, FinishingRecipeStep } from "../../domain/entities/FinishingRecipe";
import { v4 as uuidv4 } from "uuid";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export class MySqlFinishingRecipeRepository {
  async save(recipe: FinishingRecipe): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const insertRecipeQuery = `
        INSERT INTO finishing_recipes 
        (id, item_code, finish_code, item_description, created_on, buyer_code, gloss_level, wood_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await conn.execute(insertRecipeQuery, [
        recipe.id,
        recipe.itemCode,
        recipe.finishCode,
        recipe.itemDescription,
        recipe.createdOn,
        recipe.buyerCode,
        recipe.glossLevel,
        recipe.woodType
      ]);

      if (recipe.steps && recipe.steps.length > 0) {
        const insertStepQuery = `
          INSERT INTO finishing_recipe_steps 
          (id, recipe_id, step_no, process_material, tool_machine, grit_quantity, drying_time, notes, no_of_coats)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        for (const step of recipe.steps) {
          await conn.execute(insertStepQuery, [
            step.id,
            recipe.id,
            step.stepNo,
            step.processMaterial,
            step.toolMachine,
            step.gritQuantity,
            step.dryingTime,
            step.notes,
            step.noOfCoats
          ]);
        }
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async findAll(): Promise<FinishingRecipe[]> {
    const query = `
      SELECT id, item_code, finish_code, item_description, DATE_FORMAT(created_on, '%Y-%m-%d') as created_on, buyer_code, gloss_level, wood_type, created_at, updated_at
      FROM finishing_recipes
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    
    return rows.map(row => new FinishingRecipe(
      row.id,
      row.item_code,
      row.finish_code,
      row.item_description,
      row.created_on,
      row.buyer_code,
      row.gloss_level,
      row.wood_type,
      [],
      row.created_at,
      row.updated_at
    ));
  }

  async findById(id: string): Promise<FinishingRecipe | null> {
    const query = `
      SELECT id, item_code, finish_code, item_description, DATE_FORMAT(created_on, '%Y-%m-%d') as created_on, buyer_code, gloss_level, wood_type, created_at, updated_at
      FROM finishing_recipes
      WHERE id = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    
    if (rows.length === 0) return null;

    const row = rows[0];
    const stepsQuery = `
      SELECT id, recipe_id, step_no, process_material, tool_machine, grit_quantity, drying_time, notes, no_of_coats, created_at
      FROM finishing_recipe_steps
      WHERE recipe_id = ?
      ORDER BY step_no ASC
    `;
    const [stepRows] = await pool.query<RowDataPacket[]>(stepsQuery, [id]);

    const steps = stepRows.map(s => new FinishingRecipeStep(
      s.id,
      s.recipe_id,
      s.step_no,
      s.process_material,
      s.tool_machine,
      s.grit_quantity,
      s.drying_time,
      s.notes,
      s.no_of_coats,
      s.created_at
    ));

    return new FinishingRecipe(
      row.id,
      row.item_code,
      row.finish_code,
      row.item_description,
      row.created_on,
      row.buyer_code,
      row.gloss_level,
      row.wood_type,
      steps,
      row.created_at,
      row.updated_at
    );
  }

  async update(recipe: FinishingRecipe): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const updateRecipeQuery = `
        UPDATE finishing_recipes 
        SET item_code = ?, finish_code = ?, item_description = ?, created_on = ?, buyer_code = ?, gloss_level = ?, wood_type = ?
        WHERE id = ?
      `;
      await conn.execute(updateRecipeQuery, [
        recipe.itemCode,
        recipe.finishCode,
        recipe.itemDescription,
        recipe.createdOn,
        recipe.buyerCode,
        recipe.glossLevel,
        recipe.woodType,
        recipe.id
      ]);

      // Delete existing steps
      const deleteStepsQuery = `DELETE FROM finishing_recipe_steps WHERE recipe_id = ?`;
      await conn.execute(deleteStepsQuery, [recipe.id]);

      // Insert new steps
      if (recipe.steps && recipe.steps.length > 0) {
        const insertStepQuery = `
          INSERT INTO finishing_recipe_steps 
          (id, recipe_id, step_no, process_material, tool_machine, grit_quantity, drying_time, notes, no_of_coats)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        for (const step of recipe.steps) {
          await conn.execute(insertStepQuery, [
            step.id,
            recipe.id,
            step.stepNo,
            step.processMaterial,
            step.toolMachine,
            step.gritQuantity,
            step.dryingTime,
            step.notes,
            step.noOfCoats
          ]);
        }
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async deleteBulk(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const placeholders = ids.map(() => '?').join(',');
      
      // Delete steps first
      const deleteStepsQuery = `DELETE FROM finishing_recipe_steps WHERE recipe_id IN (${placeholders})`;
      await conn.execute(deleteStepsQuery, ids);
      
      // Delete recipes
      const deleteRecipesQuery = `DELETE FROM finishing_recipes WHERE id IN (${placeholders})`;
      await conn.execute(deleteRecipesQuery, ids);

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}
