import { axiosInstance as api } from "../../../services/api/axiosInstance";

export interface FinishingRecipeStep {
  id?: string;
  stepNo: number;
  processMaterial: string;
  toolMachine: string;
  gritQuantity: string;
  dryingTime: string;
  notes: string;
  noOfCoats: string;
}

export interface FinishingRecipe {
  id?: string;
  itemCode: string;
  finishCode: string;
  itemDescription: string;
  createdOn: string;
  buyerCode: string;
  glossLevel: string;
  woodType: string;
  steps: FinishingRecipeStep[];
  createdAt?: string;
  updatedAt?: string;
}

export const finishingApi = {
  createRecipe: async (data: Omit<FinishingRecipe, "id">): Promise<FinishingRecipe> => {
    const response = await api.post("/finishing-recipes", data);
    return response.data;
  },

  getAllRecipes: async (): Promise<FinishingRecipe[]> => {
    const response = await api.get("/finishing-recipes");
    return response.data;
  },

  getRecipeById: async (id: string): Promise<FinishingRecipe> => {
    const response = await api.get(`/finishing-recipes/${id}`);
    return response.data;
  },

  updateRecipe: async (id: string, data: Omit<FinishingRecipe, "id">): Promise<FinishingRecipe> => {
    const response = await api.put(`/finishing-recipes/${id}`, data);
    return response.data;
  },

  deleteBulkRecipes: async (ids: string[]): Promise<void> => {
    await api.delete("/finishing-recipes/bulk", { data: { ids } });
  },
};
