import { v4 as uuid } from "uuid";
import { IDocumentRepository, ListDocumentsParams } from "../../domain/repositories/IDocumentRepository";
import { DocumentCategory, LinkEntityType } from "../../domain/entities/Document";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class DocumentService {
  constructor(private readonly repo: IDocumentRepository, private readonly scope: EmployeeScopeService) {}

  private async assertCanView(documentId: string, hasConfidentialOverride: boolean) {
    const doc = await this.repo.findById(documentId);
    if (!doc) throw new NotFoundError("Document not found.");
    if (doc.isConfidential && !hasConfidentialOverride) {
      throw new ForbiddenError("This document is confidential. You need the document.view.confidential permission to access it.");
    }
    return doc;
  }

  async create(input: { title: string; category: DocumentCategory; folderId?: string | null; expiryDate?: string | null; isConfidential?: boolean; fileName: string; fileUrl: string; changeNotes?: string | null; departmentId?: string | null }, actorUserId: string) {
    const owner = await this.scope.getEmployeeForUser(actorUserId);
    const doc = await this.repo.create({
      id: uuid(), title: input.title, category: input.category, folderId: input.folderId, ownerId: owner?.id ?? null,
      expiryDate: input.expiryDate, isConfidential: input.isConfidential, departmentId: input.departmentId,
    });
    await this.repo.addVersion({ id: uuid(), documentId: doc.id, versionNumber: 1, fileName: input.fileName, fileUrl: input.fileUrl, changeNotes: input.changeNotes, uploadedBy: owner?.id ?? null });
    await this.repo.updateStatus(doc.id, "pending_approval");

    await AuditService.record({ actorUserId, action: "DOCUMENT_CREATED", entityType: "document", entityId: doc.id, afterState: { title: doc.title, category: doc.category } });
    return this.getDetail(doc.id, true);
  }

  async getDetail(id: string, hasConfidentialOverride: boolean) {
    const doc = await this.assertCanView(id, hasConfidentialOverride);
    const [versions, tags, links] = await Promise.all([this.repo.listVersions(id), this.repo.listTags(id), this.repo.listLinks(id)]);
    return { ...doc, versions, tags, links };
  }

  async list(params: ListDocumentsParams, hasConfidentialOverride: boolean) {
    const { items, total } = await this.repo.list(params);
    // Confidential documents are filtered out of listings entirely for
    // users without the override, rather than shown with details hidden -
    // simpler and more honestly "you don't see it" than a half-redacted row.
    const visible = hasConfidentialOverride ? items : items.filter((d) => !d.isConfidential);
    return { items: visible, total: hasConfidentialOverride ? total : visible.length };
  }

  async update(id: string, changes: Partial<{ title: string; category: DocumentCategory; folderId: string | null; expiryDate: string | null; isConfidential: boolean; departmentId: string | null }>, actorUserId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Document not found.");
    const updated = await this.repo.update(id, changes);
    await AuditService.record({ actorUserId, action: "DOCUMENT_UPDATED", entityType: "document", entityId: id, afterState: changes });
    return updated;
  }

  async remove(id: string, actorUserId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Document not found.");
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId, action: "DOCUMENT_DELETED", entityType: "document", entityId: id });
  }

  async addVersion(documentId: string, fileName: string, fileUrl: string, changeNotes: string | null | undefined, actorUserId: string) {
    const doc = await this.repo.findById(documentId);
    if (!doc) throw new NotFoundError("Document not found.");
    const latest = await this.repo.getLatestVersion(documentId);
    const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;
    const uploader = await this.scope.getEmployeeForUser(actorUserId);

    const version = await this.repo.addVersion({ id: uuid(), documentId, versionNumber: nextVersionNumber, fileName, fileUrl, changeNotes, uploadedBy: uploader?.id ?? null });
    // A new version resets the document to pending_approval - it needs its
    // own review, even if a prior version was already approved.
    await this.repo.updateStatus(documentId, "pending_approval");

    await AuditService.record({ actorUserId, action: "DOCUMENT_VERSION_ADDED", entityType: "document", entityId: documentId, afterState: { versionNumber: nextVersionNumber, fileName } });
    return version;
  }

  async reviewVersion(documentId: string, versionId: string, approve: boolean, rejectionReason: string | null | undefined, actorUserId: string) {
    const doc = await this.repo.findById(documentId);
    if (!doc) throw new NotFoundError("Document not found.");
    const latest = await this.repo.getLatestVersion(documentId);
    if (!latest || latest.id !== versionId) {
      throw new ValidationError("Only the latest version of a document can be reviewed.");
    }
    const reviewer = await this.scope.getEmployeeForUser(actorUserId);
    const version = await this.repo.reviewVersion(versionId, approve ? "approved" : "rejected", reviewer?.id ?? null, approve ? null : (rejectionReason ?? null));
    await this.repo.updateStatus(documentId, approve ? "approved" : "rejected");

    await AuditService.record({ actorUserId, action: approve ? "DOCUMENT_VERSION_APPROVED" : "DOCUMENT_VERSION_REJECTED", entityType: "document", entityId: documentId, afterState: { versionId } });
    return version;
  }

  async setTags(documentId: string, tags: string[], actorUserId: string) {
    const doc = await this.repo.findById(documentId);
    if (!doc) throw new NotFoundError("Document not found.");
    await this.repo.setTags(documentId, tags.map((t) => t.trim().toLowerCase()).filter(Boolean));
    await AuditService.record({ actorUserId, action: "DOCUMENT_TAGS_UPDATED", entityType: "document", entityId: documentId, afterState: { tags } });
    return this.repo.listTags(documentId);
  }

  async addLink(documentId: string, entityType: LinkEntityType, entityId: string, actorUserId: string) {
    const doc = await this.repo.findById(documentId);
    if (!doc) throw new NotFoundError("Document not found.");
    await this.repo.addLink({ id: uuid(), documentId, entityType, entityId });
    await AuditService.record({ actorUserId, action: "DOCUMENT_LINKED", entityType: "document", entityId: documentId, afterState: { linkEntityType: entityType, linkEntityId: entityId } });
    return this.repo.listLinks(documentId);
  }

  async removeLink(documentId: string, linkId: string, actorUserId: string) {
    await this.repo.removeLink(linkId, documentId);
    await AuditService.record({ actorUserId, action: "DOCUMENT_LINK_REMOVED", entityType: "document", entityId: documentId, afterState: { linkId } });
  }

  async listForEntity(entityType: LinkEntityType, entityId: string, hasConfidentialOverride: boolean) {
    const docs = await this.repo.listDocumentsForEntity(entityType, entityId);
    return hasConfidentialOverride ? docs : docs.filter((d) => !d.isConfidential);
  }

  async createFolder(name: string, parentFolderId: string | null | undefined) {
    return this.repo.createFolder({ id: uuid(), name, parentFolderId: parentFolderId ?? null });
  }

  listFolders() {
    return this.repo.listFolders();
  }
}
