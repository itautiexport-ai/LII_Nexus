import { axiosInstance as api } from "../../../services/api/axiosInstance";

export interface RecipeStep {
  id?: string;
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
  created_by: string;
  user_name?: string;
  created_at: string;
  steps?: RecipeStep[];
}

export const finishingRecipeApi = {
  getAll: async (): Promise<FinishingRecipeRecord[]> => {
    const res = await api.get("/finishing-recipes");
    return res.data.data;
  },
  getById: async (id: string): Promise<FinishingRecipeRecord> => {
    const res = await api.get(`/finishing-recipes/${id}`);
    return res.data.data;
  },
  create: async (data: {
    itemCode: string;
    finishCode: string;
    itemDescription?: string;
    createdOn: string;
    buyerCode?: string;
    glossLevel?: string;
    woodType?: string;
    swatchImage?: string;
    steps: {
      stepNo: number;
      processMaterial?: string;
      toolMachine?: string;
      gritQuantity?: string;
      dryingTime?: string;
      notes?: string;
      noOfCoats?: string;
    }[];
  }): Promise<FinishingRecipeRecord> => {
    const res = await api.post("/finishing-recipes", data);
    return res.data.data;
  }
};
