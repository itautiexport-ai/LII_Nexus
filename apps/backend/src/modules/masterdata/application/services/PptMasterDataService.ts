import { v4 as uuidv4 } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";

export interface PptThemeRecord {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  primary_color: string;
  accent_color: string;
  card_bg: string;
  text_color: string;
  is_dark: number;
  bg_image_url: string | null;
  theme_config_json: string | null;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface PptFrontPageRecord {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  overlay_text: number;
  text_theme: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export class PptMasterDataService {
  // ==========================================
  // PPT THEMES
  // ==========================================
  async getThemes(): Promise<PptThemeRecord[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM ppt_master_themes WHERE is_active = 1 ORDER BY created_at DESC"
    );
    return rows;
  }

  async getThemeById(id: string): Promise<PptThemeRecord | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM ppt_master_themes WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async createTheme(data: Partial<PptThemeRecord>): Promise<PptThemeRecord> {
    const id = uuidv4();
    const name = data.name || "Custom Theme";
    const tagline = data.tagline || "";
    const badge = data.badge || "CUSTOM THEME";
    const primaryColor = (data.primary_color || "0F172A").replace("#", "");
    const accentColor = (data.accent_color || "F59E0B").replace("#", "");
    const cardBg = (data.card_bg || "1E293B").replace("#", "");
    const textColor = (data.text_color || "FFFFFF").replace("#", "");
    const isDark = data.is_dark !== undefined ? (data.is_dark ? 1 : 0) : 1;
    const bgImageUrl = data.bg_image_url || null;
    const themeConfigJson = data.theme_config_json || null;

    await pool.query(
      `INSERT INTO ppt_master_themes
        (id, name, tagline, badge, primary_color, accent_color, card_bg, text_color, is_dark, bg_image_url, theme_config_json, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        name,
        tagline,
        badge,
        primaryColor,
        accentColor,
        cardBg,
        textColor,
        isDark,
        bgImageUrl,
        themeConfigJson,
      ]
    );

    const created = await this.getThemeById(id);
    return created!;
  }

  async updateTheme(id: string, data: Partial<PptThemeRecord>): Promise<PptThemeRecord | null> {
    const existing = await this.getThemeById(id);
    if (!existing) return null;

    const name = data.name !== undefined ? data.name : existing.name;
    const tagline = data.tagline !== undefined ? data.tagline : existing.tagline;
    const badge = data.badge !== undefined ? data.badge : existing.badge;
    const primaryColor = data.primary_color !== undefined ? data.primary_color.replace("#", "") : existing.primary_color;
    const accentColor = data.accent_color !== undefined ? data.accent_color.replace("#", "") : existing.accent_color;
    const cardBg = data.card_bg !== undefined ? data.card_bg.replace("#", "") : existing.card_bg;
    const textColor = data.text_color !== undefined ? data.text_color.replace("#", "") : existing.text_color;
    const isDark = data.is_dark !== undefined ? (data.is_dark ? 1 : 0) : existing.is_dark;
    const bgImageUrl = data.bg_image_url !== undefined ? data.bg_image_url : existing.bg_image_url;
    const themeConfigJson = data.theme_config_json !== undefined ? data.theme_config_json : existing.theme_config_json;

    await pool.query(
      `UPDATE ppt_master_themes
       SET name = ?, tagline = ?, badge = ?, primary_color = ?, accent_color = ?,
           card_bg = ?, text_color = ?, is_dark = ?, bg_image_url = ?, theme_config_json = ?
       WHERE id = ?`,
      [
        name,
        tagline,
        badge,
        primaryColor,
        accentColor,
        cardBg,
        textColor,
        isDark,
        bgImageUrl,
        themeConfigJson,
        id,
      ]
    );

    return this.getThemeById(id);
  }

  async deleteTheme(id: string): Promise<boolean> {
    await pool.query("UPDATE ppt_master_themes SET is_active = 0 WHERE id = ?", [id]);
    return true;
  }

  // ==========================================
  // FRONT PAGES / COVER TEMPLATES
  // ==========================================
  async getFrontPages(): Promise<PptFrontPageRecord[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM ppt_front_pages WHERE is_active = 1 ORDER BY created_at DESC"
    );
    return rows;
  }

  async getFrontPageById(id: string): Promise<PptFrontPageRecord | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM ppt_front_pages WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async createFrontPage(data: Partial<PptFrontPageRecord>): Promise<PptFrontPageRecord> {
    const id = uuidv4();
    const title = data.title || "Custom Front Page";
    const description = data.description || "";
    const imageUrl = data.image_url || "";
    const thumbnailUrl = data.thumbnail_url || imageUrl;
    const overlayText = data.overlay_text !== undefined ? (data.overlay_text ? 1 : 0) : 1;
    const textTheme = data.text_theme || "light";

    await pool.query(
      `INSERT INTO ppt_front_pages
        (id, title, description, image_url, thumbnail_url, overlay_text, text_theme, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, title, description, imageUrl, thumbnailUrl, overlayText, textTheme]
    );

    const created = await this.getFrontPageById(id);
    return created!;
  }

  async updateFrontPage(id: string, data: Partial<PptFrontPageRecord>): Promise<PptFrontPageRecord | null> {
    const existing = await this.getFrontPageById(id);
    if (!existing) return null;

    const title = data.title !== undefined ? data.title : existing.title;
    const description = data.description !== undefined ? data.description : existing.description;
    const imageUrl = data.image_url !== undefined ? data.image_url : existing.image_url;
    const thumbnailUrl = data.thumbnail_url !== undefined ? data.thumbnail_url : (imageUrl || existing.thumbnail_url);
    const overlayText = data.overlay_text !== undefined ? (data.overlay_text ? 1 : 0) : existing.overlay_text;
    const textTheme = data.text_theme !== undefined ? data.text_theme : existing.text_theme;

    await pool.query(
      `UPDATE ppt_front_pages
       SET title = ?, description = ?, image_url = ?, thumbnail_url = ?, overlay_text = ?, text_theme = ?
       WHERE id = ?`,
      [title, description, imageUrl, thumbnailUrl, overlayText, textTheme, id]
    );

    return this.getFrontPageById(id);
  }

  async deleteFrontPage(id: string): Promise<boolean> {
    await pool.query("UPDATE ppt_front_pages SET is_active = 0 WHERE id = ?", [id]);
    return true;
  }
}
