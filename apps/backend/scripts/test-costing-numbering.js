// Local-only numbering regression. Isolated year prefix; removes only its fixtures.
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {env}=require('../dist/config/env');
const {pool}=require('../dist/infrastructure/database/mysql/connection');
const {MySqlCostingRepository}=require('../dist/modules/costing/infrastructure/MySqlCostingRepository');
const {CostingService}=require('../dist/modules/costing/application/services/CostingService');
const RealDate=Date,year=3000+Math.floor(Math.random()*500),marker=`Numbering regression ${randomUUID()}`;
// Keep real timestamps/JWT clocks intact; isolate only number prefixes.
global.Date=class extends RealDate {getFullYear(){return year;} getMonth(){return 4;}};
const ep=`EST-${year}-`,bp=`BUN-${String(year).slice(-2)}05-`;
const repo=new MySqlCostingRepository(),service=new CostingService(repo);
let fixturePrefixReserved=false;
async function assertReleased(kind){const [r]=await pool.query('SELECT IS_FREE_LOCK(SHA2(CONCAT(DATABASE(), ?),256)) AS free',[`:costing:${kind}-number`]);assert.equal(Number(r[0].free),1);}
(async()=>{
 assert.ok(['localhost','127.0.0.1','::1'].includes(env.db.host)&&env.nodeEnv!=='production','Local development DB only');
 await repo.generateEstimationNumber();await repo.generateBunchCode();
 const [es]=await pool.query('SELECT COUNT(*) AS n FROM cost_estimations WHERE estimation_number LIKE ?',[ep+'%']);
 const [bs]=await pool.query('SELECT COUNT(*) AS n FROM costing_request_bunches WHERE bunch_code LIKE ?',[bp+'%']);
 assert.equal(Number(es[0].n)+Number(bs[0].n),0,'Fixture prefixes already used; rerun with another isolated year');fixturePrefixReserved=true;
 // Newer timestamp has a lower number; highest suffix is intentionally older.
 for(const [suffix,stamp] of [['0002','2026-01-02 00:00:00'],['0003','2026-01-01 00:00:00'],['0010','2025-01-01 00:00:00'],['9999junk','2024-01-01 00:00:00']]){
  await pool.query('INSERT INTO cost_estimations(id,estimation_number,title,created_at) VALUES(?,?,?,?)',[randomUUID(),ep+suffix,marker,stamp]);
  await pool.query('INSERT INTO costing_request_bunches(id,bunch_code,merchant_name,created_at) VALUES(?,?,?,?)',[randomUUID(),bp+suffix,marker,stamp]);
 }
 const [old]=await pool.query('SELECT estimation_number FROM cost_estimations WHERE estimation_number LIKE ? ORDER BY created_at DESC LIMIT 1',[ep+'%']);
 assert.equal(old[0].estimation_number,ep+'0002'); // Old algorithm would collide with 0003.
 assert.equal(await repo.generateEstimationNumber(),ep+'0011');assert.equal(await repo.generateBunchCode(),bp+'0011');
 // Equal-second timestamps must not affect selection, including the 9999 boundary.
 for(const suffix of ['9998','9999']){
  await pool.query('INSERT INTO cost_estimations(id,estimation_number,title,created_at) VALUES(?,?,?,?)',[randomUUID(),ep+suffix,marker,'2023-01-01 00:00:00']);
  await pool.query('INSERT INTO costing_request_bunches(id,bunch_code,merchant_name,created_at) VALUES(?,?,?,?)',[randomUUID(),bp+suffix,marker,'2023-01-01 00:00:00']);
 }
 assert.equal(await repo.generateEstimationNumber(),ep+'10000');assert.equal(await repo.generateBunchCode(),bp+'10000');
 const inputs=()=>({title:marker,items:[{category:'Hardware',item_name:'Fixture handle',quantity:1,unit_cost:20,unit_of_measure:'Pc'}]});
 const estimates=await Promise.allSettled(Array.from({length:12},()=>service.createEstimation(inputs())));
 assert.ok(estimates.every(x=>x.status==='fulfilled'),JSON.stringify(estimates.filter(x=>x.status==='rejected').map(x=>x.reason.message)));
 const numbers=estimates.map(x=>x.value.estimation_number);
 assert.equal(new Set(numbers).size,12);assert.deepEqual(numbers.map(x=>Number(x.slice(ep.length))).sort((a,b)=>a-b),Array.from({length:12},(_,i)=>10000+i));
 assert.ok(estimates.every(x=>x.value.items.length===1));
 const batches=await Promise.allSettled(Array.from({length:12},()=>service.createRequestBunch({merchant_name:marker,items:[{product_name:marker},{product_name:marker+' second SKU'}]})));
 assert.ok(batches.every(x=>x.status==='fulfilled'),JSON.stringify(batches.filter(x=>x.status==='rejected').map(x=>x.reason.message)));
 assert.equal(new Set(batches.map(x=>x.value.bunch_code)).size,12);
 for(const {value:b} of batches){assert.equal(b.items.length,2);assert.ok(b.items.every(x=>/^[0-9]+$/.test(x.costing_code)&&x.product_code===x.costing_code));}
 assert.equal(new Set(batches.flatMap(x=>x.value.items.map(i=>i.costing_code))).size,24,'Concurrent numeric costing codes must be unique');
 const [beforeEst]=await pool.query('SELECT COUNT(*) AS n FROM cost_estimations WHERE title=?',[marker]);
 await assert.rejects(service.createEstimation({...inputs(),items:[{category:'INVALID_ENUM',item_name:'bad',quantity:1,unit_cost:1}]}));
 const [afterEst]=await pool.query('SELECT COUNT(*) AS n FROM cost_estimations WHERE title=?',[marker]);assert.equal(afterEst[0].n,beforeEst[0].n);await assertReleased('estimation');
 const [beforeBunch]=await pool.query('SELECT COUNT(*) AS n FROM costing_request_bunches WHERE merchant_name=?',[marker]);
 await assert.rejects(service.createRequestBunch({merchant_name:marker,items:[{product_name:'x'.repeat(300)}]}));
 const [afterBunch]=await pool.query('SELECT COUNT(*) AS n FROM costing_request_bunches WHERE merchant_name=?',[marker]);assert.equal(afterBunch[0].n,beforeBunch[0].n);await assertReleased('bunch');
 const retry=await service.createEstimation(inputs());assert.equal(retry.estimation_number,ep+'10012');
 const retryBunch=await service.createRequestBunch({merchant_name:marker,items:[{product_name:marker}]});assert.equal(retryBunch.bunch_code,bp+'10012');
 console.log('PASS: reproduced old collision; numeric maximum, timestamp ties, malformed suffixes, 9999 rollover, 12 concurrent EST saves, 12 concurrent BUN saves, SKU links, rollback and lock release/retry.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
 global.Date=RealDate;
 if(fixturePrefixReserved){
  await pool.query('DELETE cei FROM cost_estimation_items cei JOIN cost_estimations ce ON ce.id=cei.estimation_id WHERE ce.title=? AND ce.estimation_number LIKE ?',[marker,ep+'%']);
  await pool.query('DELETE FROM cost_estimations WHERE title=? AND estimation_number LIKE ?',[marker,ep+'%']);
  await pool.query('DELETE cri FROM costing_request_items cri JOIN costing_request_bunches b ON b.id=cri.bunch_id WHERE b.merchant_name=? AND b.bunch_code LIKE ?',[marker,bp+'%']);
  await pool.query('DELETE FROM costing_request_bunches WHERE merchant_name=? AND bunch_code LIKE ?',[marker,bp+'%']);
 }
 await pool.end();
});
