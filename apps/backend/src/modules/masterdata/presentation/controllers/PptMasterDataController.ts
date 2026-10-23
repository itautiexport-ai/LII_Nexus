import { Request, Response } from "express";
import { PptMasterDataService } from "../../application/services/PptMasterDataService";
import { ok, badRequest, notFound } from "../../../../shared/utils/apiResponse";

export class PptMasterDataController {
  constructor(private readonly service: PptMasterDataService) {}

  // ==========================================
  // PPT THEMES
  // ==========================================
  async getThemes(_req: Request, res: Response) {
    const data = await this.service.getThemes();
    return ok(res, data);
  }

  async createTheme(req: Request, res: Response) {
    const { name, tagline, badge, primaryColor, accentColor, cardBg, textColor, isDark, bgImageUrl, themeConfigJson } = req.body;
    if (!name) {
      return badRequest(res, "Theme name is required.");
    }

    const created = await this.service.createTheme({
      name,
      tagline: tagline || "",
      badge: badge || "CUSTOM THEME",
      primary_color: primaryColor,
      accent_color: accentColor,
      card_bg: cardBg,
      text_color: textColor,
      is_dark: isDark !== undefined ? (isDark ? 1 : 0) : 1,
      bg_image_url: bgImageUrl,
      theme_config_json: typeof themeConfigJson === "object" ? JSON.stringify(themeConfigJson) : themeConfigJson,
    });

    return ok(res, created);
  }

  async updateTheme(req: Request, res: Response) {
    const { id } = req.params;
    const { name, tagline, badge, primaryColor, accentColor, cardBg, textColor, isDark, bgImageUrl, themeConfigJson } = req.body;

    const updated = await this.service.updateTheme(id, {
      name,
      tagline,
      badge,
      primary_color: primaryColor,
      accent_color: accentColor,
      card_bg: cardBg,
      text_color: textColor,
      is_dark: isDark !== undefined ? (isDark ? 1 : 0) : undefined,
      bg_image_url: bgImageUrl,
      theme_config_json: typeof themeConfigJson === "object" ? JSON.stringify(themeConfigJson) : themeConfigJson,
    });

    if (!updated) {
      return notFound(res, "PPT Theme not found.");
    }

    return ok(res, updated);
  }

  async deleteTheme(req: Request, res: Response) {
    const { id } = req.params;
    await this.service.deleteTheme(id);
    return ok(res, { success: true, message: "Theme removed successfully" });
  }

  // ==========================================
  // FRONT PAGES / COVER TEMPLATES
  // ==========================================
  async getFrontPages(_req: Request, res: Response) {
    const data = await this.service.getFrontPages();
    return ok(res, data);
  }

  async createFrontPage(req: Request, res: Response) {
    // If uploaded via file
    let imageUrl = req.body.imageUrl || req.body.image_url;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    if (!imageUrl) {
      return badRequest(res, "Front page image is required (upload file or provide imageUrl).");
    }

    const { title, description, overlayText, textTheme, thumbnailUrl } = req.body;

    const created = await this.service.createFrontPage({
      title: title || "Custom Cover Page",
      description: description || "",
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl || imageUrl,
      overlay_text: overlayText !== undefined ? (overlayText ? 1 : 0) : 1,
      text_theme: textTheme || "light",
    });

    return ok(res, created);
  }

  async updateFrontPage(req: Request, res: Response) {
    const { id } = req.params;
    let imageUrl = req.body.imageUrl || req.body.image_url;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const { title, description, overlayText, textTheme, thumbnailUrl } = req.body;

    const updated = await this.service.updateFrontPage(id, {
      title,
      description,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      overlay_text: overlayText !== undefined ? (overlayText ? 1 : 0) : undefined,
      text_theme: textTheme,
    });

    if (!updated) {
      return notFound(res, "Front page template not found.");
    }

    return ok(res, updated);
  }

  async deleteFrontPage(req: Request, res: Response) {
    const { id } = req.params;
    await this.service.deleteFrontPage(id);
    return ok(res, { success: true, message: "Front page template removed successfully" });
  }
}
