import axios from "axios";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { env } from "../../../config/env";
import { CatalogProductItem } from "../utils/pptxExport";

export interface CreateDeckPayload {
  title: string;
  customerName?: string;
  themeId: string;
  includePricing: boolean;
  products: CatalogProductItem[];
}

export interface SharedDeckData {
  id: string;
  token: string;
  title: string;
  customerName: string;
  themeId: string;
  includePricing: boolean;
  products: CatalogProductItem[];
  createdByName?: string;
  viewCount: number;
  lastViewedAt?: string | null;
  createdAt: string;
  shareUrl?: string;
}

export const catalogueShareApi = {
  async createSharedDeck(payload: CreateDeckPayload): Promise<SharedDeckData> {
    const res = await axiosInstance.post("/catalogue/share-deck", payload);
    return res.data.data;
  },

  async getSharedDeckByToken(token: string): Promise<SharedDeckData> {
    // Direct axios call to avoid auth interceptor issues for buyers
    const res = await axios.get(`${env.apiBaseUrl}/catalogue/shared-decks/${token}`);
    return res.data.data;
  },

  async recordDeckView(token: string): Promise<{ viewCount: number; lastViewedAt: string }> {
    const res = await axios.post(`${env.apiBaseUrl}/catalogue/shared-decks/${token}/view`, {});
    return res.data.data;
  },

  async getMySharedDecks(): Promise<SharedDeckData[]> {
    const res = await axiosInstance.get("/catalogue/my-shared-decks");
    return res.data.data;
  },
};
