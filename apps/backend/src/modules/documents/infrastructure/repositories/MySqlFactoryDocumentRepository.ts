import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

export interface FactoryDocumentEntity {
  id: string;
  factoryId: string;
  factoryName: string;
  documentName: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  fileType?: string | null;
  description?: string | null;
  expiryDate?: string | null;
  uploadedBy?: string | null;
  uploadedByName?: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export class MySqlFactoryDocumentRepository {
  async list(filters: {
    factoryId?: string;
    factoryName?: string;
    search?: string;
    status?: string;
  } = {}): Promise<FactoryDocumentEntity[]> {
    let sql = `
      SELECT
        id,
        factory_id AS factoryId,
        factory_name AS factoryName,
        document_name AS documentName,
        file_name AS fileName,
        file_url AS fileUrl,
        file_size AS fileSize,
        file_type AS fileType,
        description,
        DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiryDate,
        uploaded_by AS uploadedBy,
        uploaded_by_name AS uploadedByName,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM factory_documents
      WHERE deleted_at IS NULL
    `;
    const params: any[] = [];

    if (filters.factoryId && filters.factoryId !== "all") {
      sql += " AND factory_id = ?";
      params.push(filters.factoryId);
    } else if (filters.factoryName && filters.factoryName !== "all" && filters.factoryName !== "All") {
      sql += " AND factory_name = ?";
      params.push(filters.factoryName);
    }

    if (filters.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.search && filters.search.trim()) {
      sql += " AND (document_name LIKE ? OR file_name LIKE ? OR description LIKE ? OR factory_name LIKE ?)";
      const query = `%${filters.search.trim()}%`;
      params.push(query, query, query, query);
    }

    sql += " ORDER BY created_at DESC";

    const [rows]: any = await pool.query(sql, params);
    return rows;
  }

  async getById(id: string): Promise<FactoryDocumentEntity | null> {
    const [rows]: any = await pool.query(
      `SELECT
        id,
        factory_id AS factoryId,
        factory_name AS factoryName,
        document_name AS documentName,
        file_name AS fileName,
        file_url AS fileUrl,
        file_size AS fileSize,
        file_type AS fileType,
        description,
        DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiryDate,
        uploaded_by AS uploadedBy,
        uploaded_by_name AS uploadedByName,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM factory_documents
      WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data: {
    factoryId: string;
    factoryName: string;
    documentName: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number | null;
    fileType?: string | null;
    description?: string | null;
    expiryDate?: string | null;
    uploadedBy?: string | null;
    uploadedByName?: string | null;
  }): Promise<FactoryDocumentEntity> {
    const id = uuid();
    await pool.query(
      `INSERT INTO factory_documents (
        id, factory_id, factory_name, document_name, file_name, file_url,
        file_size, file_type, description, expiry_date, uploaded_by, uploaded_by_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        id,
        data.factoryId,
        data.factoryName,
        data.documentName,
        data.fileName,
        data.fileUrl,
        data.fileSize ?? null,
        data.fileType ?? null,
        data.description ?? null,
        data.expiryDate || null,
        data.uploadedBy ?? null,
        data.uploadedByName ?? null,
      ]
    );

    const created = await this.getById(id);
    if (!created) throw new Error("Failed to retrieve created factory document");
    return created;
  }

  async update(
    id: string,
    data: Partial<{
      factoryId: string;
      factoryName: string;
      documentName: string;
      description: string | null;
      expiryDate: string | null;
      status: "active" | "archived";
    }>
  ): Promise<FactoryDocumentEntity | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.factoryId !== undefined) {
      updates.push("factory_id = ?");
      values.push(data.factoryId);
    }
    if (data.factoryName !== undefined) {
      updates.push("factory_name = ?");
      values.push(data.factoryName);
    }
    if (data.documentName !== undefined) {
      updates.push("document_name = ?");
      values.push(data.documentName);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.expiryDate !== undefined) {
      updates.push("expiry_date = ?");
      values.push(data.expiryDate || null);
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      values.push(data.status);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE factory_documents SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }

    return await this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result]: any = await pool.query(
      "UPDATE factory_documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}
