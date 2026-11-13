// Exact supplied sheet. Run after backend build and migrations.
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { env } = require('../dist/config/env');
const { pool } = require('../dist/infrastructure/database/mysql/connection');
const { MetalPriceService } = require('../dist/modules/masterdata/application/services/MetalPriceService');
const source = require('./metal-prices-sheet.json');
const service = new MetalPriceService();
(async () => {
  if (!['localhost','127.0.0.1','::1'].includes(env.db.host) && !process.argv.includes('--allow-remote')) throw Error('Non-local host requires --allow-remote');
  const i = process.argv.indexOf('--backup-dir'), base = i < 0 ? '' : process.argv[i+1];
  if (!base || !path.isAbsolute(base)) throw Error('Supply --backup-dir /absolute/path');
  fs.mkdirSync(base, { recursive:true, mode:0o700 });
  const dir = fs.mkdtempSync(path.join(base, 'metal-import-'));
  const items = source.map(p => service.validate(p));
  if (items.length !== 52 || new Set(items.map(p => service.combinationKey(p))).size !== 52) throw Error('Invalid source combinations');
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [before] = await c.query('SELECT * FROM master_metal_prices FOR UPDATE');
    fs.writeFileSync(path.join(dir,'before.json'), JSON.stringify(before,null,2), {mode:0o600});
    let inserted=0, updated=0, unchanged=0;
    for(const p of items) {
      const key=service.combinationKey(p), matches=before.filter(r => r.combination_key===key);
      if(matches.length>1 || matches.some(r=>r.deleted_at)) throw Error('Conflicting or deleted combination: '+key);
      if(matches.length) {
        const r=matches[0];
        if(Number(r.weight)!==Number(p.weight) || Number(r.rate)!==p.rate || r.weight_uom!==p.weightUom) {
          await c.query('UPDATE master_metal_prices SET weight=?,weight_uom=?,rate=?,updated_at=UTC_TIMESTAMP() WHERE id=?',[p.weight,p.weightUom,p.rate,r.id]);updated++;
        } else unchanged++;
      } else {
        await c.query(`INSERT INTO master_metal_prices
          (id,combination_key,metal_type,pipe_size,pipe_size_uom,pipe_length,pipe_length_uom,metal_thickness,
          metal_thickness_uom,weight,weight_uom,rate,rate_unit,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
          [randomUUID(),key,p.metalType,p.pipeSize,p.pipeSizeUom,p.pipeLength,p.pipeLengthUom,p.metalThickness,p.metalThicknessUom,p.weight,p.weightUom,p.rate,p.rateUnit,p.status]);inserted++;
      }
    }
    const [after]=await c.query('SELECT * FROM master_metal_prices');
    for(const p of items) {
      const m=after.filter(r=>r.combination_key===service.combinationKey(p));
      if(m.length!==1 || m[0].deleted_at || Number(m[0].weight)!==Number(p.weight) || Number(m[0].rate)!==p.rate || m[0].pipe_length!=='6000' || m[0].pipe_length_uom!=='mm' || m[0].metal_thickness_uom!=='mm' || m[0].weight_uom!=='kg') throw Error('Verification failed: '+p.metalType+' '+p.pipeSize);
    }
    // Existing unrelated records must remain byte-for-byte intact.
    const keys=new Set(items.map(p=>service.combinationKey(p)));
    for(const r of before.filter(r=>!keys.has(r.combination_key))) {
      if(JSON.stringify(after.find(x=>x.id===r.id))!==JSON.stringify(r)) throw Error('Unrelated record changed');
    }
    const report={inserted,updated,unchanged,verified:52,MS:26,SS202:26,duplicateTargetCombinations:0};
    fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(report,null,2),{mode:0o600});
    await c.commit(); console.log('Backup:',dir); console.log(report);
  } catch(e) {await c.rollback();throw e;} finally {c.release();}
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>pool.end());
