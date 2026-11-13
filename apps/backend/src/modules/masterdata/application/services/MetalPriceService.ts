import { createHash, randomUUID } from 'crypto';
import { z } from 'zod';
import { pool } from '../../../../infrastructure/database/mysql/connection';
import { ConflictError, NotFoundError, ValidationError } from '../../../../core/domain/errors/DomainError';

const positive = z.string().trim().max(50).refine(v => v !== '' && Number.isFinite(Number(v)) && Number(v) > 0, 'Enter a positive number');
const schema = z.object({
  metalType: z.string().trim().min(1).max(150),
  pipeSize: z.string().trim().min(1).max(100),
  pipeSizeUom: z.enum(['mm', 'inch', 'cm']),
  pipeLength: positive,
  pipeLengthUom: z.enum(['mm', 'feet', 'meter', 'inch']),
  metalThickness: positive,
  metalThicknessUom: z.enum(['mm', 'inch', 'Gauge (SWG)']),
  weight: z.string().trim().max(50).refine(v => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0), 'Invalid weight'),
  weightUom: z.enum(['kg', 'gm']),
  rate: z.number().finite().min(0).max(9999999999.99).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.0001, 'Maximum two decimal places'),
  rateUnit: z.enum(['Per Kg', 'Per Foot', 'Per Meter', 'Per Piece']),
  status: z.enum(['active', 'inactive']).default('active'),
});
type MetalInput = z.infer<typeof schema>;
export class MetalPriceService {
  validate(input: unknown): MetalInput {
    const result = schema.safeParse(input);
    if (!result.success) throw new ValidationError('Invalid metal price', result.error.flatten());
    return result.data;
  }
  combinationKey(p: MetalInput) {
    const size = p.pipeSize.toLowerCase().replace(/×/g, 'x').split(/\s*x\s*/).map(v => {
      const s = v.trim(); return s !== '' && Number.isFinite(Number(s)) ? String(Number(s)) : s;
    }).join('x');
    return createHash('sha256').update(JSON.stringify([
      p.metalType.trim().toLowerCase(), size, p.pipeSizeUom, String(Number(p.pipeLength)), p.pipeLengthUom,
      String(Number(p.metalThickness)), p.metalThicknessUom, p.rateUnit,
    ])).digest('hex');
  }
  private map(r: any) {
    return { id: r.id, metalType: r.metal_type, pipeSize: r.pipe_size, pipeSizeUom: r.pipe_size_uom,
      pipeLength: r.pipe_length, pipeLengthUom: r.pipe_length_uom, metalThickness: r.metal_thickness,
      metalThicknessUom: r.metal_thickness_uom, weight: r.weight, weightUom: r.weight_uom,
      rate: Number(r.rate), rateUnit: r.rate_unit, status: r.status, createdAt: String(r.created_at).slice(0, 10) };
  }
  private values(p: MetalInput) {
    return [this.combinationKey(p), p.metalType, p.pipeSize, p.pipeSizeUom, p.pipeLength, p.pipeLengthUom,
      p.metalThickness, p.metalThicknessUom, p.weight, p.weightUom, p.rate, p.rateUnit, p.status];
  }
  async list() {
    const [rows] = await pool.query<any[]>('SELECT * FROM master_metal_prices WHERE deleted_at IS NULL ORDER BY metal_type, pipe_size, metal_thickness');
    return rows.map(r => this.map(r));
  }
  async get(id: string) {
    const [rows] = await pool.query<any[]>('SELECT * FROM master_metal_prices WHERE id=? AND deleted_at IS NULL', [id]);
    if (!rows.length) throw new NotFoundError('Metal price not found');
    return this.map(rows[0]);
  }
  async create(input: unknown) {
    const p = this.validate(input), id = randomUUID();
    try {
      await pool.query(`INSERT INTO master_metal_prices
        (id,combination_key,metal_type,pipe_size,pipe_size_uom,pipe_length,pipe_length_uom,metal_thickness,
        metal_thickness_uom,weight,weight_uom,rate,rate_unit,status,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())`, [id, ...this.values(p)]);
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') throw new ConflictError('This metal/size/length/thickness combination already exists, including deleted records. Edit or restore the existing record.');
      throw e;
    }
    return this.get(id);
  }
  async update(id: string, input: unknown) {
    await this.get(id);
    const p = this.validate(input);
    try {
      await pool.query(`UPDATE master_metal_prices SET combination_key=?,metal_type=?,pipe_size=?,pipe_size_uom=?,
        pipe_length=?,pipe_length_uom=?,metal_thickness=?,metal_thickness_uom=?,weight=?,weight_uom=?,rate=?,
        rate_unit=?,status=?,updated_at=UTC_TIMESTAMP() WHERE id=? AND deleted_at IS NULL`, [...this.values(p), id]);
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') throw new ConflictError('That metal price combination already exists.');
      throw e;
    }
    return this.get(id);
  }
  async remove(id: string) {
    await this.get(id);
    await pool.query('UPDATE master_metal_prices SET deleted_at=UTC_TIMESTAMP(),updated_at=UTC_TIMESTAMP() WHERE id=?', [id]);
  }
  // Browser recovery never overwrites shared/imported prices; conflicts remain in the browser backup.
  async importLegacy(input: unknown) {
    if (!Array.isArray(input) || input.length > 500) throw new ValidationError('Supply up to 500 browser records.');
    const rows = input.map(r => this.validate(r));
    const c = await pool.getConnection();
    let inserted = 0, skipped = 0;
    try {
      await c.beginTransaction();
      for (const p of rows) {
        const [existing] = await c.query<any[]>('SELECT id FROM master_metal_prices WHERE combination_key=? FOR UPDATE', [this.combinationKey(p)]);
        if (existing.length) { skipped++; continue; }
        await c.query(`INSERT INTO master_metal_prices
          (id,combination_key,metal_type,pipe_size,pipe_size_uom,pipe_length,pipe_length_uom,metal_thickness,
          metal_thickness_uom,weight,weight_uom,rate,rate_unit,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())`, [randomUUID(), ...this.values(p)]);
        inserted++;
      }
      await c.commit();
      return { inserted, skipped };
    } catch (e) { await c.rollback(); throw e; } finally { c.release(); }
  }
}
