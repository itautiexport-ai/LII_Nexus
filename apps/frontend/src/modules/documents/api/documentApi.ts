import { axiosInstance } from "../../../services/api/axiosInstance";

export type DocumentCategory = "sop" | "drawing" | "work_instruction" | "qc_format" | "policy" | "contract" | "buyer_document" | "machine_manual" | "training_video" | "template";
export type DocumentStatus = "draft" | "pending_approval" | "approved" | "rejected";
export type LinkEntityType = "employee" | "machine" | "product" | "department" | "workflow" | "crm_lead";

export const CATEGORY_LABELS: Record<string, string> = {
  drawing: "Drawing", work_instruction: "Work Instruction", qc_format: "QC Format",
  contract: "Contract", buyer_document: "Buyer Document", machine_manual: "Machine Manual", training_video: "Training Video",
};

export interface DocumentRecord {
  id: string;
  title: string;
  category: DocumentCategory;
  folderId: string | null;
  status: DocumentStatus;
  expiryDate: string | null;
  isConfidential: boolean;
  updatedAt: string;
  fileName?: string;
  fileUrl?: string;
  departmentId?: string | null;
  departmentName?: string;
}

export interface DocumentVersionRecord {
  id: string;
  versionNumber: number;
  fileName: string;
  fileUrl: string;
  changeNotes: string | null;
  approvalStatus: "pending_approval" | "approved" | "rejected";
  rejectionReason: string | null;
  uploadedAt: string;
}

export interface DocumentDetail extends DocumentRecord {
  versions: DocumentVersionRecord[];
  tags: string[];
  links: { id: string; entityType: LinkEntityType; entityId: string }[];
}

export interface FolderRecord { id: string; name: string; parentFolderId: string | null; }
export interface MachineRecord {
  id: string;
  name: string;
  code: string | null;
  building: string | null;
  floor: string | null;
  location: string | null;
  status: string;
}
export interface ProductRecord { id: string; name: string; sku: string | null; status: string; }

export function inferPreviewKind(fileName: string): "pdf" | "image" | "video" | "none" {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  return "none";
}

export const documentApi = {
  async list(params: Record<string, string | undefined> = {}) {
    const res = await axiosInstance.get("/documents", { params: { page: 1, pageSize: 20, ...params } });
    return { items: res.data.data as DocumentRecord[], totalItems: res.data.meta?.totalItems as number };
  },
  async getById(id: string): Promise<DocumentDetail> { return (await axiosInstance.get(`/documents/${id}`)).data.data; },
  async uploadFile(file: File): Promise<{ fileUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async create(payload: { title: string; category: DocumentCategory; folderId?: string | null; expiryDate?: string | null; isConfidential?: boolean; fileName: string; fileUrl: string; changeNotes?: string; departmentId?: string | null }): Promise<DocumentRecord> {
    return (await axiosInstance.post("/documents", payload)).data.data as DocumentDetail;
  },
  async update(id: string, payload: Partial<{ title: string; category: DocumentCategory; folderId: string | null; expiryDate: string | null; isConfidential: boolean }>) {
    return (await axiosInstance.patch(`/documents/${id}`, payload)).data.data;
  },
  async remove(id: string) { await axiosInstance.delete(`/documents/${id}`); },

  async addVersion(id: string, fileName: string, fileUrl: string, changeNotes?: string) {
    return (await axiosInstance.post(`/documents/${id}/versions`, { fileName, fileUrl, changeNotes })).data.data;
  },
  async reviewVersion(id: string, versionId: string, approve: boolean, rejectionReason?: string) {
    return (await axiosInstance.patch(`/documents/${id}/versions/${versionId}/review`, { approve, rejectionReason })).data.data;
  },

  async setTags(id: string, tags: string[]) { return (await axiosInstance.put(`/documents/${id}/tags`, { tags })).data.data as string[]; },
  async addLink(id: string, entityType: LinkEntityType, entityId: string) { return (await axiosInstance.post(`/documents/${id}/links`, { entityType, entityId })).data.data; },
  async removeLink(id: string, linkId: string) { await axiosInstance.delete(`/documents/${id}/links/${linkId}`); },

  async listFolders(): Promise<FolderRecord[]> { return (await axiosInstance.get("/documents/folders")).data.data; },
  async createFolder(name: string, parentFolderId?: string) { return (await axiosInstance.post("/documents/folders", { name, parentFolderId })).data.data as FolderRecord; },

  async listMachines(): Promise<MachineRecord[]> { return (await axiosInstance.get("/machines")).data.data; },
  async createMachine(name: string, code?: string, building?: string, floor?: string, location?: string) {
    return (await axiosInstance.post("/machines", { name, code, building, floor, location })).data.data as MachineRecord;
  },
  async updateMachine(id: string, name: string, code?: string, building?: string, floor?: string, location?: string) {
    return (await axiosInstance.patch(`/machines/${id}`, { name, code, building, floor, location })).data.data as MachineRecord;
  },
  async listProducts(): Promise<ProductRecord[]> { return (await axiosInstance.get("/products")).data.data; },
  async createProduct(name: string, sku?: string) { return (await axiosInstance.post("/products", { name, sku })).data.data as ProductRecord; },
  async updateProduct(id: string, name: string, sku?: string) { return (await axiosInstance.patch(`/products/${id}`, { name, sku })).data.data as ProductRecord; },

  async checkExpiries(withinDays = 30) { return (await axiosInstance.post(`/documents/check-expiries?withinDays=${withinDays}`)).data.data; },
};
