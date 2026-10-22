import { Request, Response } from "express";
import crypto from "crypto";
import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";

export class CatalogueShareController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService(new MySqlNotificationRepository());
  }

  createSharedDeck = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    const {
      title = "Curated Product Showcase",
      customerName = "",
      themeId = "obsidian",
      includePricing = true,
      products = [],
    } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, error: { message: "At least one product is required to generate a presentation deck." } });
    }

    // Lookup user's name
    let creatorName = "Team Member";
    try {
      const [uRows] = await pool.query<any[]>("SELECT full_name FROM users WHERE id = ?", [userId]);
      if (uRows.length > 0 && uRows[0].full_name) {
        creatorName = uRows[0].full_name;
      }
    } catch {
      // fallback
    }

    const id = uuid();
    const token = crypto.randomBytes(16).toString("hex");

    await pool.query(
      `INSERT INTO catalogue_shared_decks 
       (id, token, title, customer_name, theme_id, include_pricing, products_json, created_by_user_id, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        token,
        title,
        customerName.trim(),
        themeId,
        includePricing ? 1 : 0,
        JSON.stringify(products),
        userId,
        creatorName,
      ]
    );

    return res.status(201).json({
      success: true,
      data: {
        id,
        token,
        title,
        customerName: customerName.trim(),
        themeId,
        includePricing: Boolean(includePricing),
        shareUrl: `/view-deck/${token}`,
        createdByName: creatorName,
        createdAt: new Date(),
      },
    });
  };

  getSharedDeckByToken = async (req: Request, res: Response) => {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, error: { message: "Token is required." } });
    }

    const [rows] = await pool.query<any[]>(
      `SELECT id, token, title, customer_name, theme_id, include_pricing, products_json, 
              created_by_user_id, created_by_name, view_count, last_viewed_at, created_at
       FROM catalogue_shared_decks 
       WHERE token = ?`,
      [token]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: "Presentation deck not found or link has expired." } });
    }

    const deck = rows[0];
    let parsedProducts = [];
    try {
      parsedProducts = JSON.parse(deck.products_json || "[]");
    } catch {
      parsedProducts = [];
    }

    return res.json({
      success: true,
      data: {
        id: deck.id,
        token: deck.token,
        title: deck.title,
        customerName: deck.customer_name,
        themeId: deck.theme_id,
        includePricing: Boolean(deck.include_pricing),
        products: parsedProducts,
        createdByName: deck.created_by_name,
        viewCount: deck.view_count,
        lastViewedAt: deck.last_viewed_at,
        createdAt: deck.created_at,
      },
    });
  };

  recordDeckView = async (req: Request, res: Response) => {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, error: { message: "Token is required." } });
    }

    const [rows] = await pool.query<any[]>(
      `SELECT id, token, title, customer_name, created_by_user_id, created_by_name, view_count
       FROM catalogue_shared_decks 
       WHERE token = ?`,
      [token]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: "Deck not found." } });
    }

    const deck = rows[0];
    const newViewCount = (deck.view_count || 0) + 1;
    const now = new Date();

    // Update view count and last viewed timestamp
    await pool.query(
      `UPDATE catalogue_shared_decks SET view_count = view_count + 1, last_viewed_at = ? WHERE id = ?`,
      [now, deck.id]
    );

    // Record view log
    const viewerIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null;
    const userAgent = req.headers["user-agent"] || null;

    try {
      await pool.query(
        `INSERT INTO catalogue_deck_views (id, deck_id, viewer_ip, user_agent, viewed_at)
         VALUES (?, ?, ?, ?, ?)`,
        [uuid(), deck.id, viewerIp ? viewerIp.slice(0, 64) : null, userAgent ? userAgent.slice(0, 500) : null, now]
      );
    } catch (e) {
      console.warn("Failed to insert into catalogue_deck_views:", e);
    }

    // Trigger in-app notification to the deck's creator
    try {
      const buyerInfo = deck.customer_name ? `Buyer "${deck.customer_name}"` : "A buyer";
      await this.notificationService.notify({
        type: "catalogue_deck_viewed" as any,
        module: "crm",
        referenceType: "catalogue_deck",
        referenceId: deck.id,
        title: `👀 Buyer Opened Presentation: ${deck.customer_name ? deck.customer_name + " - " : ""}${deck.title}`,
        description: `${buyerInfo} just opened your shared presentation link. (Total views: ${newViewCount})`,
        priority: "high",
        assignedUserId: deck.created_by_user_id,
        actionLabel: "View Presentation",
        actionUrl: `/view-deck/${deck.token}`,
      });
    } catch (err) {
      console.error("Failed to send deck view notification:", err);
    }

    return res.json({
      success: true,
      data: {
        viewCount: newViewCount,
        lastViewedAt: now,
      },
    });
  };

  getMySharedDecks = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    const [rows] = await pool.query<any[]>(
      `SELECT id, token, title, customer_name, theme_id, include_pricing,
              view_count, last_viewed_at, created_at
       FROM catalogue_shared_decks 
       WHERE created_by_user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        token: r.token,
        title: r.title,
        customerName: r.customer_name,
        themeId: r.theme_id,
        includePricing: Boolean(r.include_pricing),
        shareUrl: `/view-deck/${r.token}`,
        viewCount: r.view_count,
        lastViewedAt: r.last_viewed_at,
        createdAt: r.created_at,
      })),
    });
  };
}
