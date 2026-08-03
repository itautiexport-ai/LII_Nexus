import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import {
  ApprovalStatus, DocumentCategory, DocumentFolder, DocumentLink, DocumentRecord, DocumentStatus,
  DocumentVersion, LinkEntityType,
} from "../../domain/entities/Document";
import { CreateDocumentData, IDocumentRepository, ListDocumentsParams } from "../../domain/repositories/IDocumentRepository";

function mapDocument(row: any): DocumentRecord {
  return {
    id: row.id, title: row.title, category: row.category, folderId: row.folder_id, ownerId: row.owner_id,
    status: row.status, expiryDate: row.expiry_date, isConfidential: !!row.is_confidential,
    createdAt: row.created_at, updatedAt: row.updated_at,
    fileName: row.file_name, fileUrl: row.file_url,
    departmentId: row.department_id, departmentName: row.department_name,
  };
}

function mapVersion(row: any): DocumentVersion {
  return {
    id: row.id, documentId: row.document_id, versionNumber: row.version_number, fileName: row.file_name, fileUrl: row.file_url,
    changeNotes: row.change_notes, approvalStatus: row.approval_status, reviewedBy: row.reviewed_by, reviewedAt: row.reviewed_at,
    rejectionReason: row.rejection_reason, uploadedBy: row.uploaded_by, uploadedAt: row.uploaded_at,
  };
}

