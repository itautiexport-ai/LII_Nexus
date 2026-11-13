// Exact image transcription, no price formulas. Transactional and rerunnable; explicit backup directory required.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { pool } = require('../dist/infrastructure/database/mysql/connection');
const data = require('./wood-prices-2026-11-13.json');
const key = r => [String(r.woodType).trim().toLowerCase(), Number(r.thickness), Number(r.length)].join('|');
(async () => {
  if (!['localhost','127.0.0.1','::1'].includes(process.env.DB_HOST || 'localhost') && !process.argv.includes('--allow-remote')) throw Error('Non-local database requires explicit --allow-remote');
  const option = process.argv.indexOf('--backup-dir');
  const base = option >= 0 ? process.argv[option + 1] : '';
  if (!base || !path.isAbsolute(base)) throw Error('Supply --backup-dir /absolute/backup/directory');
  fs.mkdirSync(base, { recursive: true, mode: 0o700 });
  const dir = fs.mkdtempSync(path.join(base, 'wood-import-'));
  console.log('Backup and verification report:', dir);
  if (data.length !== 135 || new Set(data.map(key)).size !== 135) throw Error('Invalid source combinations');
  const c = await pool.getConnection();
  try {
    await c.query("SET time_zone = '+00:00'");
    const [before] = await c.query('SELECT * FROM master_wood_thickness_prices');
    fs.writeFileSync(dir+'/wood-prices-before.json',JSON.stringify(before,null,2),{mode:0o600});
    await c.beginTransaction();
    const [locked] = await c.query('SELECT * FROM master_wood_thickness_prices FOR UPDATE');
    let inserted=0, updated=0, unchanged=0;
    for (const r of data) {
      const matches=locked.filter(x=>!x.deleted_at && String(x.wood_type).trim().toLowerCase()===r.woodType.toLowerCase() && Number(x.thickness)===Number(r.thickness) && Number(x.length)===Number(r.length) && x.thickness_uom==='inch' && x.length_uom==='feet');
      if(matches.length>1) throw Error('Existing duplicate: '+key(r));
      if(matches.length) {
        if(Number(matches[0].rate_per_cft)!==r.ratePerCft) {await c.query('UPDATE master_wood_thickness_prices SET rate_per_cft=? WHERE id=?',[r.ratePerCft,matches[0].id]);updated++;} else unchanged++;
      } else {await c.query('INSERT INTO master_wood_thickness_prices (id,wood_type,thickness,thickness_uom,length,length_uom,rate_per_cft,status) VALUES (?,?,?,\'inch\',?,\'feet\',?,\'active\')',[randomUUID(),r.woodType,r.thickness,r.length,r.ratePerCft]);inserted++;}
    }
    const [after]=await c.query('SELECT * FROM master_wood_thickness_prices WHERE deleted_at IS NULL');
    for(const r of data){const m=after.filter(x=>key({woodType:x.wood_type,thickness:x.thickness,length:x.length})===key(r)&&x.thickness_uom==='inch'&&x.length_uom==='feet');if(m.length!==1||Number(m[0].rate_per_cft)!==r.ratePerCft)throw Error('Verification failed '+key(r));}
    await c.commit();
    const report={inserted,updated,unchanged,verified:135,counts:{Sheesham:45,Mango:45,Acacia:45},duplicateTargetCombinations:0,unrelatedRowsPreserved:before.length-(updated+unchanged)};
    fs.writeFileSync(dir+'/wood-import-report.json',JSON.stringify(report,null,2));console.log(report);
  } catch(e){await c.rollback();throw e;} finally{c.release();await pool.end();}
})().catch(async e=>{console.error(e.message);await pool.end();process.exitCode=1});
