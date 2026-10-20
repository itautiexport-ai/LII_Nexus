import { axiosInstance as api } from "../../../services/api/axiosInstance";
import { RecipeStep } from "./finishingRecipeApi";

export interface FinishingLibraryItem {
  id: string;
  buyer_name: string;
  buyer_code: string | null;
  finish_recipe_code: string;
  recipe_id: string | null;
  photos: string[];
  remarks: string | null;
  created_by: string;
  user_name?: string;
  created_at: string;
  updated_at: string;
  item_code?: string;
  item_description?: string;
  gloss_level?: string;
  wood_type?: string;
  recipe_swatch_image?: string;
  recipe_steps?: RecipeStep[];
}

export const finishingLibraryApi = {
  getAll: async (): Promise<FinishingLibraryItem[]> => {
    const res = await api.get("/finishing-library");
    return res.data.data;
  },
  getById: async (id: string): Promise<FinishingLibraryItem> => {
    const res = await api.get(`/finishing-library/${id}`);
    return res.data.data;
  },
  create: async (data: {
    buyerName: string;
    buyerCode?: string;
    finishRecipeCode: string;
    recipeId?: string;
    photos: string[];
    remarks?: string;
  }): Promise<FinishingLibraryItem> => {
    const res = await api.post("/finishing-library", data);
    return res.data.data;
  },
  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/finishing-library/${id}`);
    return res.data;
  }
};