export class MySqlDocumentRepository implements IDocumentRepository {
  async create(data: CreateDocumentData): Promise<DocumentRecord> {
    const id = data.id || uuid();
    await pool.query(
      "INSERT INTO documents (id, title, category, folder_id, owner_id, expiry_date, is_confidential, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, data.title, data.category, data.folderId ?? null, data.ownerId, data.expiryDate ?? null, data.isConfidential ?? false, data.departmentId ?? null]
    );
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<DocumentRecord | null> {
    const [rows] = await pool.query<any[]>("SELECT d.*, dept.name as department_name FROM documents d LEFT JOIN departments dept ON d.department_id = dept.id WHERE d.id = ? AND d.deleted_at IS NULL", [id]);
    return rows[0] ? mapDocument(rows[0]) : null;
  }

  async list(params: ListDocumentsParams) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = ["d.deleted_at IS NULL"];
    const values: unknown[] = [];
    let joinTags = "";
    if (params.search) { conditions.push("d.title LIKE ?"); values.push(`%${params.search}%`); }
    if (params.category) { conditions.push("d.category = ?"); values.push(params.category); }
    if (params.status) { conditions.push("d.status = ?"); values.push(params.status); }
    if (params.folderId) { conditions.push("d.folder_id = ?"); values.push(params.folderId); }
    if (params.tag) {
      joinTags = "JOIN document_tags dt ON dt.document_id = d.id";
      conditions.push("dt.tag = ?");
      values.push(params.tag);
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query<any[]>(
      `SELECT DISTINCT d.*, dept.name as department_name, 
        (SELECT file_name FROM document_versions dv WHERE dv.document_id = d.id ORDER BY version_number DESC LIMIT 1) as file_name,
        (SELECT file_url FROM document_versions dv WHERE dv.document_id = d.id ORDER BY version_number DESC LIMIT 1) as file_url
       FROM documents d 
       LEFT JOIN departments dept ON d.department_id = dept.id
       ${joinTags} ${whereClause} ORDER BY d.updated_at DESC LIMIT ? OFFSET ?`,
      [...values, params.pageSize, offset]
    );
    const [countRows] = await pool.query<any[]>(`SELECT COUNT(DISTINCT d.id) as total FROM documents d ${joinTags} ${whereClause}`, values);
    return { items: rows.map(mapDocument), total: countRows[0].total as number };
  }

  async update(id: string, changes: Partial<{ title: string; category: DocumentCategory; folderId: string | null; expiryDate: string | null; isConfidential: boolean; departmentId: string | null }>): Promise<DocumentRecord> {
    const fieldMap: Record<string, string> = { title: "title", category: "category", folderId: "folder_id", expiryDate: "expiry_date", isConfidential: "is_confidential", departmentId: "department_id" };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      const value = (changes as any)[key];
      if (value !== undefined) { fields.push(`${column} = ?`); values.push(value); }
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE documents SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<void> {
    await pool.query("UPDATE documents SET status = ? WHERE id = ?", [status, id]);
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE documents SET deleted_at = NOW() WHERE id = ?", [id]);
  }

  async addVersion(data: { id: string; documentId: string; versionNumber: number; fileName: string; fileUrl: string; changeNotes?: string | null; uploadedBy: string | null }): Promise<DocumentVersion> {
    const id = data.id || uuid();
    await pool.query(
      "INSERT INTO document_versions (id, document_id, version_number, file_name, file_url, change_notes, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, data.documentId, data.versionNumber, data.fileName, data.fileUrl, data.changeNotes ?? null, data.uploadedBy]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM document_versions WHERE id = ?", [id]);
    return mapVersion(rows[0]);
  }

  async listVersions(documentId: string): Promise<DocumentVersion[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM document_versions WHERE document_id = ? ORDER BY version_number DESC", [documentId]);
    return rows.map(mapVersion);
  }

  async getLatestVersion(documentId: string): Promise<DocumentVersion | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM document_versions WHERE document_id = ? ORDER BY version_number DESC LIMIT 1", [documentId]);
    return rows[0] ? mapVersion(rows[0]) : null;
  }

  async reviewVersion(versionId: string, status: ApprovalStatus, reviewedBy: string | null, rejectionReason: string | null): Promise<DocumentVersion> {
    await pool.query(
      "UPDATE document_versions SET approval_status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?",
      [status, reviewedBy, rejectionReason, versionId]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM document_versions WHERE id = ?", [versionId]);
    return mapVersion(rows[0]);
  }

  async setTags(documentId: string, tags: string[]): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM document_tags WHERE document_id = ?", [documentId]);
      for (const tag of tags) {
        await conn.query("INSERT IGNORE INTO document_tags (id, document_id, tag) VALUES (?, ?, ?)", [uuid(), documentId, tag]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async listTags(documentId: string): Promise<string[]> {
    const [rows] = await pool.query<any[]>("SELECT tag FROM document_tags WHERE document_id = ?", [documentId]);
    return rows.map((r) => r.tag);
  }

  async addLink(data: { id: string; documentId: string; entityType: LinkEntityType; entityId: string }): Promise<void> {
    await pool.query(
      "INSERT IGNORE INTO document_links (id, document_id, entity_type, entity_id) VALUES (?, ?, ?, ?)",
      [data.id, data.documentId, data.entityType, data.entityId]
    );
  }

  async removeLink(id: string, documentId: string): Promise<void> {
    await pool.query("DELETE FROM document_links WHERE id = ? AND document_id = ?", [id, documentId]);
  }

  async listLinks(documentId: string): Promise<DocumentLink[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM document_links WHERE document_id = ?", [documentId]);
    return rows.map((r) => ({ id: r.id, documentId: r.document_id, entityType: r.entity_type, entityId: r.entity_id }));
  }

  async listDocumentsForEntity(entityType: LinkEntityType, entityId: string): Promise<DocumentRecord[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT d.* FROM documents d JOIN document_links dl ON dl.document_id = d.id
       WHERE dl.entity_type = ? AND dl.entity_id = ? AND d.deleted_at IS NULL`,
      [entityType, entityId]
    );
    return rows.map(mapDocument);
  }

  async createFolder(data: { id: string; name: string; parentFolderId: string | null }): Promise<DocumentFolder> {
    const id = data.id || uuid();
    await pool.query("INSERT INTO document_folders (id, name, parent_folder_id) VALUES (?, ?, ?)", [id, data.name, data.parentFolderId]);
    const [rows] = await pool.query<any[]>("SELECT * FROM document_folders WHERE id = ?", [id]);
    return { id: rows[0].id, name: rows[0].name, parentFolderId: rows[0].parent_folder_id };
  }

  async listFolders(): Promise<DocumentFolder[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM document_folders ORDER BY name ASC");
    return rows.map((r) => ({ id: r.id, name: r.name, parentFolderId: r.parent_folder_id }));
  }

  async listExpiringDocuments(withinDays: number): Promise<DocumentRecord[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM documents WHERE deleted_at IS NULL AND expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)",
      [withinDays]
    );
    return rows.map(mapDocument);
  }
}
