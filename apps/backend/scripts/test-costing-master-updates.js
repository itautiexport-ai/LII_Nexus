// Local-only regression; removes only its own fixtures.
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {env} = require('../dist/config/env');
const {pool} = require('../dist/infrastructure/database/mysql/connection');
const {MySqlCostingRepository} = require('../dist/modules/costing/infrastructure/MySqlCostingRepository');
const {CostingService} = require('../dist/modules/costing/application/services/CostingService');
const repo = new MySqlCostingRepository(), service = new CostingService(repo);
const marker = `Costing master regression ${randomUUID()}`;
let bunch, estimation;
(async () => {
  assert.ok(['localhost','127.0.0.1','::1'].includes(env.db.host) && env.nodeEnv !== 'production');
  const photos = ['/uploads/costing/front.png','/uploads/costing/side.png'];
  bunch = await service.createRequestBunch({merchant_name:marker,items:[{product_name:marker,buyer_code:'BUYER-TEST',image_urls:photos,target_price:75,target_currency:'USD'}]});
  const item = bunch.items[0];
  assert.match(item.costing_code,/^[0-9]+$/);
  assert.equal(item.product_code,item.costing_code);
  assert.deepEqual(typeof item.image_urls==='string'?JSON.parse(item.image_urls):item.image_urls,photos);
  assert.equal(Number(item.target_price),75);
  const snapshot = {imageUrl:photos[0],imageUrls:photos,woodItems:[],summaryExpensesPct:20,buyerQuotes:[{amount:80,currency:'USD',note:'first'},{amount:90,currency:'USD',note:'latest'}]};
  estimation = await service.createEstimation({title:marker,form_data:JSON.stringify(snapshot),items:[]});
  await pool.query('UPDATE costing_request_items SET estimation_id=?, estimation_number=? WHERE id=?',[estimation.id,estimation.estimation_number,item.id]);
  const edited = await service.updateRequestItemDetails(item.id,{product_name:marker+' edited',buyer_code:'BUYER-NEW',target_price:65,target_currency:'EUR'});
  assert.equal(Number(edited.target_price),65);
  let saved = await repo.findEstimationById(estimation.id);
  let data = typeof saved.form_data==='string'?JSON.parse(saved.form_data):saved.form_data;
  assert.equal(data.targetPrice,65); assert.equal(data.targetCurrency,'EUR'); assert.equal(data.buyerCode,'BUYER-NEW');
  assert.deepEqual(data.imageUrls,photos); assert.deepEqual(data.buyerQuotes,snapshot.buyerQuotes);
  let items=await repo.findRequestItems(marker);
  assert.equal(items.find(x=>x.id===item.id).latest_buyer_quote.amount,90);
  await service.updateRequestItemDetails(item.id,{target_price:null});
  saved=await repo.findEstimationById(estimation.id);data=JSON.parse(saved.form_data);
  assert.equal(data.targetPrice,'');
  assert.equal((await repo.findRequestItemById(item.id)).buyer_code,'BUYER-NEW');
  assert.deepEqual(data.imageUrls,photos);
  console.log('PASS: numeric request codes, multi-photo persistence, target-price edit/clear, linked snapshot preservation and latest buyer quote history.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{
  if(bunch){await pool.query('DELETE FROM costing_request_items WHERE bunch_id=?',[bunch.id]);await pool.query('DELETE FROM costing_request_bunches WHERE id=?',[bunch.id]);}
  if(estimation){await pool.query('DELETE FROM cost_estimation_items WHERE estimation_id=?',[estimation.id]);await pool.query('DELETE FROM cost_estimations WHERE id=?',[estimation.id]);}
  await pool.end();
});
