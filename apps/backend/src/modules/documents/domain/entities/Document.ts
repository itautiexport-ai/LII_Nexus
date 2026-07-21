export type DocumentCategory =
  | "sop" | "drawing" | "work_instruction" | "qc_format" | "policy" | "contract"
  | "buyer_document" | "machine_manual" | "training_video" | "template";

export type DocumentStatus = "draft" | "pending_approval" | "approved" | "rejected";
export type ApprovalStatus = "pending_approval" | "approved" | "rejected";
export type LinkEntityType = "employee" | "machine" | "product" | "department" | "workflow" | "crm_lead";
export type MasterStatus = "active" | "inactive";

export interface Machine {
  id: string;
  name: string;
  code: string | null;
  factoryDepartmentId: string | null;
  status: MasterStatus;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  status: MasterStatus;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentFolderId: string | null;
}

export interface DocumentRecord {
  id: string;
  title: string;
  category: DocumentCategory;
  folderId: string | null;
  ownerId: string | null;
  status: DocumentStatus;
  expiryDate: string | null;
  isConfidential: boolean;
  createdAt: Date;
  updatedAt: Date;
  fileName?: string;
  fileUrl?: string;
  departmentId?: string | null;
  departmentName?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  fileUrl: string;
  changeNotes: string | null;
  approvalStatus: ApprovalStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  uploadedBy: string | null;
  uploadedAt: Date;
}

export interface DocumentLink {
  id: string;
  documentId: string;
  entityType: LinkEntityType;
  entityId: string;
}

/** Derived from the filename extension, purely to tell the frontend which
 *  preview mode to use - PDF viewer vs. image viewer vs. no preview. */
export function inferPreviewKind(fileName: string): "pdf" | "image" | "video" | "none" {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext ?? "")) return "image";
  if (["mp4", "mov", "webm"].includes(ext ?? "")) return "video";
  return "none";
}
