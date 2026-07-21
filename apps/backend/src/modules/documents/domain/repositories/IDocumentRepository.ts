import {
  ApprovalStatus, DocumentCategory, DocumentFolder, DocumentLink, DocumentRecord, DocumentStatus,
  DocumentVersion, LinkEntityType,
} from "../entities/Document";

export interface CreateDocumentData {
  id: string;
  title: string;
  category: DocumentCategory;
  folderId?: string | null;
  ownerId: string | null;
  expiryDate?: string | null;
  isConfidential?: boolean;
  departmentId?: string | null;
}

export interface ListDocumentsParams {
  page: number;
  pageSize: number;
  search?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  folderId?: string;
  departmentId?: string;
  tag?: string;
  expiringWithinDays?: number;
}

export interface IDocumentRepository {
  create(data: CreateDocumentData): Promise<DocumentRecord>;
  findById(id: string): Promise<DocumentRecord | null>;
  list(params: ListDocumentsParams): Promise<{ items: DocumentRecord[]; total: number }>;
  update(id: string, changes: Partial<{ title: string; category: DocumentCategory; folderId: string | null; expiryDate: string | null; isConfidential: boolean }>): Promise<DocumentRecord>;
  updateStatus(id: string, status: DocumentStatus): Promise<void>;
  softDelete(id: string): Promise<void>;

  addVersion(data: { id: string; documentId: string; versionNumber: number; fileName: string; fileUrl: string; changeNotes?: string | null; uploadedBy: string | null }): Promise<DocumentVersion>;
  listVersions(documentId: string): Promise<DocumentVersion[]>;
  getLatestVersion(documentId: string): Promise<DocumentVersion | null>;
  reviewVersion(versionId: string, status: ApprovalStatus, reviewedBy: string | null, rejectionReason: string | null): Promise<DocumentVersion>;

  setTags(documentId: string, tags: string[]): Promise<void>;
  listTags(documentId: string): Promise<string[]>;

  addLink(data: { id: string; documentId: string; entityType: LinkEntityType; entityId: string }): Promise<void>;
  removeLink(id: string, documentId: string): Promise<void>;
  listLinks(documentId: string): Promise<DocumentLink[]>;
  listDocumentsForEntity(entityType: LinkEntityType, entityId: string): Promise<DocumentRecord[]>;

  createFolder(data: { id: string; name: string; parentFolderId: string | null }): Promise<DocumentFolder>;
  listFolders(): Promise<DocumentFolder[]>;

  listExpiringDocuments(withinDays: number): Promise<DocumentRecord[]>;
}
