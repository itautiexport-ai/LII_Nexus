import { axiosInstance } from "../../../../services/api/axiosInstance";

export interface PptMasterTheme {
  id: string;
  name: string;
  tagline?: string;
  badge?: string;
  primary_color: string;
  accent_color: string;
  card_bg: string;
  text_color: string;
  is_dark: boolean | number;
  bg_image_url?: string;
  theme_config_json?: string;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface PptFrontPage {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  overlay_text: boolean | number;
  text_theme: "light" | "dark";
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export const pptMasterApi = {
  // PPT Master Themes
  async getThemes(): Promise<PptMasterTheme[]> {
    const res = await axiosInstance.get("/ppt-themes");
    return res.data.data;
  },

  async createTheme(data: {
    name: string;
    tagline?: string;
    badge?: string;
    primaryColor: string;
    accentColor: string;
    cardBg: string;
    textColor: string;
    isDark?: boolean;
    bgImageUrl?: string;
  }): Promise<PptMasterTheme> {
    const res = await axiosInstance.post("/ppt-themes", data);
    return res.data.data;
  },

  async updateTheme(
    id: string,
    data: {
      name?: string;
      tagline?: string;
      badge?: string;
      primaryColor?: string;
      accentColor?: string;
      cardBg?: string;
      textColor?: string;
      isDark?: boolean;
      bgImageUrl?: string;
    }
  ): Promise<PptMasterTheme> {
    const res = await axiosInstance.put(`/ppt-themes/${id}`, data);
    return res.data.data;
  },

  async deleteTheme(id: string): Promise<void> {
    await axiosInstance.delete(`/ppt-themes/${id}`);
  },

  // PPT Front Pages / Cover Slides
  async getFrontPages(): Promise<PptFrontPage[]> {
    const res = await axiosInstance.get("/ppt-front-pages");
    return res.data.data;
  },

  async createFrontPage(formData: FormData): Promise<PptFrontPage> {
    const res = await axiosInstance.post("/ppt-front-pages", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  async updateFrontPage(id: string, formData: FormData): Promise<PptFrontPage> {
    const res = await axiosInstance.put(`/ppt-front-pages/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  async deleteFrontPage(id: string): Promise<void> {
    await axiosInstance.delete(`/ppt-front-pages/${id}`);
  },
};
