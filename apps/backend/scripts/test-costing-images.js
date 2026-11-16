// Local-only integration test. Removes only its own UUID fixtures and uploads.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const { env } = require('../dist/config/env');
const { pool } = require('../dist/infrastructure/database/mysql/connection');
const { JwtService } = require('../dist/infrastructure/security/jwt.service');
const routes = require('../dist/modules/costing/presentation/routes/costing.routes').default;
const { errorHandlerMiddleware } = require('../dist/shared/middlewares/error-handler.middleware');
let server, base, token, fixtureId, imagePath;
const marker = `Costing image integration ${randomUUID()}`;
async function request(route, body) {
  return fetch(base + route, { method: body ? 'POST' : 'GET', headers: {
    Authorization: `Bearer ${token}`, ...(body ? {'Content-Type':'application/json'} : {}),
  }, body: body ? JSON.stringify(body) : undefined });
}
(async () => {
  assert.ok(['localhost','127.0.0.1','::1'].includes(env.db.host), 'Local database required');
  const [users] = await pool.query("SELECT id,email FROM users WHERE deleted_at IS NULL AND status='active' LIMIT 1");
  assert.ok(users[0]);
  token = JwtService.signAccessToken({sub:users[0].id,email:users[0].email,roles:[]});
  const app=express(); app.use(express.json());
  app.use('/uploads', express.static(path.resolve(__dirname,'../uploads')));
  app.use('/costing',routes); app.use(errorHandlerMiddleware);
  server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  base=`http://127.0.0.1:${server.address().port}`;
  // A valid PNG followed by padding, exceeding the old JSON request limit.
  const png=Buffer.concat([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64'),Buffer.alloc(300000)]);
  async function upload(buffer, auth=true) {
    const form=new FormData(); form.append('file',new Blob([buffer],{type:'image/png'}),'photo.png');
    return fetch(base+'/costing/images',{method:'POST',headers:auth?{Authorization:`Bearer ${token}`}:{},body:form});
  }
  assert.equal((await upload(png,false)).status,401);
  assert.equal((await upload(Buffer.from('not an image'))).status,400);
  assert.equal((await upload(Buffer.alloc(10*1024*1024+1))).status,400);
  const uploaded=await upload(png); assert.equal(uploaded.status,201);
  const url=(await uploaded.json()).data.url;
  assert.match(url,/^\/uploads\/costing\/[a-f0-9-]+\.png$/);
  imagePath=path.resolve(__dirname,'..'+url);
  assert.deepEqual(Buffer.from(await (await fetch(base+url)).arrayBuffer()),png);
  const snapshot={woodItems:[],imageUrl:url,expensesPct:0,cartons:[]};
  let result=await request('/costing/estimations',{title:marker,items:[],form_data:JSON.stringify(snapshot)});
  assert.equal(result.status,201); fixtureId=(await result.json()).data.id;
  let saved=(await (await request('/costing/estimations/'+fixtureId)).json()).data;
  assert.deepEqual(JSON.parse(saved.form_data),snapshot);
  // Older small embedded images remain readable without a bulk data rewrite.
  const legacy=JSON.stringify({...snapshot,imageUrl:'data:image/png;base64,'+png.subarray(0,68).toString('base64')});
  result=await fetch(base+'/costing/estimations/'+fixtureId,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({form_data:legacy})});
  assert.equal(result.status,200);
  saved=(await (await request('/costing/estimations/'+fixtureId)).json()).data;
  assert.equal(saved.form_data,legacy);
  result=await request('/costing/estimations',{title:marker,form_data:'x'.repeat(110000)});
  assert.equal(result.status,413); assert.equal((await result.json()).error.code,'PAYLOAD_TOO_LARGE');
  console.log('PASS: authenticated image upload >100KB, invalid/oversized rejection, exact static bytes, URL-only snapshot persistence, legacy image preservation, truthful 413 errors.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
  if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
  if(fixtureId)await pool.query('DELETE FROM cost_estimations WHERE id=? AND title=?',[fixtureId,marker]);
  if(imagePath)await fs.unlink(imagePath);
  await pool.end();
});
