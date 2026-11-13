import { createHash } from "crypto";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";
import { isSystemAdminUser } from "../../../../shared/middlewares/rbac.middleware";

const imageUrl = z.string().max(4096).refine(
  (value) => !value || /^https?:\/\//i.test(value) || /^\/uploads\/[a-zA-Z0-9_./-]+$/.test(value),
  "Upload the image first. Temporary browser image URLs cannot be saved."
);
const productSchema = z.object({
  name: z.string().trim().min(1).max(255),
  sku: z.string().trim().min(1).max(255),
  image: imageUrl.default(""),
  images: z.array(z.object({
    id: z.string().max(255), label: z.string().max(255),
    url: imageUrl, previewUrl: imageUrl, isMain: z.boolean().optional(),
  })).max(30).default([]),
}).passthrough();

export class CatalogueProductService {
  private validate(input: unknown) {
    const result = productSchema.safeParse(input);
    if (!result.success) throw new ValidationError("Invalid catalogue product", result.error.flatten());
    const { id, createdBy, createdAt, updatedAt, version, deletedAt, legacyId, ...data } = result.data;
    if (Buffer.byteLength(JSON.stringify(data)) > 90000) {
      throw new ValidationError("Product details are too large; upload images separately.");
    }
    return data;
  }

  private map(row: any) {
    const data = typeof row.product_json === "string" ? JSON.parse(row.product_json) : row.product_json;
    return { ...data, id: row.id, createdBy: row.created_by, version: row.version,
      createdAt: `${String(row.created_at).replace(" ", "T")}Z`,
      updatedAt: `${String(row.updated_at).replace(" ", "T")}Z` };
  }

  async list() {
    // Company catalogue is shared: creators and Admin read the same records.
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM catalogue_products WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC"
    );
    return rows.map((row) => this.map(row));
  }

  async get(id: string) {
    const [rows] = await pool.query<any[]>("SELECT * FROM catalogue_products WHERE id = ? AND deleted_at IS NULL", [id]);
    if (!rows.length) throw new NotFoundError("Catalogue product not found");
    return this.map(rows[0]);
  }

  async create(input: unknown, userId: string, legacyId?: string): Promise<{ product: any; alreadyImported: boolean }> {
    const data = this.validate(input);
    const importKey = legacyId
      ? createHash("sha256").update(JSON.stringify([userId, legacyId])).digest("hex") : null;
    if (importKey) {
      const [existing] = await pool.query<any[]>("SELECT * FROM catalogue_products WHERE legacy_import_key = ?", [importKey]);
      if (existing.length) {
        if (existing[0].deleted_at) throw new ConflictError("Previously imported product was deleted; contact Admin before restoring.");
        return { product: this.map(existing[0]), alreadyImported: true };
      }
    }
    const id = uuid();
    try {
      await pool.query(
        `INSERT INTO catalogue_products (id, name, sku, product_json, created_by, legacy_import_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
        [id, data.name, data.sku, JSON.stringify(data), userId, importKey]
      );
    } catch (error: any) {
      if (importKey && error.code === "ER_DUP_ENTRY") return this.create(input, userId, legacyId);
      throw error;
    }
    return { product: await this.get(id), alreadyImported: false };
  }

  async update(id: string, input: any, userId: string) {
    const existing = await this.get(id);
    if (existing.createdBy !== userId && !await isSystemAdminUser(userId)) throw new ForbiddenError("Only the creator or System Admin can edit this product.");
    const data = this.validate(input);
    if (!Number.isInteger(input.version)) throw new ValidationError("Reload the product before saving.");
    const [result] = await pool.query<any>(
      `UPDATE catalogue_products SET name = ?, sku = ?, product_json = ?, version = version + 1, updated_at = UTC_TIMESTAMP()
       WHERE id = ? AND version = ? AND deleted_at IS NULL`,
      [data.name, data.sku, JSON.stringify(data), id, input.version]
    );
    if (!result.affectedRows) throw new ConflictError("This product changed in another session. Reload before editing.");
    return this.get(id);
  }

  async remove(ids: string[], userId: string) {
    if (!await isSystemAdminUser(userId)) throw new ForbiddenError("Only System Admin can delete catalogue products.");
    if (!ids.length || ids.length > 500 || ids.some((id) => !z.string().uuid().safeParse(id).success)) throw new ValidationError("Invalid product selection.");
    // Keep records and uploaded files for recovery; never hard-delete from this API.
    await pool.query("UPDATE catalogue_products SET deleted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP(), version = version + 1 WHERE id IN (?) AND deleted_at IS NULL", [ids]);
  }
}
