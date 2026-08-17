import { FinishingRecipe, FinishingRecipeStep } from "../../domain/entities/FinishingRecipe";
import { MySqlFinishingRecipeRepository } from "../../infrastructure/repositories/MySqlFinishingRecipeRepository";
import { v4 as uuidv4 } from "uuid";

export class FinishingRecipeService {
  private repository: MySqlFinishingRecipeRepository;

  constructor() {
    this.repository = new MySqlFinishingRecipeRepository();
  }

  async createRecipe(data: any): Promise<FinishingRecipe> {
    const id = uuidv4();
    const steps = (data.steps || []).map((step: any, index: number) => {
      return new FinishingRecipeStep(
        uuidv4(),
        id,
        index + 1,
        step.processMaterial || "",
        step.toolMachine || "",
        step.gritQuantity || "",
        step.dryingTime || "",
        step.notes || "",
        step.noOfCoats || ""
      );
    });

    const recipe = new FinishingRecipe(
      id,
      data.itemCode,
      data.finishCode,
      data.itemDescription,
      data.createdOn,
      data.buyerCode || "",
      data.glossLevel || "",
      data.woodType || "",
      steps
    );

    await this.repository.save(recipe);
    return recipe;
  }

  async getAllRecipes(): Promise<FinishingRecipe[]> {
    return await this.repository.findAll();
  }

  async getRecipeById(id: string): Promise<FinishingRecipe | null> {
    return await this.repository.findById(id);
  }

  async updateRecipe(id: string, data: any): Promise<FinishingRecipe | null> {
    const existingRecipe = await this.repository.findById(id);
    if (!existingRecipe) {
      return null;
    }

    const steps = (data.steps || []).map((step: any, index: number) => {
      return new FinishingRecipeStep(
        step.id || uuidv4(),
        id,
        index + 1,
        step.processMaterial || "",
        step.toolMachine || "",
        step.gritQuantity || "",
        step.dryingTime || "",
        step.notes || "",
        step.noOfCoats || ""
      );
    });

    const recipe = new FinishingRecipe(
      id,
      data.itemCode,
      data.finishCode,
      data.itemDescription,
      data.createdOn,
      data.buyerCode || "",
      data.glossLevel || "",
      data.woodType || "",
      steps
    );

    await this.repository.update(recipe);
    return recipe;
  }

  async deleteBulkRecipes(ids: string[]): Promise<void> {
    await this.repository.deleteBulk(ids);
  }
}
