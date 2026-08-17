import { Request, Response } from "express";
import { FinishingRecipeService } from "../../application/services/FinishingRecipeService";
import { createFinishingRecipeSchema, updateFinishingRecipeSchema } from "../../application/dto/finishing-recipe.dto";

export class FinishingRecipeController {
  private service: FinishingRecipeService;

  constructor() {
    this.service = new FinishingRecipeService();
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = createFinishingRecipeSchema.parse(req.body);
      const recipe = await this.service.createRecipe(validatedData);
      res.status(201).json(recipe);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: "Validation Error", details: error.errors });
      } else {
        console.error("Error creating finishing recipe:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const recipes = await this.service.getAllRecipes();
      res.status(200).json(recipes);
    } catch (error) {
      console.error("Error fetching finishing recipes:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const recipe = await this.service.getRecipeById(id);
      if (!recipe) {
        res.status(404).json({ error: "Finishing Recipe not found" });
        return;
      }
      res.status(200).json(recipe);
    } catch (error) {
      console.error("Error fetching finishing recipe:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = updateFinishingRecipeSchema.parse(req.body);
      const recipe = await this.service.updateRecipe(id, validatedData);
      
      if (!recipe) {
        res.status(404).json({ error: "Finishing Recipe not found" });
        return;
      }
      
      res.status(200).json(recipe);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: "Validation Error", details: error.errors });
      } else {
        console.error("Error updating finishing recipe:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

  deleteBulk = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: "Validation Error", details: "Ids array is required and must not be empty." });
        return;
      }
      
      await this.service.deleteBulkRecipes(ids);
      res.status(200).json({ success: true, message: "Recipes deleted successfully" });
    } catch (error) {
      console.error("Error deleting bulk finishing recipes:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
