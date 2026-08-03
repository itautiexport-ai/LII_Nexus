import { axiosInstance } from "../../../../services/api/axiosInstance";

export const whatsappApi = {
  async getStatus() {
    const res = await axiosInstance.get("/whatsapp/status");
    return res.data.data as { status: "disconnected" | "qr" | "connected" | "authenticating", qrCodeDataUrl: string | null };
  },

  async logout() {
    const res = await axiosInstance.post("/whatsapp/logout");
    return res.data.data;
  }
};
