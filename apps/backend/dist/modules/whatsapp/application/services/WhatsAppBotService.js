"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappBot = exports.WhatsAppBotService = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
class WhatsAppBotService {
    constructor() {
        this.client = null;
        this.qrCode = null;
        this.status = "disconnected";
    }
    async initialize() {
        console.log("[WhatsAppBotService] Initializing client...");
        // LocalAuth saves the session so you don't have to scan every time
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth({ dataPath: ".wwebjs_auth" }),
            puppeteer: {
                executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            },
        });
        this.client.on("qr", (qr) => {
            console.log("[WhatsAppBotService] QR Code received. Awaiting scan.");
            this.qrCode = qr;
            this.status = "qr";
        });
        this.client.on("ready", () => {
            console.log("[WhatsAppBotService] Client is ready!");
            this.status = "connected";
            this.qrCode = null;
        });
        this.client.on("authenticated", () => {
            console.log("[WhatsAppBotService] Authenticated.");
            this.status = "authenticating";
        });
        this.client.on("disconnected", (reason) => {
            console.log("[WhatsAppBotService] Client was disconnected:", reason);
            this.status = "disconnected";
            this.qrCode = null;
            // Restart client automatically
            this.client?.initialize();
        });
        try {
            await this.client.initialize();
        }
        catch (err) {
            console.error("[WhatsAppBotService] Failed to initialize:", err);
        }
    }
    getStatus() {
        return {
            status: this.status,
            qrCode: this.qrCode,
        };
    }
    async logout() {
        if (this.client) {
            console.log("[WhatsAppBotService] Logging out...");
            try {
                await this.client.logout();
            }
            catch (err) {
                console.error("Logout error", err);
            }
            this.status = "disconnected";
            this.qrCode = null;
        }
    }
    async sendMessage(numberStr, message) {
        if (this.status !== "connected" || !this.client) {
            console.warn("[WhatsAppBotService] Cannot send message, client not connected.");
            return;
        }
        // Normalize number: remove all non-digits
        const cleanNumber = numberStr.replace(/\D/g, "");
        if (!cleanNumber)
            return;
        const chatId = `${cleanNumber}@c.us`;
        try {
            await this.client.sendMessage(chatId, message);
            console.log(`[WhatsAppBotService] Sent message to ${chatId}`);
        }
        catch (err) {
            console.error(`[WhatsAppBotService] Error sending message to ${chatId}:`, err);
        }
    }
}
exports.WhatsAppBotService = WhatsAppBotService;
exports.whatsappBot = new WhatsAppBotService();
//# sourceMappingURL=WhatsAppBotService.js.map