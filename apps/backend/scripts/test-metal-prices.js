const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const express = require('express');
const { env } = require('../dist/config/env');
const { pool } = require('../dist/infrastructure/database/mysql/connection');
const { JwtService } = require('../dist/infrastructure/security/jwt.service');
const { authMiddleware } = require('../dist/shared/middlewares/auth.middleware');
const routes = require('../dist/modules/masterdata/presentation/routes/metalPrice.routes').default;
const source = require('./metal-prices-sheet.json');
let server, base, token;
const fixtureType = `Metal test ${randomUUID()}`;
async function start() {
  const app = express(); app.use(express.json());
  app.use('/metal-prices', authMiddleware, routes);
  app.use((e,_req,res,_next) => res.status(e.statusCode || 500).json({error:{message:e.message}}));
  server = await new Promise(resolve => { const s=app.listen(0,'127.0.0.1',()=>resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}/metal-prices`;
}
async function close() { if(server) {server.closeAllConnections();await new Promise(r=>server.close(r));server=null;} }
async function request(suffix='',method='GET',body,authenticated=true) {
  const r=await fetch(base+suffix,{method,headers:{...(authenticated?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  return {status:r.status,body:await r.json()};
}
(async()=>{
  assert.ok(['localhost','127.0.0.1','::1'].includes(env.db.host),'Local only');
  const [users]=await pool.query('SELECT id,email FROM users WHERE deleted_at IS NULL LIMIT 1');
  assert.ok(users.length);
  token=JwtService.signAccessToken({sub:users[0].id,email:users[0].email,roles:[]});
  await start();
  assert.equal((await request('', 'GET',undefined,false)).status,401);
  const list=await request();assert.equal(list.status,200);
  for(const p of source){const m=list.body.data.filter(r=>r.metalType===p.metalType&&r.pipeSize===p.pipeSize&&r.metalThickness===p.metalThickness&&r.pipeLength==='6000');assert.equal(m.length,1);for(const [k,v] of Object.entries(p))assert.equal(m[0][k],v,`${p.pipeSize} ${p.metalType} ${k}`);}
  assert.equal((await request('','POST',source[0])).status,409);
  assert.equal((await request('','POST',{...source[0],pipeSize:'15X15',pipeLength:'6000.0',metalThickness:'1.60'})).status,409);
  assert.equal((await request('','POST',{...source[0],rate:-1})).status,400);
  assert.equal((await request('','POST',{...source[0],pipeLength:'invalid'})).status,400);
  const created=await request('','POST',{...source[0],metalType:fixtureType});
  assert.equal(created.status,201);const id=created.body.data.id;
  const updated=await request('/'+id,'PUT',{...source[0],metalType:fixtureType,weight:'9.99'});
  assert.equal(updated.status,200);assert.equal(updated.body.data.weight,'9.99');
  const conflicting=await request('/'+id,'PUT',source[0]);assert.equal(conflicting.status,409);
  const imported=await request('/import-browser','POST',{records:[source[0],{...source[0],metalType:fixtureType,weight:'1'}]});
  assert.equal(imported.status,200);assert.deepEqual(imported.body.data,{inserted:0,skipped:2});
  await close();await start();
  assert.equal((await request()).body.data.find(p=>p.id===id).weight,'9.99');
  assert.equal((await request('/'+id,'DELETE')).status,200);
  assert.ok(!(await request()).body.data.some(p=>p.id===id));
  const [retained]=await pool.query('SELECT deleted_at FROM master_metal_prices WHERE id=?',[id]);assert.ok(retained[0].deleted_at);
  assert.equal((await request('/'+id,'PUT',{...source[0],metalType:fixtureType})).status,404);
  console.log('PASS: all 52 exact API records, unauthenticated rejection, create/edit, duplicate normalization, validation, non-destructive browser import, restart persistence and recoverable deletion.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
  await close();
  if(['localhost','127.0.0.1','::1'].includes(env.db.host)) await pool.query('DELETE FROM master_metal_prices WHERE metal_type=?',[fixtureType]);
  await pool.end();
});
