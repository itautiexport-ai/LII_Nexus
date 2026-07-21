"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const WhatsAppBotService_1 = require("../../application/services/WhatsAppBotService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const QRCode = __importStar(require("qrcode"));
exports.WhatsAppController = {
    async getStatus(req, res) {
        const status = WhatsAppBotService_1.whatsappBot.getStatus();
        let qrDataUrl = null;
        if (status.qrCode) {
            try {
                qrDataUrl = await QRCode.toDataURL(status.qrCode);
            }
            catch (err) {
                console.error("Failed to generate QR data URL", err);
            }
        }
        return (0, apiResponse_1.ok)(res, {
            status: status.status,
            qrCodeDataUrl: qrDataUrl,
        });
    },
    async logout(req, res) {
        await WhatsAppBotService_1.whatsappBot.logout();
        return (0, apiResponse_1.ok)(res, { message: "Logged out successfully" });
    }
};
//# sourceMappingURL=WhatsAppController.js.map