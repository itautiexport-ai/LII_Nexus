// Local-only API regression test; deletes only its UUID fixtures.
const assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),express=require('express');
const {env}=require('../dist/config/env'),{pool}=require('../dist/infrastructure/database/mysql/connection');
const {JwtService}=require('../dist/infrastructure/security/jwt.service');
const routes=require('../dist/modules/costing/presentation/routes/costing.routes').default;
let server,bunchId,estimationId;
const marker=`Approval regression ${randomUUID()}`;

// Check the real frontend visibility helper as well as the server enforcement.
const fs=require('node:fs'),pathModule=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const clientSource=fs.readFileSync(pathModule.resolve(__dirname,'../../frontend/src/modules/costing/api/costingApi.ts'),'utf8');
const helper=clientSource.match(/export const isDirectorApprover = [\s\S]*?\n};/)[0];
const helperJs=ts.transpileModule(helper.replace('export const','var'),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const context={};vm.createContext(context);vm.runInContext(helperJs,context);
for(const name of ['RAVI UTMANI',' Raj Utmani '])assert.equal(context.isDirectorApprover({fullName:name}),true);
for(const user of [null,{fullName:'System Administrator',email:'admin@example.com',roles:['Director']},{fullName:'Ravi Kumar'},{fullName:'Rajesh Sharma'},{fullName:'Other',email:'raj@example.com',roles:['CEO']}])assert.equal(context.isDirectorApprover(user),false);

(async()=>{
 assert.ok(['localhost','127.0.0.1','::1'].includes(env.db.host),'Local DB only');
 const [users]=await pool.query("SELECT id,email,full_name FROM users WHERE deleted_at IS NULL AND status='active'");
 const named=name=>users.find(u=>u.full_name.trim().toLowerCase()===name);
 const ravi=named('ravi utmani'),raj=named('raj utmani');
 const others=users.filter(u=>!['ravi utmani','raj utmani'].includes(u.full_name.trim().toLowerCase()));
 assert.ok(ravi&&raj&&others.length);const owner=others[0];
 const tokens=Object.fromEntries(users.map(u=>[u.id,JwtService.signAccessToken({sub:u.id,email:u.email,roles:[]})]));
 const app=express();app.use(express.json());app.use('/costing',routes);
 app.use((e,_req,res,_next)=>res.status(e.statusCode||500).json({error:{message:e.message}}));
 server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const base=`http://127.0.0.1:${server.address().port}/costing`;
 async function request(path,method,body,actor=owner){
  const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(actor?{Authorization:`Bearer ${tokens[actor.id]}`}:{})},body:JSON.stringify(body)});
  return {status:res.status,body:await res.json()};
 }
 const created=await request('/requests/bunch','POST',{merchant_name:marker,items:[{product_name:marker}]});
 assert.equal(created.status,201,JSON.stringify(created.body));bunchId=created.body.data.id;
 const item=created.body.data.items[0];assert.ok(item);
 // Unique fixture number keeps this authorization test independent of production numbering.
 estimationId=randomUUID();const estimationNumber=`TEST-${randomUUID()}`;
 await pool.query('INSERT INTO cost_estimations (id,estimation_number,title,created_by) VALUES (?,?,?,?)',[estimationId,estimationNumber,marker,owner.id]);
 const path=`/requests/items/${item.id}/stage`;
 const stage=(value,actor,extra={})=>request(path,'PATCH',{stage:value,...extra},actor);
 assert.equal((await stage('Approved',null)).status,401);
 assert.equal((await stage('invalid',owner)).status,400);
 assert.equal((await stage('In Progress',owner)).status,200);
 assert.equal((await stage('In Review',owner,{estimationId,estimationNumber,finalPrice:1250})).status,200);
 for(const actor of others){
  assert.equal((await stage('Approved',actor,{actorUserId:ravi.id,userId:ravi.id})).status,403);
  assert.equal((await stage('Rejected',actor)).status,403);
 }
 for(const actor of [ravi,raj])for(const value of ['Approved','Rejected']){
  assert.equal((await stage(value,actor)).status,200);
  const [linked]=await pool.query('SELECT status FROM cost_estimations WHERE id=?',[estimationId]);assert.equal(linked[0].status,value);
  assert.equal((await stage('Pending',owner,{finalPrice:1})).status,403);
  const [saved]=await pool.query('SELECT stage,final_price FROM costing_request_items WHERE id=?',[item.id]);
  assert.equal(saved[0].stage,value);assert.equal(Number(saved[0].final_price),1250);
 }
 await pool.query("UPDATE costing_request_items SET stage='Pending' WHERE id=?",[item.id]);
 assert.equal((await stage('In Progress',owner)).status,403);
 assert.equal((await stage('In Review',ravi)).status,200);
 console.log(`PASS: ${others.length} non-authority users denied (including spoofing); Ravi/Raj approve/reject; linked status sync, invalid stages, anonymous access and finalized protection.`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
 if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
 if(['localhost','127.0.0.1','::1'].includes(env.db.host)){
  if(bunchId){await pool.query('DELETE FROM costing_request_items WHERE bunch_id=?',[bunchId]);await pool.query('DELETE FROM costing_request_bunches WHERE id=? AND merchant_name=?',[bunchId,marker]);}
  if(estimationId){await pool.query('DELETE FROM cost_estimation_items WHERE estimation_id=?',[estimationId]);await pool.query('DELETE FROM cost_estimations WHERE id=? AND title=?',[estimationId,marker]);}
 }
 await pool.end();
});
