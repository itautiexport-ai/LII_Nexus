// npm install --prefix /tmp/lii-responsive-tests --ignore-scripts playwright
// NODE_PATH=/tmp/lii-responsive-tests/node_modules node scripts/test-responsive-table-scroll.cjs
// Uses installed Chrome; override CHROMIUM_EXECUTABLE on other systems.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const esbuild = require('esbuild');
const bundle = esbuild.buildSync({
  stdin: { contents: 'import {initTableEnhancer} from "./tableEnhancer"; import {initSelectEnhancer} from "./selectEnhancer"; initSelectEnhancer(); initTableEnhancer();', resolveDir: path.resolve(__dirname, '../src/shared/utils'), loader: 'ts' },
  bundle: true, write: false, platform: 'browser', format: 'iife',
}).outputFiles[0].text;
const responsiveCss = fs.readFileSync(path.resolve(__dirname, '../src/shared/styles/mobileResponsive.css'), 'utf8');
const cell = (text, left) => `<td style="${left === undefined ? '' : `position:sticky;left:${left}px;z-index:20;`}background:white">${text}</td>`;
const rows = Array.from({ length: 100 }, (_, i) => `<tr>${cell(i + 1, 0)}${cell(`REF-${i}`, 44)}${cell(`Product ${i}`, 184)}${Array.from({ length: 8 }, (_, j) => cell(`Doer ${j} / Task ${i}`)).join('')}</tr>`).join('');
const html = `<!doctype html><html><head><style>${responsiveCss}
  body{margin:0;font:14px Arial}.admin-content{height:100vh;overflow:auto}.content-inner{padding:12px;overflow-x:auto}
  th,td{border:1px solid #cbd5e1;box-sizing:border-box;padding:12px;height:56px;white-space:nowrap}th{background:#e2e8f0}
  .table-scroll-test table{width:1584px;table-layout:fixed}
  </style></head><body><main class="admin-content"><div class="content-inner"><section style="overflow:hidden">
  <header style="height:180px"><h1>Responsive table test</h1><p>Page scrolling and compact sticky filters</p></header>
  <div style="overflow-x:auto"><div class="table-scroll-test" style="overflow:auto;max-height:72vh;min-width:900px">
  <table data-filter-all-pages="true"><colgroup><col style="width:44px"><col style="width:140px"><col style="width:160px">${'<col style="width:155px">'.repeat(8)}</colgroup>
  <thead><tr><th></th><th>INFO</th><th>DETAILS</th><th colspan="8">STEP 1</th></tr>
  <tr><th></th><th>Reference</th><th>Alias</th>${'<th>Doer / Plan Date</th>'.repeat(8)}</tr></thead><tbody>${rows}</tbody></table>
  </div></div></section></div></main></body></html>`;

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try {
    for (const viewport of [{ width: 1366, height: 650 }, { width: 1024, height: 600 }, { width: 768, height: 600 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      await page.setContent(html);
      await page.addScriptTag({ content: bundle });
      const search = page.getByPlaceholder('Search in table...');
      await search.fill(''); // Exercise existing filtering/pagination initialization.
      const wrapper = page.locator('.table-page-scroll');
      const initial = await wrapper.evaluate(e => ({ height: e.clientHeight, contentHeight: e.scrollHeight }));
      assert(initial.contentHeight <= initial.height + 2, 'Table must not have an inner vertical scrollbar');
      await page.locator('main').evaluate(e => { e.scrollTop = 700; });
      await page.waitForTimeout(50);
      const layout = await page.evaluate(() => {
        const bar = document.querySelector('.table-page-filter-bar').getBoundingClientRect();
        return { top: bar.top, height: bar.height, right: bar.right, mainScroll: document.querySelector('main').scrollTop, headerTop: document.querySelector('thead').getBoundingClientRect().top };
      });
      assert(layout.mainScroll > 0, 'Page must scroll');
      assert(Math.abs(layout.top) <= 2, 'Filter bar must stick to the page top');
      assert(layout.right <= viewport.width + 1, 'Filters must fit the screen');
      assert(layout.height < 160, 'Filters must leave room for tasks');
      assert(layout.headerTop < 0, 'Only filters should remain vertically pinned');
      const before = await page.locator('tbody tr').first().locator('td').nth(2).boundingBox();
      await wrapper.evaluate(e => { e.scrollLeft = 400; });
      const after = await page.locator('tbody tr').first().locator('td').nth(2).boundingBox();
      assert(Math.abs(before.x - after.x) < 2, 'Horizontal DETAILS freeze must survive');
      if (viewport.width <= 768) {
        await page.getByRole('button', { name: /^Filters/ }).click();
        assert(await page.locator('.table-selects-container').isVisible(), 'Mobile filters must open');
        assert(await page.locator('.table-selects-container').evaluate(e => e.scrollWidth > e.clientWidth), 'Extra mobile filters must scroll horizontally');
      }
      await search.fill('REF-99');
      const visible = await page.locator('tbody tr').evaluateAll(rows => rows.filter(r => r.style.display !== 'none').map(r => r.textContent));
      assert.equal(visible.length, 1);
      assert(visible[0].includes('REF-99'), 'Search must reach later pages');
      await page.getByRole('button', { name: 'Clear Filters', exact: true }).click();
      console.log(`PASS ${viewport.width}x${viewport.height}: page scroll, sticky compact filters, horizontal freeze, mobile controls and cross-page search.`);
      await page.close();
    }
  } finally { await browser.close(); }
}
module.exports = { html, bundle };
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
