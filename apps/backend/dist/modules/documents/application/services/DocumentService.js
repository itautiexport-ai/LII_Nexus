"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class DocumentService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
    }
    async assertCanView(documentId, hasConfidentialOverride) {
        const doc = await this.repo.findById(documentId);
        if (!doc)
            throw new DomainError_1.NotFoundError("Document not found.");
        if (doc.isConfidential && !hasConfidentialOverride) {
            throw new DomainError_1.ForbiddenError("This document is confidential. You need the document.view.confidential permission to access it.");
        }
        return doc;
    }
    async create(input, actorUserId) {
        const owner = await this.scope.getEmployeeForUser(actorUserId);
        const doc = await this.repo.create({
            id: (0, uuid_1.v4)(), title: input.title, category: input.category, folderId: input.folderId, ownerId: owner?.id ?? null,
            expiryDate: input.expiryDate, isConfidential: input.isConfidential, departmentId: input.departmentId,
        });
        await this.repo.addVersion({ id: (0, uuid_1.v4)(), documentId: doc.id, versionNumber: 1, fileName: input.fileName, fileUrl: input.fileUrl, changeNotes: input.changeNotes, uploadedBy: owner?.id ?? null });
        await this.repo.updateStatus(doc.id, "pending_approval");
        await AuditService_1.AuditService.record({ actorUserId, action: "DOCUMENT_CREATED", entityType: "document", entityId: doc.id, afterState: { title: doc.title, category: doc.category } });
        return this.getDetail(doc.id, true);
    }
    async getDetail(id, hasConfidentialOverride) {
        const doc = await this.assertCanView(id, hasConfidentialOverride);
        const [versions, tags, links] = await Promise.all([this.repo.listVersions(id), this.repo.listTags(id), this.repo.listLinks(id)]);
        return { ...doc, versions, tags, links };
    }
    async list(params, hasConfidentialOverride) {
        const { items, total } = await this.repo.list(params);
        // Confidential documents are filtered out of listings entirely for
        // users without the override, rather than shown with details hidden -
        // simpler and more honestly "you don't see it" than a half-redacted row.
        const visible = hasConfidentialOverride ? items : items.filter((d) => !d.isConfidential);
        return { items: visible, total: hasConfidentialOverride ? total : visible.length };
    }
    async update(id, changes, actorUserId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Document not found.");
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId, action: "DOCUMENT_UPDATED", entityType: "document", entityId: id, afterState: changes });
        return updated;
    }
    async remove(id, actorUserId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Document not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId, action: "DOCUMENT_DELETED", entityType: "document", entityId: id });
    }
    async addVersion(documentId, fileName, fileUrl, changeNotes, actorUserId) {
        const doc = await this.repo.findById(documentId);
        if (!doc)
            throw new DomainError_1.NotFoundError("Document not found.");
        const latest = await this.repo.getLatestVersion(documentId);
        const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;
        const uploader = await this.scope.getEmployeeForUser(actorUserId);
        const version = await this.repo.addVersion({ id: (0, uuid_1.v4)(), documentId, versionNumber: nextVersionNumber, fileName, fileUrl, changeNotes, uploadedBy: uploader?.id ?? null });
        // A new version resets the document to pending_approval - it needs its
        // own review, even if a prior version was already approved.
        await this.repo.updateStatus(documentId, "pending_approval");
        await AuditService_1.AuditService.record({ actorUserId, action: "DOCUMENT_VERSION_ADDED", entityType: "document", entityId: documentId, afterState: { versionNumber: nextVersionNumber, fileName } });
        return version;
    }
    async reviewVersion(documentId, versionId, approve, rejectionReason, actorUserId) {
        const doc = await this.repo.findById(documentId);
        if (!doc)
            throw new DomainError_1.NotFoundError("Document not found.");
        const latest = await this.repo.getLatestVersion(documentId);
        if (!latest || latest.id !== versionId) {
            throw new DomainError_1.ValidationError("Only the latest version of a document can be reviewed.");
        }
        const reviewer = await this.scope.getEmployeeForUser(actorUserId);
        const version = await this.repo.reviewVersion(versionId, approve ? "approved" : "rejected", reviewer?.id ?? null, approve ? null : (rejectionReason ?? null));
        await this.repo.updateStatus(documentId, approve ? "approved" : "rejected");
        await AuditService_1.AuditService.record({ actorUserId, action: approve ? "DOCUMENT_VERSION_APPROVED" : "DOCUMENT_VERSION_REJECTED", entityType: "document", entityId: documentId, afterState: { versionId } });
        return version;
    }
    async setTags(documentId, tags, actorUserId) {
        const doc = await this.repo.findById(documentId);
        if (!doc)
            throw new DomainError_1.NotFoundError("Document not found.");
        await this.repo.setTags(documentId, tags.map((t) => t.trim().toLowerCase()).filter(Boolean));
        await AuditService_1.AuditService.record({ actorUserId, action: "DOCUMENT_TAGS_UPDATED", entityType: "document", entityId: documentId, afterState: { tags } });
        return this.repo.listTags(documentId);
    }
    async addLink(documentId, entityType, entityId, actorUserId) {
        const doc = await this.repo.findById(documentId);
        if (!doc)
            throw new DomainError_1.NotFoundError("Document not found.");
        await this.repo.addLink({ id: (0, uuid_1.v4)(), documentId, entityType, entityId });
        await AuditService_1.AuditService.record({ actorUserId, action: "DOCUMENT_LINKED", entityType: "document", entityId: documentId, afterState: { linkEntityType: entityType, linkEntityId: entityId } });
        return this.repo.listLinks(documentId);
    }
    async removeLink(documentId, linkId, actorUserId) {
        await this.repo.removeLink(linkId, documentId);
        await AuditService_1.AuditService.record({ actorUserId, action: "DOCUMENT_LINK_REMOVED", entityType: "document", entityId: documentId, afterState: { linkId } });
    }
    async listForEntity(entityType, entityId, hasConfidentialOverride) {
        const docs = await this.repo.listDocumentsForEntity(entityType, entityId);
        return hasConfidentialOverride ? docs : docs.filter((d) => !d.isConfidential);
    }
    async createFolder(name, parentFolderId) {
        return this.repo.createFolder({ id: (0, uuid_1.v4)(), name, parentFolderId: parentFolderId ?? null });
    }
    listFolders() {
        return this.repo.listFolders();
    }
}
exports.DocumentService = DocumentService;
//# sourceMappingURL=DocumentService.js.map