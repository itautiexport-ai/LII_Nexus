// Local integration verification; modifies only uniquely named fixture estimations.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const express = require('express');
const { env } = require('../dist/config/env');
const { pool } = require('../dist/infrastructure/database/mysql/connection');
const { JwtService } = require('../dist/infrastructure/security/jwt.service');
const routes = require('../dist/modules/costing/presentation/routes/costing.routes').default;
let server, base, fixtureId;
const marker = `Costing integration ${randomUUID()}`;
let tokens;
async function start() {
  const app=express();app.use(express.json());app.use('/costing',routes);
  app.use((e,_req,res,_next)=>res.status(e.statusCode||500).json({error:{message:e.message}}));
  server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  base=`http://127.0.0.1:${server.address().port}/costing`;
}
async function close(){if(server){server.closeAllConnections();await new Promise(r=>server.close(r));server=null;}}
async function request(route,method='GET',body,actor='owner') {
  const res=await fetch(base+route,{method,headers:{...(actor?{Authorization:`Bearer ${tokens[actor]}`} : {}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  return {status:res.status,body:await res.json()};
}
(async()=>{
  assert.ok(['localhost','127.0.0.1','::1'].includes(env.db.host),'Local database required');
  const [users]=await pool.query("SELECT id,email,full_name FROM users WHERE deleted_at IS NULL AND status='active'");
  const ravi=users.find(u=>u.full_name.trim().toLowerCase()==='ravi utmani');
  const raj=users.find(u=>u.full_name.trim().toLowerCase()==='raj utmani');
  const owner=users.find(u=>!['ravi utmani','raj utmani'].includes(u.full_name.trim().toLowerCase()));
  assert.ok(ravi&&raj&&owner,'Existing local approver/non-approver accounts required');
  tokens=Object.fromEntries(Object.entries({owner,ravi,raj}).map(([name,u])=>[name,JwtService.signAccessToken({sub:u.id,email:u.email,roles:[]})]));
  await start();
  assert.equal((await request('/approval-authorities','GET',undefined,null)).status,401);
  const authorities=await request('/approval-authorities');
  assert.equal(authorities.status,200);
  assert.deepEqual(new Set(authorities.body.data.map(a=>a.id)),new Set([ravi.id,raj.id]));
  const snapshot={woodItems:[],metalSsItems:[{size:'15 x 15',thickness:'1.6',weight:4.04,rate:140}],hardwareItems:[],upholsteryItems:[],additionalItems:[],labourItems:[],polishItems:[],otherExpenseItems:[],cartons:[],packagingContainerTotal:0,packagingCustomAmount:null,forwardingContainerTotal:0,forwardingCustomAmount:null,expensesPct:0,summaryExpensesPct:0,usdExchangeRate:84,selectedCurrency:'INR',woodWastagePct:0,imageUrl:''};
  const form_data=JSON.stringify(snapshot);
  const created=await request('/estimations','POST',{title:marker,status:'Approved',form_data,notes:'User note',items:[{category:'Hardware',item_name:'Fixture handle',quantity:2,unit_of_measure:'Pcs',unit_cost:20}]});
  assert.equal(created.status,201,JSON.stringify(created.body));fixtureId=created.body.data.id;
  assert.equal(created.body.data.status,'Draft');assert.equal(created.body.data.form_data,form_data);
  const route='/estimations/'+fixtureId;
  assert.deepEqual(JSON.parse((await request(route)).body.data.form_data),snapshot);
  assert.equal((await request(route,'PUT',{notes:'Approval chat note'})).status,200);
  assert.equal((await request(route)).body.data.form_data,form_data);
  assert.equal((await request(route,'PUT',{form_data:'{bad json'})).status,400);
  assert.equal((await request(route,'PUT',{form_data:'[]'})).status,400);
  assert.equal((await request(route,'PUT',{status:'Approved'})).status,403);
  assert.equal((await request(route,'PUT',{status:'Rejected'})).status,403);
  assert.equal((await request(route,'PUT',{status:'In Review'})).status,400);
  assert.equal((await request(route,'PUT',{status:'In Review',approval_authority_id:owner.id})).status,400);
  assert.equal((await request(route,'PUT',{status:'In Review',approval_authority_id:'auth-ravi-utmani'})).status,400);
  const sent=await request(route,'PUT',{status:'In Review',approval_authority_id:ravi.id});
  assert.equal(sent.status,200);assert.equal(sent.body.data.approval_authority_id,ravi.id);
  assert.equal((await request(route,'PUT',{status:'Approved'},'raj')).status,200);
  assert.equal((await request(route,'PUT',{form_data:JSON.stringify({...snapshot,expensesPct:99})})).status,403);
  assert.equal((await request(route,'PUT',{status:'Draft'})).status,403);
  assert.equal((await request(route,'PUT',{notes:'Notes-only chat remains available'})).status,200);
  assert.equal((await request(route,'PUT',{status:'Rejected'},'ravi')).status,200);
  assert.equal((await request(route,'PUT',{status:'Draft'},'ravi')).status,200);
  const empty=JSON.stringify({...snapshot,metalSsItems:[]});
  assert.equal((await request(route,'PUT',{form_data:empty})).status,200);
  await close();await start();
  const reloaded=await request(route);assert.equal(reloaded.status,200);
  assert.equal(reloaded.body.data.form_data,empty);
  assert.equal(reloaded.body.data.approval_authority_id,ravi.id);
  console.log('PASS: snapshot round-trip (empty arrays/zeros/nulls), notes-only preservation, invalid JSON rejection, restart persistence, authenticated real approvers, invalid recipient rejection, ordinary-user approve/reject denial and finalized-data protection.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
  await close();
  if(fixtureId&&['localhost','127.0.0.1','::1'].includes(env.db.host))await pool.query('DELETE FROM cost_estimations WHERE id=? AND title=?',[fixtureId,marker]);
  await pool.end();
});
