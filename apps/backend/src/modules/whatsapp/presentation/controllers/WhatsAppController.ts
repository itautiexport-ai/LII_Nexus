import { Response } from "express";
import { whatsappBot } from "../../application/services/WhatsAppBotService";
import { ok } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import * as QRCode from "qrcode";

export const WhatsAppController = {
  async getStatus(req: AuthenticatedRequest, res: Response) {
    const status = whatsappBot.getStatus();
    
    let qrDataUrl = null;
    if (status.qrCode) {
      try {
        qrDataUrl = await QRCode.toDataURL(status.qrCode);
      } catch (err) {
        console.error("Failed to generate QR data URL", err);
      }
    }
    
    return ok(res, {
      status: status.status,
      qrCodeDataUrl: qrDataUrl,
    });
  },

  async logout(req: AuthenticatedRequest, res: Response) {
    await whatsappBot.logout();
    return ok(res, { message: "Logged out successfully" });
  }
};
