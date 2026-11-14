// Test-only DOM dependency: npm install --prefix /tmp/lii-search-test-deps --ignore-scripts jsdom
// Run: NODE_PATH=/tmp/lii-search-test-deps/node_modules node scripts/test-cross-page-search.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');
const { JSDOM } = require('jsdom');
const bundle = esbuild.buildSync({
  stdin: { contents: 'export {loadAllTablePages} from "./loadAllTablePages"; export {initTableEnhancer} from "./tableEnhancer";', resolveDir:path.resolve(__dirname,'../src/shared/utils'), loader:'ts' },
  bundle:true, write:false, platform:'browser', format:'iife', globalName:'searchTest',
}).outputFiles[0].text;

(async()=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>', {runScripts:'outside-only',url:'http://localhost'});
  const w=dom.window;
  try {
    w.eval(bundle);
    const {loadAllTablePages,initTableEnhancer}=w.searchTest;
    const rows=Array.from({length:621},(_,i)=>({id:String(i),title:`Task ${i}`,assignedToName:[73,519,620].includes(i)?'LATE USER':'FIRST USER'}));
    let calls=0;
    const all=await loadAllTablePages(async(page,size)=>{
      calls++; assert.equal(size,500);
      // Simulate server-side page-size cap; do not stop at the requested batch size.
      return {items:rows.slice((page-1)*53,page*53),totalItems:rows.length};
    });
    assert.equal(calls,12);assert.equal(all.length,621);
    assert.equal(new Set(all.map(r=>r.id)).size,621);
    assert.equal(all.filter(r=>r.assignedToName==='LATE USER').length,3);
    assert.equal((await loadAllTablePages(async()=>({items:[],totalItems:0}))).length,0);
    await assert.rejects(loadAllTablePages(async()=>({items:rows.slice(0,50),totalItems:621})),/changed while loading/);
    await assert.rejects(loadAllTablePages(async()=>{throw Error('API failure');}),/API failure/);
    let active=true;
    await assert.rejects(loadAllTablePages(async()=>{active=false;return {items:rows,totalItems:621};},()=>active),/cancelled/);

    for(const [type,title,userColumn] of [['delegation','Task Title','Assigned To'],['leads','Lead','Merchant']]){
      const table=w.document.createElement('table');table.id=type;table.dataset.filterAllPages='true';
      table.innerHTML=`<thead><tr><th>${title}</th><th data-always-filter="true">${userColumn}</th><th>Status</th></tr></thead><tbody></tbody>`;
      const body=table.querySelector('tbody');
      for(const row of all){const tr=w.document.createElement('tr');tr.dataset.id=row.id;tr.innerHTML=`<td>${title} ${row.id}</td><td>${row.assignedToName}</td><td>Pending</td>`;body.appendChild(tr);}
      w.document.body.appendChild(table);
    }
    initTableEnhancer();
    for(const type of ['delegation','leads']){
      const table=w.document.getElementById(type), enhancer=table.__enhancer;
      assert.ok(enhancer,'Existing table enhancer initialized');
      enhancer.applyAllFilters();
      const visible=()=>Array.from(table.tBodies[0].rows).filter(r=>!r.classList.contains('table-filter-no-results-row')&&r.style.display!=='none');
      assert.equal(visible().length,50);
      assert.ok(!visible().some(r=>r.dataset.id==='620'));
      const select=enhancer.selectElements.get(1);
      assert.ok(Array.from(select.options).some(o=>o.value==='LATE USER'),'Dropdown includes users outside page one');
      // Start on a later page; selecting a user must include matches from API pages 1 and 2.
      enhancer.currentPage=8;
      select.value='LATE USER';select.dispatchEvent(new w.Event('change',{bubbles:true}));
      assert.deepEqual(visible().map(r=>r.dataset.id),['73','519','620']);
      enhancer.searchInput.value='620';enhancer.searchInput.dispatchEvent(new w.Event('input',{bubbles:true}));
      assert.deepEqual(visible().map(r=>r.dataset.id),['620']);
      enhancer.resetBtn.click();assert.equal(visible().length,50);
      enhancer.currentPage=8;
      enhancer.searchInput.value='pending';enhancer.searchInput.dispatchEvent(new w.Event('input',{bubbles:true}));
      assert.equal(enhancer.currentPage,1,'New search starts on the first matching page');
      enhancer.resetBtn.click();
      enhancer.searchInput.value='late user';enhancer.searchInput.dispatchEvent(new w.Event('input',{bubbles:true}));
      assert.equal(visible().length,3);
      console.log(`PASS ${type}: user dropdown and free-text search find records beyond rows 50 and 500; pagination and Clear Filters work.`);
    }
    // Unrelated tables retain their existing search-page behavior (no opt-in attribute).
    const control=w.document.createElement('table');
    control.innerHTML='<thead><tr><th>Name</th></tr></thead><tbody>'+rows.slice(0,150).map(r=>`<tr><td>Control ${r.id}</td></tr>`).join('')+'</tbody>';
    w.document.body.appendChild(control);
    await new Promise(resolve=>w.setTimeout(resolve,0));
    const controlEnhancer=control.__enhancer;assert.ok(controlEnhancer);
    controlEnhancer.currentPage=2;
    controlEnhancer.searchInput.value='control';controlEnhancer.searchInput.dispatchEvent(new w.Event('input',{bubbles:true}));
    assert.equal(controlEnhancer.currentPage,2,'Unrelated table behavior remains unchanged');
    console.log('PASS all-page loader: capped API pages, deduplication, empty lists, incomplete-load rejection and stale-load cancellation. No database writes.');
  } finally {w.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
