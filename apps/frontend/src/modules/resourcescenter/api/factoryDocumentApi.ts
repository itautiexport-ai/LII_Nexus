import { axiosInstance } from "../../../services/api/axiosInstance";

export interface FactoryRecord {
  id: string;
  name: string;
  code?: string;
  status: "active" | "inactive";
}

export interface FactoryDocumentRecord {
  id: string;
  factoryId: string;
  factoryName: string;
  documentName: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  description?: string;
  expiryDate?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export const factoryDocumentApi = {
  async getFactories(): Promise<FactoryRecord[]> {
    const res = await axiosInstance.get("/factories");
    return res.data.data;
  },

  async listDocuments(params?: {
    factoryId?: string;
    factoryName?: string;
    search?: string;
    status?: string;
  }): Promise<FactoryDocumentRecord[]> {
    const res = await axiosInstance.get("/factory-documents", { params });
    return res.data.data;
  },

  async getDocumentById(id: string): Promise<FactoryDocumentRecord> {
    const res = await axiosInstance.get(`/factory-documents/${id}`);
    return res.data.data;
  },

  async uploadFile(file: File): Promise<{
    fileUrl: string;
    fileName: string;
    size?: number;
    mimetype?: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  async createDocument(data: {
    factoryId: string;
    factoryName: string;
    documentName: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    fileType?: string;
    description?: string;
    expiryDate?: string;
  }): Promise<FactoryDocumentRecord> {
    const res = await axiosInstance.post("/factory-documents", data);
    return res.data.data;
  },

  async updateDocument(
    id: string,
    data: Partial<{
      factoryId: string;
      factoryName: string;
      documentName: string;
      description: string;
      expiryDate: string;
      status: "active" | "archived";
    }>
  ): Promise<FactoryDocumentRecord> {
    const res = await axiosInstance.patch(`/factory-documents/${id}`, data);
    return res.data.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await axiosInstance.delete(`/factory-documents/${id}`);
  },
};
